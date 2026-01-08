'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function resolveServiceAccountPath() {
  const envPath = process.env.SERVICE_ACCOUNT_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const defaultPath = path.resolve(process.cwd(), 'taklaget-service-app-firebase-adminsdk-fbsvc-54a6dc422d.json');
  if (fs.existsSync(defaultPath)) return defaultPath;
  throw new Error('Service account JSON not found. Set SERVICE_ACCOUNT_PATH to an absolute path or use ADC.');
}

async function initializeAdmin() {
  const saPath = resolveServiceAccountPath();
  const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  return admin.firestore();
}

async function countCollection(db, colRef) {
  try {
    // Aggregate count api
    const agg = await colRef.count().get();
    return agg.data().count || 0;
  } catch (e) {
    // Fallback: limited scan if count aggregation unavailable
    const snap = await colRef.limit(1001).get();
    return snap.size; // approximate up to 1000
  }
}

async function getSampleDoc(colRef) {
  const snap = await colRef.orderBy(admin.firestore.FieldPath.documentId()).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, data: doc.data() };
}

async function inspectRootCollections(db) {
  const rootCols = await db.listCollections();
  const results = [];
  for (const col of rootCols) {
    const count = await countCollection(db, col);
    const sample = await getSampleDoc(col);
    results.push({ name: col.id, scope: 'root', count, sample });
  }
  return results;
}

async function inspectCollectionGroups(db, groupNames) {
  const results = [];
  for (const name of groupNames) {
    const cg = db.collectionGroup(name);
    let count = 0;
    try {
      const agg = await cg.count().get();
      count = agg.data().count || 0;
    } catch (e) {
      const snap = await cg.limit(1001).get();
      count = snap.size;
    }
    let sample = null;
    try {
      const sampleSnap = await cg.orderBy(admin.firestore.FieldPath.documentId()).limit(1).get();
      if (!sampleSnap.empty) {
        const d = sampleSnap.docs[0];
        sample = { id: d.id, data: d.data() };
      }
    } catch (e) {
      // ignore
    }
    results.push({ name, scope: 'collectionGroup', count, sample });
  }
  return results;
}

(async () => {
  const db = await initializeAdmin();
  const groupNames = [
    'reports',
    'appointments',
    'offers',
    'notifications',
    'employees',
    'emailLogs',
    'email-logs',
    'mail',
  ];

  const [rootResults, groupResults] = await Promise.all([
    inspectRootCollections(db),
    inspectCollectionGroups(db, groupNames),
  ]);

  const projectId = admin.app().options.projectId;
  const output = {
    projectId,
    timestamp: new Date().toISOString(),
    rootCollections: rootResults.sort((a, b) => a.name.localeCompare(b.name)),
    collectionGroups: groupResults.sort((a, b) => a.name.localeCompare(b.name)),
  };

  // Redact large docs
  for (const section of [output.rootCollections, output.collectionGroups]) {
    for (const entry of section) {
      if (entry.sample && entry.sample.data) {
        const keys = Object.keys(entry.sample.data);
        const limited = {};
        for (const k of keys.slice(0, 8)) limited[k] = entry.sample.data[k];
        entry.sample.data = limited;
      }
    }
  }

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
})().catch((err) => {
  console.error('Inspector error:', err && err.stack ? err.stack : err);
  process.exit(1);
});


