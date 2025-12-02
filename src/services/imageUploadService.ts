import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { AppError, ErrorCodes, getErrorMessage, logError } from '../utils/errorHandler';

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number; // in MB
  maxImages?: number;
}

export interface ImageUploadResult {
  url: string;
  name: string;
  size: number;
  compressed: boolean;
}

export interface ImageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxFileSize: 5, // 5MB
  maxImages: 20,
};

/**
 * Compress an image file while maintaining aspect ratio
 */
export const compressImage = (
  file: File,
  options: Partial<ImageUploadOptions> = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // If file is already small enough and under size limit, return as is
    if (file.size <= opts.maxFileSize * 1024 * 1024 && file.type === 'image/jpeg') {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        opts.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Upload a single image to Firebase Storage
 */
export const uploadImageToStorage = async (
  file: File,
  reportId: string,
  issueId: string,
  onProgress?: (progress: ImageUploadProgress) => void
): Promise<ImageUploadResult> => {
  try {
    // Compress the image
    const compressedFile = await compressImage(file);

    // Create storage reference
    const fileName = `${Date.now()}_${compressedFile.name}`;
    const storageRef = ref(storage, `reports/${reportId}/issues/${issueId}/${fileName}`);

    // Upload with progress tracking
    const uploadTask = uploadBytes(storageRef, compressedFile);

    // Note: uploadBytes doesn't support progress tracking directly
    // We'll simulate progress for better UX
    let progressInterval: NodeJS.Timeout;

    if (onProgress) {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 20, 90);
        onProgress({
          loaded: (progress / 100) * compressedFile.size,
          total: compressedFile.size,
          percentage: progress,
        });
      }, 100);
    }

    const snapshot = await uploadTask;

    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    if (onProgress) {
      onProgress({
        loaded: compressedFile.size,
        total: compressedFile.size,
        percentage: 100,
      });
    }

    return {
      url: downloadURL,
      name: fileName,
      size: compressedFile.size,
      compressed: compressedFile.size < file.size,
    };
  } catch (error) {
    logError(error as Error, 'imageUploadService.uploadImageToStorage');
    throw new AppError(ErrorCodes.FILE_UPLOAD_FAILED, getErrorMessage(error), {
      reportId,
      issueId,
      fileName: file.name,
    });
  }
};

/**
 * Delete an image from Firebase Storage
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

    if (!pathMatch) {
      throw new Error('Invalid image URL');
    }

    const imagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, imagePath);

    await deleteObject(imageRef);
  } catch (error) {
    logError(error as Error, 'imageUploadService.deleteImageFromStorage');
    // Don't throw error for deletion failures to avoid breaking the UI
  }
};

/**
 * Validate image file
 */
export const validateImageFile = (
  file: File,
  options: Partial<ImageUploadOptions> = {}
): string | null => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file';
  }

  // Check file size
  if (file.size > opts.maxFileSize * 1024 * 1024) {
    return `Image must be smaller than ${opts.maxFileSize}MB`;
  }

  // Check if it's a supported format
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return 'Please select a JPEG, PNG, or WebP image';
  }

  return null;
};

/**
 * Get image dimensions for validation
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};
