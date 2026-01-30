#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function verify() {
  console.log(`\n📊 POST-MIGRATION VERIFICATION\n`);
  console.log('='.repeat(50));

  // Check customers
  const customerSnap = await db.collection('customers').get();
  let customersWithCompanyId = 0;
  customerSnap.docs.forEach(doc => {
    if (doc.data().companyId) customersWithCompanyId++;
  });
  console.log(`Customers:`);
  console.log(`  ✅ With companyId: ${customersWithCompanyId}/${customerSnap.docs.length}`);

  // Check appointments
  const appointmentSnap = await db.collection('appointments').get();
  let appointmentsWithCompanyId = 0;
  let appointmentsWithBuildingId = 0;
  appointmentSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.companyId) appointmentsWithCompanyId++;
    if (data.buildingId) appointmentsWithBuildingId++;
  });
  console.log(`\nAppointments:`);
  console.log(`  ✅ With companyId: ${appointmentsWithCompanyId}/${appointmentSnap.docs.length}`);
  console.log(`  ✅ With buildingId: ${appointmentsWithBuildingId}/${appointmentSnap.docs.length}`);

  // Check buildings
  const buildingSnap = await db.collection('buildings').get();
  let buildingsWithCompanyId = 0;
  buildingSnap.docs.forEach(doc => {
    if (doc.data().companyId) buildingsWithCompanyId++;
  });
  console.log(`\nBuildings:`);
  console.log(`  ✅ With companyId: ${buildingsWithCompanyId}/${buildingSnap.docs.length}`);

  // Check reports
  const reportSnap = await db.collection('reports').get();
  let reportsWithCompanyId = 0;
  reportSnap.docs.forEach(doc => {
    if (doc.data().companyId) reportsWithCompanyId++;
  });
  console.log(`\nReports:`);
  console.log(`  ✅ With companyId: ${reportsWithCompanyId}/${reportSnap.docs.length}`);

  console.log(`\n${'='.repeat(50)}\n`);
  
  if (customersWithCompanyId === customerSnap.docs.length &&
      appointmentsWithCompanyId === appointmentSnap.docs.length) {
    console.log(`✅ All critical fields are now present!\n`);
  } else {
    console.log(`⚠️  Some fields still missing\n`);
  }

  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
