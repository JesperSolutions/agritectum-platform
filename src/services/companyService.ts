import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Company } from '../types';

const removeUndefinedFields = <T extends Record<string, unknown>>(data: T): T => {
  const cleanedEntries = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});

  return cleanedEntries as T;
};

// Get company by ID
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);

    if (!companyDoc.exists()) {
      return null;
    }

    return {
      id: companyDoc.id,
      ...companyDoc.data(),
    } as Company;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw new Error('Failed to fetch company');
  }
};

// Get companies by customer ID (companies where customer is a member)
export const getCompaniesByCustomer = async (customerId: string): Promise<Company[]> => {
  try {
    // Note: This requires a user document lookup to get companyId
    // For now, we'll query all companies and filter client-side
    // In production, you might want to maintain a companies/{companyId}/members/{userId} subcollection
    const companiesRef = collection(db, 'companies');
    const snapshot = await getDocs(companiesRef);
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];

    // Filter companies where the customer is a member
    // This is a simplified approach - in production, you'd query user documents
    // or maintain a members subcollection
    return companies;
  } catch (error) {
    console.error('Error fetching companies by customer:', error);
    throw new Error('Failed to fetch companies by customer');
  }
};

// Get all companies (with optional branch filtering)
export const getCompanies = async (branchId?: string): Promise<Company[]> => {
  try {
    const companiesRef = collection(db, 'companies');
    let q;

    if (branchId) {
      q = query(
        companiesRef,
        where('branchId', '==', branchId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        companiesRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    
    // Handle missing index error
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⚠️ Missing Firestore index detected. Falling back to client-side filtering.');
      const companiesRef = collection(db, 'companies');
      const snapshot = await getDocs(companiesRef);
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];

      const filtered = branchId 
        ? companies.filter(company => company.branchId === branchId && company.isActive)
        : companies.filter(company => company.isActive);

      return filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    throw new Error('Failed to fetch companies');
  }
};

// Create a new company
export const createCompany = async (
  companyData: Omit<Company, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const companiesRef = collection(db, 'companies');
    const companyWithDefaults = {
      ...companyData,
      isActive: companyData.isActive !== undefined ? companyData.isActive : true,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    };

    const sanitizedCompany = removeUndefinedFields(companyWithDefaults);

    const docRef = await addDoc(companiesRef, sanitizedCompany);
    return docRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw new Error('Failed to create company');
  }
};

// Update a company
export const updateCompany = async (
  companyId: string,
  updates: Partial<Company>
): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const companyRef = doc(db, 'companies', companyId);
    const sanitizedUpdates = removeUndefinedFields(updates);

    await updateDoc(companyRef, sanitizedUpdates);
  } catch (error) {
    console.error('Error updating company:', error);
    throw new Error('Failed to update company');
  }
};

// Delete a company (soft delete by setting isActive to false)
export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User must be authenticated');
    }

    const companyRef = doc(db, 'companies', companyId);
    // Soft delete by setting isActive to false
    await updateDoc(companyRef, { isActive: false });
  } catch (error) {
    console.error('Error deleting company:', error);
    throw new Error('Failed to delete company');
  }
};


