import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Branch, Employee, User, canAccessAllBranches } from '../types';
import { logger } from '../utils/logger';

type MinimalUserContext = Pick<User, 'permissionLevel' | 'branchId'>;

export const getBranches = async (user?: MinimalUserContext): Promise<Branch[]> => {
  try {
    // Superadmins (or callers without user context) query all branches
    if (!user || canAccessAllBranches(user.permissionLevel)) {
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      const branches: Branch[] = [];
      querySnapshot.forEach(docSnap => {
        branches.push({ id: docSnap.id, ...docSnap.data() } as Branch);
      });

      return branches;
    }

    // Branch admins/inspectors can only see their own branch
    if (user.branchId) {
      const branch = await getBranch(user.branchId);
      return branch ? [branch] : [];
    }

    logger.warn('getBranches called without branchId for limited-permission user');
    return [];
  } catch (error: any) {
    logger.error('Error fetching branches:', error);
    // If user doesn't have permission to read all branches, return empty array
    // This happens for branch admins who can only read their own branch
    if (error.code === 'permission-denied') {
      logger.warn('User does not have permission to read requested branches');
      return [];
    }
    throw new Error('Failed to fetch branches');
  }
};

export const getBranch = async (branchId: string): Promise<Branch | null> => {
  try {
    const branchRef = doc(db, 'branches', branchId);
    const branchSnap = await getDoc(branchRef);

    if (!branchSnap.exists()) {
      return null;
    }

    return { id: branchSnap.id, ...branchSnap.data() } as Branch;
  } catch (error) {
    logger.error('Error fetching branch:', error);
    throw new Error('Failed to fetch branch');
  }
};

// Alias for consistency
export const getBranchById = getBranch;

export const createBranch = async (branchData: Omit<Branch, 'id'>): Promise<string> => {
  try {
    const branchesRef = collection(db, 'branches');
    const docRef = await addDoc(branchesRef, branchData);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating branch:', error);
    throw new Error('Failed to create branch');
  }
};

export const updateBranch = async (branchId: string, updates: Partial<Branch>): Promise<void> => {
  try {
    const branchRef = doc(db, 'branches', branchId);
    await updateDoc(branchRef, updates);
  } catch (error) {
    logger.error('Error updating branch:', error);
    throw new Error('Failed to update branch');
  }
};

export const deleteBranch = async (branchId: string): Promise<void> => {
  try {
    const branchRef = doc(db, 'branches', branchId);
    await deleteDoc(branchRef);
  } catch (error) {
    logger.error('Error deleting branch:', error);
    throw new Error('Failed to delete branch');
  }
};

export const getBranchEmployees = async (branchId: string): Promise<Employee[]> => {
  try {
    const employeesRef = collection(db, 'branches', branchId, 'employees');
    const querySnapshot = await getDocs(employeesRef);

    const employees: Employee[] = [];
    querySnapshot.forEach(docSnap => {
      employees.push({ id: docSnap.id, ...docSnap.data() } as Employee);
    });

    return employees;
  } catch (error) {
    logger.error('Error fetching branch employees:', error);
    throw new Error('Failed to fetch branch employees');
  }
};
