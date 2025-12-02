'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function resolveServiceAccountPath() {
  const envPath = process.env.SERVICE_ACCOUNT_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const defaultPath = path.resolve(process.cwd(), 'agritectum-platform-firebase-adminsdk-fbsvc-54a6dc422d.json');
  if (fs.existsSync(defaultPath)) return defaultPath;
  throw new Error('Service account JSON not found. Set SERVICE_ACCOUNT_PATH to an absolute path or use ADC.');
}

async function init() {
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

(async () => {
  const db = await init();
  const snap = await db.collection('reports').get();
  const byCreatorId = new Map();
  const byCreatorEmail = new Map();
  const byCreatorName = new Map();

  function inc(map, key) {
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  }

  for (const doc of snap.docs) {
    const d = doc.data() || {};
    inc(byCreatorId, d.createdBy || d.creatorId || d.userId);
    inc(byCreatorEmail, d.createdByEmail || d.creatorEmail || d.email);
    inc(byCreatorName, d.createdByName || d.creatorName || d.userName);
  }

  function top(map, n = 50) {
    return Array.from(map.entries())
      .filter(([k]) => !!k)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => ({ key: k, count: v }));
  }

  console.log(JSON.stringify({
    totalReports: snap.size,
    topCreatorIds: top(byCreatorId),
    topCreatorEmails: top(byCreatorEmail),
    topCreatorNames: top(byCreatorName),
  }, null, 2));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });


