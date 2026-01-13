/**
 * Debug Reports Data
 * Check if reports have correct branchId field
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '..', 'agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugReports() {
  try {
    console.log('🔍 Checking reports data...\n');
    
    const reportsSnapshot = await db.collection('reports').limit(5).get();
    
    console.log(`Found ${reportsSnapshot.size} reports (showing first 5):\n`);
    
    for (const doc of reportsSnapshot.docs) {
      const data = doc.data();
      console.log(`Report ID: ${doc.id}`);
      console.log(`  branchId: ${data.branchId || 'MISSING'}`);
      console.log(`  customerName: ${data.customerName}`);
      console.log(`  createdBy: ${data.createdBy}`);
      console.log(`  status: ${data.status}`);
      console.log(`  createdAt: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt}`);
      console.log('');
    }
    
    // Check branch manager's user data
    console.log('🔍 Checking branch manager user data...\n');
    const branchManagerSnapshot = await db.collection('users')
      .where('email', '==', 'branch.manager@agritectum.se')
      .get();
    
    if (!branchManagerSnapshot.empty) {
      const managerData = branchManagerSnapshot.docs[0].data();
      console.log('Branch Manager Data:');
      console.log(`  UID: ${branchManagerSnapshot.docs[0].id}`);
      console.log(`  branchId: ${managerData.branchId || 'MISSING'}`);
      console.log(`  permissionLevel: ${managerData.permissionLevel}`);
      console.log(`  role: ${managerData.role}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await admin.app().delete();
  }
}

debugReports();
