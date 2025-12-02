import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Customer, User } from '../types';

/**
 * Register a new customer account (self-registration)
 */
export const registerCustomer = async (
  email: string,
  password: string,
  displayName: string,
  phone?: string,
  address?: string
): Promise<{ user: User; customerId: string }> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name
    if (displayName) {
      await updateProfile(firebaseUser, { displayName });
    }

    // Check if customer record already exists
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    let customerId: string;
    let customerData: Customer;

    if (!querySnapshot.empty) {
      // Link to existing customer record
      const existingCustomer = querySnapshot.docs[0];
      customerId = existingCustomer.id;
      customerData = { id: customerId, ...existingCustomer.data() } as Customer;

      // Update customer record with UID
      await updateDoc(doc(db, 'customers', customerId), {
        uid: firebaseUser.uid,
        userId: firebaseUser.uid,
        isRegistered: true,
        email: email,
        phone: phone || customerData.phone,
        address: address || customerData.address,
      });
    } else {
      // Create new customer record
      const customerDoc = await addDoc(customersRef, {
        name: displayName,
        email: email,
        phone: phone,
        address: address,
        customerType: 'individual',
        uid: firebaseUser.uid,
        userId: firebaseUser.uid,
        isRegistered: true,
        totalReports: 0,
        totalRevenue: 0,
        buildings: [],
        createdAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
      });
      customerId = customerDoc.id;
    }

    // Create user document in users collection
    const userDoc = await addDoc(collection(db, 'users'), {
      uid: firebaseUser.uid,
      email: email,
      displayName: displayName,
      role: 'customer',
      permissionLevel: -1,
      customerId: customerId,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    // Call Cloud Function to set custom claims
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agritectum-platform';
      // Use the deployed function URL
      const functionUrl = `https://europe-west1-${projectId}.cloudfunctions.net/createCustomerWithAuth`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: email,
          displayName: displayName,
          customerId: customerId,
          phone: phone,
          address: address,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Cloud Function returned error:', errorData);
      }
    } catch (error) {
      console.warn('Failed to set custom claims via Cloud Function:', error);
      // Continue anyway - claims can be set later via admin script or manual process
    }

    return {
      user: {
        uid: firebaseUser.uid,
        email: email,
        displayName: displayName,
        role: 'customer',
        permissionLevel: -1,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
      },
      customerId,
    };
  } catch (error: any) {
    console.error('Error registering customer:', error);
    throw new Error(error.message || 'Failed to register customer');
  }
};

/**
 * Link an existing customer record to a new account
 */
export const linkCustomerToAccount = async (
  customerId: string,
  email: string,
  password: string
): Promise<void> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get customer record
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('Customer record not found');
    }

    const customerData = customerDoc.data() as Customer;

    // Update customer record
    await updateDoc(customerRef, {
      uid: firebaseUser.uid,
      userId: firebaseUser.uid,
      isRegistered: true,
      email: email,
    });

    // Create user document
    await addDoc(collection(db, 'users'), {
      uid: firebaseUser.uid,
      email: email,
      displayName: customerData.name,
      role: 'customer',
      permissionLevel: -1,
      customerId: customerId,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error linking customer to account:', error);
    throw new Error(error.message || 'Failed to link customer to account');
  }
};

/**
 * Get customer by user ID
 */
export const getCustomerByUserId = async (uid: string): Promise<Customer | null> => {
  try {
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const customerDoc = querySnapshot.docs[0];
    return {
      id: customerDoc.id,
      ...customerDoc.data(),
    } as Customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
};

