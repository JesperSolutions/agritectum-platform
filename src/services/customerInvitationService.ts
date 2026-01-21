import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface CustomerInvitation {
  id: string;
  customerId: string;
  customerName: string;
  companyId: string;
  branchId: string;
  email?: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
  usedAt?: Date;
  usedBy?: string;
  status: 'pending' | 'used' | 'expired';
}

const INVITATIONS_COLLECTION = 'customerInvitations';
const DEFAULT_EXPIRY_DAYS = 14; // 2 weeks

/**
 * Generate a unique invitation token
 */
const generateToken = (): string => {
  return uuidv4().replace(/-/g, '');
};

/**
 * Create a new customer invitation
 */
export const createCustomerInvitation = async (
  customerId: string,
  customerName: string,
  branchId: string,
  createdBy: string,
  email?: string,
  expiryDays: number = DEFAULT_EXPIRY_DAYS
): Promise<CustomerInvitation> => {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const invitation: CustomerInvitation = {
    id: token,
    customerId,
    customerName,
    companyId: customerId, // Customer ID is also the company ID for portal access
    branchId,
    email,
    token,
    expiresAt,
    createdAt: now,
    createdBy,
    status: 'pending',
  };

  await setDoc(doc(db, INVITATIONS_COLLECTION, token), {
    ...invitation,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: Timestamp.fromDate(now),
  });

  return invitation;
};

/**
 * Get invitation by token
 */
export const getInvitationByToken = async (token: string): Promise<CustomerInvitation | null> => {
  const docRef = doc(db, INVITATIONS_COLLECTION, token);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    usedAt: data.usedAt?.toDate?.() || (data.usedAt ? new Date(data.usedAt) : undefined),
  } as CustomerInvitation;
};

/**
 * Validate invitation token
 */
export const validateInvitation = async (
  token: string
): Promise<{
  valid: boolean;
  invitation?: CustomerInvitation;
  error?: string;
}> => {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return { valid: false, error: 'Invitation not found' };
  }

  if (invitation.status === 'used') {
    return { valid: false, error: 'Invitation has already been used', invitation };
  }

  if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
    return { valid: false, error: 'Invitation has expired', invitation };
  }

  return { valid: true, invitation };
};

/**
 * Mark invitation as used
 */
export const markInvitationUsed = async (token: string, userId: string): Promise<void> => {
  const docRef = doc(db, INVITATIONS_COLLECTION, token);
  await setDoc(
    docRef,
    {
      status: 'used',
      usedAt: Timestamp.fromDate(new Date()),
      usedBy: userId,
    },
    { merge: true }
  );
};

/**
 * Get all invitations for a customer
 */
export const getInvitationsForCustomer = async (
  customerId: string
): Promise<CustomerInvitation[]> => {
  const q = query(collection(db, INVITATIONS_COLLECTION), where('customerId', '==', customerId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      usedAt: data.usedAt?.toDate?.() || (data.usedAt ? new Date(data.usedAt) : undefined),
    } as CustomerInvitation;
  });
};

/**
 * Delete an invitation
 */
export const deleteInvitation = async (token: string): Promise<void> => {
  await deleteDoc(doc(db, INVITATIONS_COLLECTION, token));
};

/**
 * Generate the signup URL for an invitation
 */
export const getSignupUrl = (token: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/portal/signup/${token}`;
};

/**
 * Clean up expired invitations (can be called periodically)
 */
export const cleanupExpiredInvitations = async (): Promise<number> => {
  const now = Timestamp.fromDate(new Date());
  const q = query(
    collection(db, INVITATIONS_COLLECTION),
    where('status', '==', 'pending'),
    where('expiresAt', '<', now)
  );

  const snapshot = await getDocs(q);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    await setDoc(
      doc(db, INVITATIONS_COLLECTION, docSnap.id),
      { status: 'expired' },
      { merge: true }
    );
    count++;
  }

  return count;
};
