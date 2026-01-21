import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Callable function to normalize legacy string timestamps on offers to Firestore Timestamps
export const backfillOfferTimestamps = functions.https.onCall(async (_data, context) => {
  // Restrict to admins only
  if (!context.auth || !context.auth.token || !(context.auth.token as any).admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
  }

  const db = admin.firestore();
  const batch = db.batch();
  const offersSnap = await db.collection('offers').get();

  let updatedCount = 0;
  for (const doc of offersSnap.docs) {
    const offer = doc.data() as any;
    const update: Record<string, any> = {};

    // sentAt
    if (offer.sentAt && !offer.sentAt.toDate) {
      const parsed = new Date(offer.sentAt);
      if (!isNaN(parsed.getTime())) {
        update.sentAt = admin.firestore.Timestamp.fromDate(parsed);
      }
    }

    // updatedAt
    if (offer.updatedAt && !offer.updatedAt.toDate) {
      const parsed = new Date(offer.updatedAt);
      if (!isNaN(parsed.getTime())) {
        update.updatedAt = admin.firestore.Timestamp.fromDate(parsed);
      }
    }

    // createdAt
    if (offer.createdAt && !offer.createdAt.toDate) {
      const parsed = new Date(offer.createdAt);
      if (!isNaN(parsed.getTime())) {
        update.createdAt = admin.firestore.Timestamp.fromDate(parsed);
      }
    }

    // validUntil
    if (offer.validUntil && !offer.validUntil.toDate) {
      const parsed = new Date(offer.validUntil);
      if (!isNaN(parsed.getTime())) {
        update.validUntil = admin.firestore.Timestamp.fromDate(parsed);
      }
    }

    if (Object.keys(update).length > 0) {
      batch.update(doc.ref, update);
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await batch.commit();
  }

  return { success: true, updatedCount };
});
