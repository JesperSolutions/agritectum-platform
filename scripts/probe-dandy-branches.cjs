const admin = require('firebase-admin');
const sa = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
(async () => {
  const db = admin.firestore();
  const cs = await db
    .collection('customers')
    .where('name', '==', 'DANDY Business Park')
    .limit(5)
    .get();
  if (cs.empty) {
    console.log('No DANDY customer found');
  } else {
    cs.forEach(doc => {
      const d = doc.data();
      console.log('DANDY customer', doc.id, 'branchId', d.branchId, 'company', d.company);
    });
  }
  const bs = await db.collection('branches').limit(50).get();
  console.log('Branches found', bs.size);
  bs.forEach(doc => {
    const d = doc.data();
    console.log(doc.id, d.name || d.branchName || d.companyName || '(no name)');
  });
  process.exit(0);
})();
