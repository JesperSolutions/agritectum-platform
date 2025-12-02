/**
 * Consolidated Firestore Client
 * 
 * Centralizes common Firestore operations to reduce code duplication
 * and ensure consistent query patterns across the application.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

/**
 * Generic function to get a single document
 */
export const getDocument = async <T = DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as T;
  } catch (error) {
    console.error(`Error getting document ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

/**
 * Generic function to get documents from a collection with filters
 */
export const getDocuments = async <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 
      ? query(collectionRef, ...constraints)
      : query(collectionRef);
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Create a new document
 */
export const createDocument = async <T = DocumentData>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> => {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, data as DocumentData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update a document
 */
export const updateDocument = async <T = Partial<DocumentData>>(
  collectionName: string,
  documentId: string,
  updates: T
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, updates as DocumentData);
  } catch (error) {
    console.error(`Error updating document ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  collectionName: string,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

/**
 * Query builder helpers
 */
export const QueryBuilder = {
  /**
   * Filter by field
   */
  where: (field: string, operator: '<' | '<=' | '==' | '!=' | '>=' | '>', value: any) =>
    where(field, operator, value),

  /**
   * Order by field
   */
  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') =>
    orderBy(field, direction),

  /**
   * Limit results
   */
  limit: (count: number) => limit(count),
};

/**
 * Get documents filtered by branch (common pattern)
 */
export const getDocumentsByBranch = async <T = DocumentData>(
  collectionName: string,
  branchId: string,
  additionalConstraints: QueryConstraint[] = [],
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<T[]> => {
  const constraints: QueryConstraint[] = [
    QueryBuilder.where('branchId', '==', branchId),
    QueryBuilder.orderBy(orderByField, orderDirection),
    ...additionalConstraints,
  ];
  
  return getDocuments<T>(collectionName, constraints);
};

/**
 * Get documents for a user based on their role and branch
 */
export const getDocumentsForUser = async <T = DocumentData>(
  collectionName: string,
  user: User,
  options: {
    creatorField?: string; // Field name for creator (e.g., 'createdBy')
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
  } = {}
): Promise<T[]> => {
  const {
    creatorField = 'createdBy',
    orderByField = 'createdAt',
    orderDirection = 'desc',
    limitCount,
  } = options;

  const constraints: QueryConstraint[] = [];

  // Superadmin: no branch filter
  if (user.permissionLevel < 2) {
    // Branch Admin and Inspector: filter by branch
    if (user.branchId) {
      constraints.push(QueryBuilder.where('branchId', '==', user.branchId));
    }
  }

  // Inspector: filter by creator
  if (user.permissionLevel === 0 && creatorField) {
    constraints.push(QueryBuilder.where(creatorField, '==', user.uid));
  }

  // Order by
  constraints.push(QueryBuilder.orderBy(orderByField, orderDirection));

  // Limit
  if (limitCount) {
    constraints.push(QueryBuilder.limit(limitCount));
  }

  return getDocuments<T>(collectionName, constraints);
};

/**
 * Check if document exists
 */
export const documentExists = async (
  collectionName: string,
  documentId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`Error checking document existence ${collectionName}/${documentId}:`, error);
    return false;
  }
};

/**
 * Search documents by field (case-insensitive text search)
 * Note: Firestore doesn't support full-text search natively.
 * This is a simple prefix match. For better search, consider Algolia or Elasticsearch.
 */
export const searchDocuments = async <T = DocumentData>(
  collectionName: string,
  searchField: string,
  searchTerm: string,
  additionalConstraints: QueryConstraint[] = []
): Promise<T[]> => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  // Firestore only supports prefix matching for text search
  // For better results, consider implementing full-text search
  const searchLower = searchTerm.toLowerCase();
  const searchUpper = searchTerm.toLowerCase() + '\uf8ff';

  const constraints: QueryConstraint[] = [
    QueryBuilder.where(searchField, '>=', searchLower),
    QueryBuilder.where(searchField, '<=', searchUpper),
    ...additionalConstraints,
  ];

  return getDocuments<T>(collectionName, constraints);
};



