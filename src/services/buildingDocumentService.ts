import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, DocumentReference } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { BuildingDocument } from '../types';
import { logger } from '../utils/logger';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
export const MAX_DOCUMENTS = 5;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx'];

export interface DocumentUploadValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, currentDocumentCount: number): DocumentUploadValidation {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds 3MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      errors.push(`File type not allowed. Supported: PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX`);
    }
  }

  // Check document count limit
  if (currentDocumentCount >= MAX_DOCUMENTS) {
    errors.push(`Maximum ${MAX_DOCUMENTS} documents allowed per building`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Upload document to Firebase Storage and create metadata in Firestore
 */
export async function uploadBuildingDocument(
  buildingId: string,
  file: File,
  userId: string
): Promise<BuildingDocument> {
  try {
    // Validate file
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingSnap = await getDoc(buildingRef);
    const currentDocuments = (buildingSnap.data()?.documents || []) as BuildingDocument[];

    const validation = validateFile(file, currentDocuments.length);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Create unique document ID
    const docId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const storagePath = `buildings/${buildingId}/documents/${docId}-${file.name}`;

    // Upload file to storage
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      customMetadata: {
        buildingId,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Create document metadata
    const document: BuildingDocument = {
      id: docId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: snapshot.ref.fullPath,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
    };

    // Add document metadata to Firestore
    await updateDoc(buildingRef, {
      documents: arrayUnion(document),
    });

    logger.log('📄 Building document uploaded:', {
      buildingId,
      documentId: docId,
      fileName: file.name,
      fileSize: file.size,
    });

    return document;
  } catch (error) {
    logger.error('❌ Failed to upload building document:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Delete document from Firebase Storage and Firestore
 */
export async function deleteBuildingDocument(
  buildingId: string,
  document: BuildingDocument,
  userId: string
): Promise<void> {
  try {
    // Delete from storage
    const storageRef = ref(storage, document.storagePath);
    await deleteObject(storageRef);

    // Remove from Firestore
    const buildingRef = doc(db, 'buildings', buildingId);
    await updateDoc(buildingRef, {
      documents: arrayRemove(document),
    });

    logger.log('🗑️ Building document deleted:', {
      buildingId,
      documentId: document.id,
      fileName: document.fileName,
    });
  } catch (error) {
    logger.error('❌ Failed to delete building document:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Get download URL for a building document
 */
export async function getBuildingDocumentUrl(storagePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    logger.error('❌ Failed to get document URL:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
