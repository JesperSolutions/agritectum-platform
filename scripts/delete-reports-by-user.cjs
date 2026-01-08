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

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
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

async function findUserCandidates(db, queryName, queryEmail) {
  const usersSnap = await db.collection('users').get();
  const candidates = [];
  const nameNeedle = normalizeName(queryName);
  const emailNeedle = (queryEmail || '').toLowerCase();
  usersSnap.forEach((doc) => {
    const u = doc.data() || {};
    const display = normalizeName(u.displayName);
    const email = (u.email || '').toLowerCase();
    if (
      (nameNeedle && (display === nameNeedle || display.includes(nameNeedle))) ||
      (emailNeedle && email.includes(emailNeedle))
    ) {
      candidates.push({ id: doc.id, ...u });
    }
  });
  return candidates;
}

async function listReportsByCreatorId(db, creatorId) {
  const q = db.collection('reports').where('createdBy', '==', creatorId);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data(), ref: d.ref }));
}

async function listReportsByCreatorName(db, creatorName) {
  // Try multiple possible fields for creator name
  const fields = ['createdByName', 'creatorName', 'userName'];
  const results = new Map();
  for (const field of fields) {
    const snap = await db.collection('reports').where(field, '==', creatorName).get();
    for (const doc of snap.docs) {
      results.set(doc.id, { id: doc.id, data: doc.data(), ref: doc.ref });
    }
  }
  return Array.from(results.values());
}

async function deleteReportsBatch(db, reportDocs) {
  let deleted = 0;
  for (let i = 0; i < reportDocs.length; i += 500) {
    const batch = db.batch();
    const chunk = reportDocs.slice(i, i + 500);
    for (const { ref } of chunk) batch.delete(ref);
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: true, name: '', email: '', createdById: '', createdByName: '' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--execute') opts.dryRun = false;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--name') { opts.name = args[++i] || ''; }
    else if (a === '--email') { opts.email = args[++i] || ''; }
    else if (a === '--createdById') { opts.createdById = args[++i] || ''; }
    else if (a === '--createdByName') { opts.createdByName = args[++i] || ''; }
  }
  if (!opts.name && !opts.email) {
    // defaults for Linus variants
    opts.name = 'Linus Hollberg';
  }
  return opts;
}

(async () => {
  const db = await initializeAdmin();
  const opts = parseArgs();
  const variants = new Set([
    opts.name,
    'Linus Hollberg',
    'Linus Holdberg',
    'Linus Holmberg',
  ].filter(Boolean));

  let totalTargets = 0;
  if (opts.createdById) {
    const reports = await listReportsByCreatorId(db, opts.createdById);
    console.log(`\n📄 Reports by createdBy=${opts.createdById}: ${reports.length}`);
    for (const r of reports.slice(0, 20)) {
      const d = r.data;
      console.log(`  - ${r.id} | ${d.title || d.customerName || d.status || '<no fields>'} | branch=${d.branchId || 'n/a'} | createdAt=${d.createdAt || 'n/a'}`);
    }
    totalTargets += reports.length;
    if (!opts.dryRun && reports.length > 0) {
      const deleted = await deleteReportsBatch(db, reports);
      console.log(`  ✅ Deleted ${deleted} reports for createdBy=${opts.createdById}`);
    } else {
      console.log('  (dry-run) No deletions performed');
    }
  } else if (opts.createdByName) {
    // Consider variants for name
    const nameVariants = new Set([opts.createdByName, ...variants]);
    let combined = new Map();
    for (const nv of nameVariants) {
      const reports = await listReportsByCreatorName(db, nv);
      for (const r of reports) combined.set(r.id, r);
    }
    const finalList = Array.from(combined.values());
    console.log(`\n📄 Reports by creator name variants (${Array.from(nameVariants).join(', ')}): ${finalList.length}`);
    for (const r of finalList.slice(0, 20)) {
      const d = r.data;
      console.log(`  - ${r.id} | ${d.title || d.customerName || d.status || '<no fields>'} | branch=${d.branchId || 'n/a'} | createdAt=${d.createdAt || 'n/a'}`);
    }
    totalTargets += finalList.length;
    if (!opts.dryRun && finalList.length > 0) {
      const deleted = await deleteReportsBatch(db, finalList);
      console.log(`  ✅ Deleted ${deleted} reports by creator name variants`);
    } else {
      console.log('  (dry-run) No deletions performed');
    }
  } else {
    // Fallback: resolve by users collection as before
    let userCandidates = [];
    for (const name of variants) {
      const c = await findUserCandidates(db, name, opts.email);
      userCandidates.push(...c);
    }
    const seen = new Set();
    userCandidates = userCandidates.filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)));

    if (userCandidates.length === 0) {
      console.log('❌ No user candidates found for:', Array.from(variants).join(', '), opts.email ? `email~${opts.email}` : '');
      console.log('Tip: Provide --createdById <UID> or --createdByName "Display Name"');
      process.exit(0);
    }

    console.log(`👤 Found ${userCandidates.length} candidate user(s):`);
    userCandidates.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.displayName || '<no name>'} <${u.email || 'no-email'}> id=${u.id} branch=${u.branchId || 'n/a'} level=${u.permissionLevel ?? 'n/a'}`);
    });

    for (const user of userCandidates) {
      const reports = await listReportsByCreatorId(db, user.id);
      totalTargets += reports.length;
      console.log(`\n📄 Reports by ${user.displayName || user.id}: ${reports.length}`);
      for (const r of reports.slice(0, 20)) {
        const d = r.data;
        console.log(`  - ${r.id} | ${d.title || d.customerName || d.status || '<no fields>'} | branch=${d.branchId || 'n/a'} | createdAt=${d.createdAt || 'n/a'}`);
      }
      if (!opts.dryRun && reports.length > 0) {
        const deleted = await deleteReportsBatch(db, reports);
        console.log(`  ✅ Deleted ${deleted} reports for ${user.displayName || user.id}`);
      } else {
        console.log('  (dry-run) No deletions performed');
      }
    }
  }

  console.log(`\n⚠️ Summary: ${totalTargets} report(s) matched. Mode=${opts.dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  if (opts.dryRun) {
    console.log('To execute deletion, rerun with --execute and optional --name/--email overrides.');
  }
  process.exit(0);
})().catch((err) => {
  console.error('Error:', err && err.stack ? err.stack : err);
  process.exit(1);
});


