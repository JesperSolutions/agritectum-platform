import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// One-time backfill: convert ISO string dates to Firestore Timestamps for reports
// Usage: call via HTTPS with optional ?dryRun=true

export const backfillReportTimestamps = functions.https.onRequest(async (req, res) => {
  try {
    const dryRun = (req.query.dryRun as string) === 'true';
    const db = admin.firestore();

    const pageSize = 300;
    let processed = 0;
    let updated = 0;

    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    // Page through all reports
    while (true) {
      let query = db.collection('reports').orderBy(admin.firestore.FieldPath.documentId()).limit(pageSize);
      if (lastDoc) query = query.startAfter(lastDoc.id);

      const snap = await query.get();
      if (snap.empty) break;

      const batch = db.batch();

      snap.docs.forEach(docSnap => {
        processed++;
        const data = docSnap.data() as any;

        const needsCreated = typeof data.createdAt === 'string';
        const needsEdited = typeof data.lastEdited === 'string';

        if (!needsCreated && !needsEdited) return;

        const updates: Record<string, any> = {};

        if (needsCreated) {
          const d = new Date(data.createdAt);
          if (!isNaN(d.getTime())) {
            updates.createdAt = admin.firestore.Timestamp.fromDate(d);
          }
        }
        if (needsEdited) {
          const d = new Date(data.lastEdited);
          if (!isNaN(d.getTime())) {
            updates.lastEdited = admin.firestore.Timestamp.fromDate(d);
          }
        }

        if (Object.keys(updates).length > 0) {
          updated++;
          if (!dryRun) batch.update(docSnap.ref, updates);
        }
      });

      if (!dryRun) await batch.commit();
      lastDoc = snap.docs[snap.docs.length - 1];
    }

    res.json({ success: true, processed, updated, dryRun });
  } catch (err: any) {
    console.error('Backfill error', err);
    res.status(500).json({ success: false, error: err?.message || 'Unknown error' });
  }
});





