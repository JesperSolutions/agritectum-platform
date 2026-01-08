import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Offer, OfferStatus, OfferStatusHistory, User } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Create a new offer from a report
 */
export const createOffer = async (
  reportId: string,
  offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'publicLink' | 'emailSent' | 'followUpAttempts'>
): Promise<string> => {
  try {
    // Validate that the report exists and user has access
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (!reportSnap.exists()) {
      throw new Error('Report not found');
    }
    
    const report = reportSnap.data();
    const userBranchId = offerData.branchId;
    const userPermissionLevel = offerData.createdBy ? undefined : 0; // Can't determine from offerData alone
    
    // Validate branch access (unless superadmin - they can create offers for any report)
    // Note: This is a best-effort client-side validation. Firestore rules provide the real security.
    // If branchId doesn't match and user isn't "main" branch, log a warning but proceed
    // Firestore rules will block if unauthorized
    if (userBranchId && userBranchId !== 'main' && report.branchId && report.branchId !== userBranchId) {
      console.warn(`Warning: Attempting to create offer for report in different branch. User branch: ${userBranchId}, Report branch: ${report.branchId}`);
    }
    
    // Generate unique public link
    const publicLink = `offer/${reportId}_${Date.now()}`;
    
    const offer: Omit<Offer, 'id'> = {
      ...offerData,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          changedBy: offerData.createdBy,
          changedByName: offerData.createdByName,
          reason: 'Offer created',
        },
      ],
      publicLink,
      emailSent: false,
      followUpAttempts: 0,
      // Store as Firestore server timestamps for consistency with Cloud Functions
      createdAt: serverTimestamp() as unknown as string,
      updatedAt: serverTimestamp() as unknown as string,
    };

    // Normalize validUntil to Firestore Timestamp if provided as string/date
    if ((offer as any).validUntil && typeof (offer as any).validUntil === 'string') {
      (offer as any).validUntil = Timestamp.fromDate(new Date((offer as any).validUntil));
    }

    const offersRef = collection(db, 'offers');
    const docRef = await addDoc(offersRef, offer);
    
    // Link the offer back to the report
    await linkOfferToReport(docRef.id, reportId, 'pending');
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating offer:', error);
    if (error instanceof Error && error.message === 'Report not found') {
      throw error;
    }
    throw new Error('Failed to create offer');
  }
};

/**
 * Get offers based on user permissions
 */
export const getOffers = async (user: User): Promise<Offer[]> => {
  try {
    const offersRef = collection(db, 'offers');
    let q;

    if (user.permissionLevel === 2) {
      // Superadmin: see all offers
      q = query(offersRef, orderBy('createdAt', 'desc'));
    } else if (user.permissionLevel === 1 && user.branchId) {
      // Branch Admin: see offers in their branch
      q = query(
        offersRef,
        where('branchId', '==', user.branchId),
        orderBy('createdAt', 'desc')
      );
    } else if (user.branchId && user.uid) {
      // Inspector: see only their own offers
      q = query(
        offersRef,
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      return [];
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Offer[];
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw new Error('Failed to fetch offers');
  }
};

/**
 * Get a single offer by ID
 */
export const getOffer = async (offerId: string): Promise<Offer | null> => {
  try {
    const offerRef = doc(db, 'offers', offerId);
    const offerSnap = await getDoc(offerRef);

    if (!offerSnap.exists()) {
      return null;
    }

    return { id: offerSnap.id, ...offerSnap.data() } as Offer;
  } catch (error) {
    console.error('Error fetching offer:', error);
    throw new Error('Failed to fetch offer');
  }
};

/**
 * Update offer status with history tracking
 */
export const updateOfferStatus = async (
  offerId: string,
  status: OfferStatus,
  changedBy: string,
  changedByName: string,
  reason?: string
): Promise<void> => {
  try {
    const offerRef = doc(db, 'offers', offerId);
    const offer = await getOffer(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    const statusHistory: OfferStatusHistory = {
      status,
      timestamp: new Date().toISOString(),
      changedBy,
      changedByName,
      reason,
    };

    await updateDoc(offerRef, {
      status,
      statusHistory: [...offer.statusHistory, statusHistory],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating offer status:', error);
    throw new Error('Failed to update offer status');
  }
};

/**
 * Send offer to customer (trigger email)
 */
export const sendOfferToCustomer = async (offerId: string): Promise<void> => {
  try {
    const offer = await getOffer(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Add to mail collection for Trigger Email extension
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: offer.customerEmail,
      template: {
        name: 'offer-sent',
        data: {
          customerName: offer.customerName,
          offerTitle: offer.title,
          offerDescription: offer.description,
          totalAmount: offer.totalAmount,
          currency: offer.currency,
          validUntil: offer.validUntil,
          publicLink: `${window.location.origin}/offer/public/${offerId}`,
        },
      },
    });

    // Update offer
    const offerRef = doc(db, 'offers', offerId);
    await updateDoc(offerRef, {
      emailSent: true,
      sentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update status
    await updateOfferStatus(
      offerId,
      'pending',
      offer.createdBy,
      offer.createdByName,
      'Offer sent to customer'
    );
  } catch (error) {
    console.error('Error sending offer to customer:', error);
    throw new Error('Failed to send offer to customer');
  }
};

/**
 * Customer accepts offer
 */
export const acceptOffer = async (
  offerId: string,
  customerData?: {
    name?: string;
    email?: string;
    phone?: string;
  }
): Promise<void> => {
  try {
    const offer = await getOffer(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Update offer
    const offerRef = doc(db, 'offers', offerId);
    await updateDoc(offerRef, {
      customerResponse: 'accept',
      customerResponseAt: serverTimestamp(),
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update status
    await updateOfferStatus(
      offerId,
      'accepted',
      'customer',
      customerData?.name || offer.customerName,
      'Customer accepted the offer'
    );

    // Send confirmation email to inspector
    const mailRef = collection(db, 'mail');
    const inspectorEmail = await getUserEmailByUid(offer.createdBy);
    await addDoc(mailRef, {
      to: inspectorEmail || undefined,
      template: {
        name: 'offer-accepted',
        data: {
          customerName: offer.customerName,
          offerTitle: offer.title,
          totalAmount: offer.totalAmount,
          currency: offer.currency,
        },
      },
    });
  } catch (error) {
    console.error('Error accepting offer:', error);
    throw new Error('Failed to accept offer');
  }
};

/**
 * Customer rejects offer
 */
export const rejectOffer = async (
  offerId: string,
  reason: string,
  customerData?: {
    name?: string;
    email?: string;
  }
): Promise<void> => {
  try {
    const offer = await getOffer(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Update offer
    const offerRef = doc(db, 'offers', offerId);
    await updateDoc(offerRef, {
      customerResponse: 'reject',
      customerResponseReason: reason,
      customerResponseAt: serverTimestamp(),
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update status
    await updateOfferStatus(
      offerId,
      'rejected',
      'customer',
      customerData?.name || offer.customerName,
      `Customer rejected: ${reason}`
    );

    // Send notification email to inspector
    const mailRef = collection(db, 'mail');
    const inspectorEmail = await getUserEmailByUid(offer.createdBy);
    await addDoc(mailRef, {
      to: inspectorEmail || undefined,
      template: {
        name: 'offer-rejected',
        data: {
          customerName: offer.customerName,
          offerTitle: offer.title,
          rejectionReason: reason,
        },
      },
    });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    throw new Error('Failed to reject offer');
  }
};

/**
 * Resolve user's email from users collection by UID
 */
const getUserEmailByUid = async (uid: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return data?.email ?? null;
  } catch (err) {
    console.error('Failed to resolve user email by UID:', err);
    return null;
  }
};

/**
 * Extend offer validity period
 */
export const extendOfferValidity = async (
  offerId: string,
  newValidUntil: string,
  changedBy: string,
  changedByName: string
): Promise<void> => {
  try {
    const offerRef = doc(db, 'offers', offerId);
    await updateDoc(offerRef, {
      validUntil: Timestamp.fromDate(new Date(newValidUntil)),
      updatedAt: serverTimestamp(),
    });

    // Add to status history
    const offer = await getOffer(offerId);
    if (offer) {
      const statusHistory: OfferStatusHistory = {
        status: offer.status,
        timestamp: new Date().toISOString(),
        changedBy,
        changedByName,
        reason: `Offer validity extended to ${newValidUntil}`,
      };

      await updateDoc(offerRef, {
        statusHistory: [...offer.statusHistory, statusHistory],
      });
    }
  } catch (error) {
    console.error('Error extending offer validity:', error);
    throw new Error('Failed to extend offer validity');
  }
};

/**
 * Send reminder to customer
 */
export const sendReminderToCustomer = async (offerId: string): Promise<void> => {
  try {
    const offer = await getOffer(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    // Calculate days since sent
    // Support both Firestore Timestamp and legacy string date
    const sentDate = (offer as any).sentAt && typeof (offer as any).sentAt?.toDate === 'function'
      ? (offer as any).sentAt.toDate()
      : new Date((offer as any).sentAt);
    const now = new Date();
    const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Add to mail collection
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: offer.customerEmail,
      template: {
        name: 'offer-reminder',
        data: {
          customerName: offer.customerName,
          offerTitle: offer.title,
          totalAmount: offer.totalAmount,
          currency: offer.currency,
          daysSinceSent,
          validUntil: offer.validUntil,
          publicLink: `${window.location.origin}/offer/public/${offerId}`,
        },
      },
    });

    // Update offer
    const offerRef = doc(db, 'offers', offerId);
    await updateDoc(offerRef, {
      followUpAttempts: offer.followUpAttempts + 1,
      lastFollowUpAt: serverTimestamp(),
      status: 'awaiting_response',
      updatedAt: serverTimestamp(),
    });

    // Update status history
    await updateOfferStatus(
      offerId,
      'awaiting_response',
      'system',
      'System',
      `Reminder sent after ${daysSinceSent} days`
    );
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw new Error('Failed to send reminder');
  }
};

/**
 * Get offers by status
 */
export const getOffersByStatus = async (
  status: OfferStatus,
  user: User
): Promise<Offer[]> => {
  try {
    const offersRef = collection(db, 'offers');
    let q;

    if (user.permissionLevel === 2) {
      // Superadmin: see all offers
      q = query(
        offersRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else if (user.permissionLevel === 1 && user.branchId) {
      // Branch Admin: see offers in their branch
      q = query(
        offersRef,
        where('branchId', '==', user.branchId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else if (user.branchId && user.uid) {
      // Inspector: see only their own offers
      q = query(
        offersRef,
        where('createdBy', '==', user.uid),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      return [];
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Offer[];
  } catch (error) {
    console.error('Error fetching offers by status:', error);
    throw new Error('Failed to fetch offers by status');
  }
};

/**
 * Get offers needing follow-up (older than 7 days)
 */
export const getOffersNeedingFollowUp = async (user: User): Promise<Offer[]> => {
  try {
    const offers = await getOffers(user);
    const now = new Date();

    return offers.filter(offer => {
      if (offer.status !== 'pending' && offer.status !== 'awaiting_response') {
        return false;
      }

      const sentDate = new Date(offer.sentAt);
      const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

      return daysSinceSent >= 7 && offer.followUpAttempts < 3;
    });
  } catch (error) {
    console.error('Error fetching offers needing follow-up:', error);
    throw new Error('Failed to fetch offers needing follow-up');
  }
};

/**
 * Check if a report has an associated offer
 */
export const reportHasOffer = async (reportId: string, userBranchId?: string): Promise<boolean> => {
  try {
    const offersRef = collection(db, 'offers');
    
    // Build query based on user permissions
    let q;
    if (userBranchId) {
      // Filter by branch for branch-specific users
      q = query(
        offersRef, 
        where('reportId', '==', reportId),
        where('branchId', '==', userBranchId)
      );
    } else {
      // For superadmins, query all offers
      q = query(offersRef, where('reportId', '==', reportId));
    }
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if report has offer:', error);
    return false;
  }
};

/**
 * Get offer by report ID
 */
export const getOfferByReportId = async (reportId: string, userBranchId?: string): Promise<Offer | null> => {
  try {
    const offersRef = collection(db, 'offers');
    
    // Build query based on user permissions
    let q;
    if (userBranchId) {
      // Filter by branch for branch-specific users
      q = query(
        offersRef, 
        where('reportId', '==', reportId),
        where('branchId', '==', userBranchId)
      );
    } else {
      // For superadmins, query all offers
      q = query(offersRef, where('reportId', '==', reportId));
    }
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const offerDoc = querySnapshot.docs[0];
    return {
      id: offerDoc.id,
      ...offerDoc.data(),
    } as Offer;
  } catch (error) {
    console.error('Error getting offer by report ID:', error);
    return null;
  }
};

/**
 * Get reports that need offers created
 */
export const getReportsNeedingOffers = async (branchId: string): Promise<any[]> => {
  try {
    const { collection: firestoreCollection, query: firestoreQuery, where: firestoreWhere, getDocs: firestoreGetDocs } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    
    // Get all completed reports for the branch
    const reportsRef = firestoreCollection(db, 'reports');
    const q = firestoreQuery(
      reportsRef,
      firestoreWhere('branchId', '==', branchId),
      firestoreWhere('status', 'in', ['completed', 'sent'])
    );
    const querySnapshot = await firestoreGetDocs(q);
    
    // Filter out reports that already have offers
    const reportsWithoutOffers: any[] = [];
    for (const doc of querySnapshot.docs) {
      const reportData: any = doc.data();
      const report = { id: doc.id, ...reportData };
      if (!reportData.offerId) {
        reportsWithoutOffers.push(report);
      }
    }
    
    // Sort by completion date (oldest first)
    return reportsWithoutOffers.sort((a, b) => {
      const dateA = new Date(a.lastEdited || a.createdAt).getTime();
      const dateB = new Date(b.lastEdited || b.createdAt).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error('Error getting reports needing offers:', error);
    throw new Error('Failed to get reports needing offers');
  }
};

/**
 * Link offer to report (update both documents)
 */
export const linkOfferToReport = async (offerId: string, reportId: string, offerStatus: string): Promise<void> => {
  try {
    const { doc: firestoreDoc, updateDoc: firestoreUpdateDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    
    // Update report with offer information
    const reportRef = firestoreDoc(db, 'reports', reportId);
    await firestoreUpdateDoc(reportRef, {
      offerId,
      offerCreatedAt: serverTimestamp(),
      offerStatus,
    });
  } catch (error) {
    console.error('Error linking offer to report:', error);
    throw new Error('Failed to link offer to report');
  }
};

/**
 * Public accept/reject for unauthenticated users (calls Cloud Function)
 */
export const respondToOfferPublic = async (
  offerId: string,
  action: 'accept' | 'reject',
  reason?: string,
  customerData?: { name?: string; email?: string; phone?: string }
): Promise<void> => {
  try {
    const functions = getFunctions();
    const fn = httpsCallable(functions, 'publicRespondToOffer');
    await fn({ offerId, action, reason, customerData });
  } catch (err: any) {
    throw new Error(err && err.message ? err.message : 'Failed to respond to offer');
  }
};

/**
 * Delete an offer
 */
export const deleteOffer = async (offerId: string, user: User): Promise<void> => {
  try {
    // Verify offer exists and user has access
    const offerRef = doc(db, 'offers', offerId);
    const offerSnap = await getDoc(offerRef);
    
    if (!offerSnap.exists()) {
      throw new Error('Offer not found');
    }
    
    const offer = offerSnap.data() as Offer;
    
    // Check branch access (unless superadmin)
    if (user.permissionLevel !== 2 && offer.branchId !== user.branchId && user.branchId !== 'main') {
      throw new Error('You do not have permission to delete this offer');
    }
    
    // Delete the offer document
    await deleteDoc(offerRef);
    
    // Optionally remove offerId from associated report if it exists
    if (offer.reportId) {
      try {
        const reportRef = doc(db, 'reports', offer.reportId);
        const reportSnap = await getDoc(reportRef);
        if (reportSnap.exists()) {
          await updateDoc(reportRef, {
            offerId: null,
            offerStatus: null,
          });
        }
      } catch (error) {
        // Log but don't fail if report update fails
        console.warn('Failed to remove offer reference from report:', error);
      }
    }
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    throw new Error(error.message || 'Failed to delete offer');
  }
};