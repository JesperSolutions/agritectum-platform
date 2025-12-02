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
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Customer, User } from '../types';

// Helper function to remove undefined fields
const removeUndefinedFields = (obj: any): any => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

// Create a new customer
export const createCustomer = async (
  customerData: Omit<Customer, 'id' | 'totalReports' | 'totalRevenue'>
): Promise<string> => {
  try {
    const customersRef = collection(db, 'customers');
    const customerWithDefaults = {
      ...customerData,
      totalReports: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
    };
    
    // Remove undefined fields to prevent Firestore errors
    const cleanData = removeUndefinedFields(customerWithDefaults);
    
    const docRef = await addDoc(customersRef, cleanData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
};

// Get all customers (with optional branch filtering)
export const getCustomers = async (branchId?: string): Promise<Customer[]> => {
  try {
    const customersRef = collection(db, 'customers');
    let q;

    if (branchId) {
      // Filter by branch if branchId is provided
      q = query(customersRef, where('branchId', '==', branchId));
    } else {
      // Get all customers if no branchId provided
      q = query(customersRef);
    }

    const querySnapshot = await getDocs(q);

    // Sort by name on the client side to avoid composite index requirement
    const customers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];

    return customers.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
};

// Get customer by ID
export const getCustomerById = async (customerId: string): Promise<Customer | null> => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);

    if (!customerSnap.exists()) {
      return null;
    }

    return { id: customerSnap.id, ...customerSnap.data() } as Customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
};

// Search customers by name, email, phone, or address (with optional branch filtering)
export const searchCustomers = async (
  searchTerm: string,
  branchId?: string
): Promise<Customer[]> => {
  try {
    const customersRef = collection(db, 'customers');
    let q;

    if (branchId) {
      // Filter by branch if branchId is provided
      q = query(customersRef, where('branchId', '==', branchId));
    } else {
      // Get all customers if no branchId provided
      q = query(customersRef);
    }

    const querySnapshot = await getDocs(q);

    const allCustomers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];

    // Filter by search term (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    return allCustomers.filter(
      customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.address?.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('Error searching customers:', error);
    throw new Error('Failed to search customers');
  }
};

// Update customer
export const updateCustomer = async (
  customerId: string,
  updates: Partial<Customer>,
  currentUser?: User
): Promise<void> => {
  try {
    // Safety validation: Check if branch admin is trying to edit customer outside their branch
    if (currentUser && currentUser.role === 'branchAdmin') {
      const customer = await getCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Branch admin can only edit customers in their branch
      if (customer.branchId !== currentUser.branchId) {
        throw new Error('Cannot edit customer outside your branch');
      }
      
      // Prevent changing branchId for branch admins
      if (updates.branchId && updates.branchId !== currentUser.branchId) {
        throw new Error('Cannot change customer branch assignment');
      }
    }
    
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      ...updates,
      lastEdited: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    // Re-throw with the original error message if it's our validation error
    if (error.message?.includes('Cannot edit') || error.message?.includes('Customer not found')) {
      throw error;
    }
    throw new Error('Failed to update customer');
  }
};

// Delete customer
export const deleteCustomer = async (
  customerId: string,
  currentUser?: User
): Promise<void> => {
  try {
    // Force token refresh FIRST
    const { logger } = await import('../utils/logger');
    logger.debug('Refreshing auth token before deletion...');
    const auth = getAuth();
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      logger.debug('Token refreshed');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // JUST DELETE IT
    logger.debug(`Deleting customer: ${customerId}`);
    const customerRef = doc(db, 'customers', customerId);
    await deleteDoc(customerRef);
    logger.debug('Customer deleted');
  } catch (error: any) {
    const { logger } = await import('../utils/logger');
    logger.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
};

// Update customer stats when report is created/updated/deleted
export const updateCustomerStats = async (
  customerId: string,
  reportValue: number,
  isDelete: boolean = false
): Promise<void> => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) return;

    const newTotalReports = isDelete
      ? Math.max(0, customer.totalReports - 1)
      : customer.totalReports + 1;

    const newTotalRevenue = isDelete
      ? Math.max(0, customer.totalRevenue - reportValue)
      : customer.totalRevenue + reportValue;

    await updateCustomer(customerId, {
      totalReports: newTotalReports,
      totalRevenue: newTotalRevenue,
      lastReportDate: isDelete ? customer.lastReportDate : new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating customer stats:', error);
    // Don't throw error as this is a background operation
  }
};

// Find or create customer from report data
export const findOrCreateCustomer = async (reportData: {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  createdBy: string;
  branchId?: string;
}): Promise<string> => {
  try {
    // First, try to find existing customer by email or phone
    if (reportData.customerEmail || reportData.customerPhone) {
      const customers = await searchCustomers(reportData.customerName, reportData.branchId);
      const existingCustomer = customers.find(
        customer =>
          customer.email === reportData.customerEmail || customer.phone === reportData.customerPhone
      );

      if (existingCustomer) {
        return existingCustomer.id;
      }
    }

    // If no existing customer found, create a new one
    const customerData: Omit<Customer, 'id' | 'totalReports' | 'totalRevenue'> = {
      name: reportData.customerName,
      email: reportData.customerEmail,
      phone: reportData.customerPhone,
      address: reportData.customerAddress,
      createdBy: reportData.createdBy,
      branchId: reportData.branchId,
      notes: '',
      createdAt: new Date().toISOString(),
    };

    return await createCustomer(customerData);
  } catch (error) {
    console.error('Error finding or creating customer:', error);
    throw new Error('Failed to find or create customer');
  }
};
