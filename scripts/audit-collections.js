#!/usr/bin/env node

/**
 * Firestore Collection Audit Script
 * Samples documents from each collection to check for field alignment
 * Run: node scripts/audit-collections.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const COLLECTIONS_TO_CHECK = [
  'appointments',
  'scheduledVisits',
  'customers',
  'buildings',
  'reports',
  'serviceAgreements',
  'offers',
];

const FIELD_EXPECTATIONS = {
  appointments: {
    required: ['branchId', 'assignedInspectorId', 'scheduledDate', 'status'],
    optional: ['customerId', 'companyId', 'buildingId'],
    present: [],
    missing: [],
  },
  scheduledVisits: {
    required: ['branchId', 'assignedInspectorId', 'scheduledDate', 'status'],
    optional: ['customerId', 'companyId', 'buildingId'],
    present: [],
    missing: [],
  },
  customers: {
    required: ['id', 'name', 'createdAt'],
    optional: ['companyId', 'parentCompanyId'],
    present: [],
    missing: [],
  },
  buildings: {
    required: ['address', 'createdAt'],
    optional: ['customerId', 'companyId'],
    present: [],
    missing: [],
  },
  reports: {
    required: ['buildingId', 'createdBy', 'status'],
    optional: ['customerId', 'companyId'],
    present: [],
    missing: [],
  },
  serviceAgreements: {
    required: ['customerId', 'status'],
    optional: ['companyId', 'buildingId'],
    present: [],
    missing: [],
  },
  offers: {
    required: ['reportId', 'status'],
    optional: ['customerId', 'companyId'],
    present: [],
    missing: [],
  },
};

async function auditCollection(collectionName) {
  console.log(`\n📋 Auditing collection: ${collectionName}`);
  console.log('='.repeat(50));

  try {
    const snapshot = await db.collection(collectionName).limit(5).get();
    
    if (snapshot.empty) {
      console.log(`⚠️  Collection is empty, skipping detailed audit`);
      return;
    }

    console.log(`Found ${snapshot.docs.length} sample document(s)\n`);

    const expectations = FIELD_EXPECTATIONS[collectionName];
    const fieldPresenceMap = {};

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  📄 Document ${index + 1} (ID: ${doc.id.slice(0, 8)}...)`);

      // Check required fields
      expectations.required.forEach(field => {
        if (field in data) {
          console.log(`    ✅ ${field}: ${typeof data[field]} = ${JSON.stringify(data[field]).slice(0, 50)}`);
          if (!fieldPresenceMap[field]) fieldPresenceMap[field] = 0;
          fieldPresenceMap[field]++;
        } else {
          console.log(`    ❌ ${field}: MISSING`);
        }
      });

      // Check optional fields
      expectations.optional.forEach(field => {
        if (field in data) {
          console.log(`    ℹ️  ${field}: ${typeof data[field]} = ${JSON.stringify(data[field]).slice(0, 50)}`);
          if (!fieldPresenceMap[field]) fieldPresenceMap[field] = 0;
          fieldPresenceMap[field]++;
        }
      });

      // Check for unexpected fields
      const allExpected = [...expectations.required, ...expectations.optional];
      Object.keys(data).forEach(field => {
        if (!allExpected.includes(field) && !['id', 'createdAt', 'updatedAt'].includes(field)) {
          console.log(`    🔍 UNEXPECTED: ${field}`);
        }
      });
    });

    // Summary
    console.log(`\n  📊 Field Presence Summary:`);
    expectations.required.forEach(field => {
      const count = fieldPresenceMap[field] || 0;
      const total = snapshot.docs.length;
      const presence = ((count / total) * 100).toFixed(0);
      if (count === 0) {
        console.log(`    ❌ ${field}: ${presence}% (${count}/${total})`);
      } else if (count < total) {
        console.log(`    ⚠️  ${field}: ${presence}% (${count}/${total})`);
      } else {
        console.log(`    ✅ ${field}: ${presence}% (${count}/${total})`);
      }
    });

    expectations.optional.forEach(field => {
      const count = fieldPresenceMap[field] || 0;
      const total = snapshot.docs.length;
      if (count > 0) {
        const presence = ((count / total) * 100).toFixed(0);
        console.log(`    ℹ️  ${field}: ${presence}% (${count}/${total})`);
      }
    });

  } catch (error) {
    console.error(`❌ Error auditing ${collectionName}:`, error.message);
  }
}

async function checkCrossDocumentLinks() {
  console.log(`\n\n🔗 Checking Cross-Document Links`);
  console.log('='.repeat(50));

  try {
    // Sample an appointment and check if related docs exist
    const appointmentSnap = await db.collection('appointments').limit(1).get();
    if (!appointmentSnap.empty) {
      const apt = appointmentSnap.docs[0].data();
      console.log(`\n  📝 Checking Appointment (${appointmentSnap.docs[0].id.slice(0, 8)}...):`);
      
      if (apt.customerId) {
        const customerExists = await db.collection('customers').doc(apt.customerId).get().then(d => d.exists);
        console.log(`    Customer (${apt.customerId.slice(0, 8)}...): ${customerExists ? '✅ EXISTS' : '❌ MISSING'}`);
      }
      
      if (apt.buildingId) {
        const buildingExists = await db.collection('buildings').doc(apt.buildingId).get().then(d => d.exists);
        console.log(`    Building (${apt.buildingId.slice(0, 8)}...): ${buildingExists ? '✅ EXISTS' : '❌ MISSING'}`);
      }
      
      if (apt.scheduledVisitId) {
        const visitExists = await db.collection('scheduledVisits').doc(apt.scheduledVisitId).get().then(d => d.exists);
        console.log(`    ScheduledVisit (${apt.scheduledVisitId.slice(0, 8)}...): ${visitExists ? '✅ EXISTS' : '❌ MISSING'}`);
      }
    }

    // Sample a scheduledVisit and check if appointment link exists
    const visitSnap = await db.collection('scheduledVisits').limit(1).get();
    if (!visitSnap.empty) {
      const visit = visitSnap.docs[0].data();
      console.log(`\n  📅 Checking ScheduledVisit (${visitSnap.docs[0].id.slice(0, 8)}...):`);
      
      if (visit.appointmentId) {
        const appointmentExists = await db.collection('appointments').doc(visit.appointmentId).get().then(d => d.exists);
        console.log(`    Appointment (${visit.appointmentId.slice(0, 8)}...): ${appointmentExists ? '✅ EXISTS' : '❌ MISSING'}`);
      }
      
      if (visit.customerId) {
        const customerExists = await db.collection('customers').doc(visit.customerId).get().then(d => d.exists);
        console.log(`    Customer (${visit.customerId.slice(0, 8)}...): ${customerExists ? '✅ EXISTS' : '❌ MISSING'}`);
      }
    }

  } catch (error) {
    console.error(`❌ Error checking links:`, error.message);
  }
}

async function checkDataConsistency() {
  console.log(`\n\n🔄 Checking Data Consistency`);
  console.log('='.repeat(50));

  try {
    // Check if appointments and scheduledVisits have matching customerResponse fields
    const aptSnap = await db.collection('appointments').limit(3).get();
    const visitSnap = await db.collection('scheduledVisits').limit(3).get();

    console.log(`\n  📊 Field Coverage Analysis:`);
    console.log(`    Appointments (${aptSnap.docs.length} samples):`);
    
    let aptWithCompanyId = 0;
    let aptWithBuildingId = 0;
    let aptWithCustomerResponse = 0;

    aptSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.companyId) aptWithCompanyId++;
      if (data.buildingId) aptWithBuildingId++;
      if (data.customerResponse) aptWithCustomerResponse++;
    });

    console.log(`      - companyId: ${aptWithCompanyId}/${aptSnap.docs.length}`);
    console.log(`      - buildingId: ${aptWithBuildingId}/${aptSnap.docs.length}`);
    console.log(`      - customerResponse: ${aptWithCustomerResponse}/${aptSnap.docs.length}`);

    console.log(`\n    ScheduledVisits (${visitSnap.docs.length} samples):`);
    
    let visitWithCompanyId = 0;
    let visitWithBuildingId = 0;
    let visitWithCustomerResponse = 0;

    visitSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.companyId) visitWithCompanyId++;
      if (data.buildingId) visitWithBuildingId++;
      if (data.customerResponse) visitWithCustomerResponse++;
    });

    console.log(`      - companyId: ${visitWithCompanyId}/${visitSnap.docs.length}`);
    console.log(`      - buildingId: ${visitWithBuildingId}/${visitSnap.docs.length}`);
    console.log(`      - customerResponse: ${visitWithCustomerResponse}/${visitSnap.docs.length}`);

    // Check for appointments without scheduledVisit links
    console.log(`\n  🔍 Appointment-ScheduledVisit Sync:`);
    let unlinked = 0;
    for (const doc of aptSnap.docs) {
      if (!doc.data().scheduledVisitId) {
        unlinked++;
      }
    }
    console.log(`    Appointments without scheduledVisitId: ${unlinked}/${aptSnap.docs.length}`);

  } catch (error) {
    console.error(`❌ Error checking consistency:`, error.message);
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        FIRESTORE COLLECTION AUDIT REPORT                      ║
║        Generated: ${new Date().toISOString()}      ║
╚════════════════════════════════════════════════════════════════╝
  `);

  for (const collectionName of COLLECTIONS_TO_CHECK) {
    await auditCollection(collectionName);
  }

  await checkCrossDocumentLinks();
  await checkDataConsistency();

  console.log(`\n\n✅ Audit complete!\n`);
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
