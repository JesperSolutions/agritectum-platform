#!/usr/bin/env node

/**
 * Database Migration Script - Fix Missing Fields
 * 
 * Issues fixed:
 * 1. Add companyId to Appointments (0/2 have it)
 * 2. Add buildingId to Appointments (0/2 have it)
 * 3. Fix Customer id field (80% missing)
 * 4. Add appointmentId to ScheduledVisits (bidirectional links)
 * 
 * Run: node scripts/migrate-missing-fields.cjs [--dry-run|--execute]
 */

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

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║        FIRESTORE MIGRATION - FIX MISSING FIELDS                ║
║        Mode: ${isDryRun ? 'DRY-RUN (no changes)' : 'EXECUTE (applying changes)'.padEnd(42)}║
╚════════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// MIGRATION 1: Fix Customer 'id' Field
// ============================================================================

async function fixCustomerIds() {
  console.log(`\n📋 MIGRATION 1: Fix Customer 'id' Field`);
  console.log('='.repeat(50));

  const snapshot = await db.collection('customers').get();
  let needsFix = 0;
  const updates = [];

  console.log(`Found ${snapshot.docs.length} customer documents\n`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.id || data.id !== doc.id) {
      needsFix++;
      console.log(`  📝 ${doc.id}: Adding/fixing id field`);
      updates.push({
        id: doc.id,
        data: { id: doc.id },
      });
    }
  }

  console.log(`\n  Summary: ${needsFix} documents need fixing`);

  if (needsFix > 0 && !isDryRun) {
    console.log(`  ⏳ Applying fixes...`);
    let updated = 0;
    for (const update of updates) {
      try {
        await db.collection('customers').doc(update.id).update(update.data);
        updated++;
      } catch (error) {
        console.log(`  ❌ Failed to update ${update.id}: ${error.message}`);
      }
    }
    console.log(`  ✅ Updated ${updated}/${needsFix} customer documents`);
  }

  return { needsFix, skipped: isDryRun };
}

// ============================================================================
// MIGRATION 2: Add companyId and buildingId to Appointments
// ============================================================================

async function fixAppointments() {
  console.log(`\n📋 MIGRATION 2: Add companyId and buildingId to Appointments`);
  console.log('='.repeat(50));

  const snapshot = await db.collection('appointments').get();
  let needsFix = 0;
  const updates = [];

  console.log(`Found ${snapshot.docs.length} appointment documents\n`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fixes = {};
    let needsUpdate = false;

    // Fix missing companyId
    if (!data.companyId && data.customerId) {
      // Look up customer to get companyId
      try {
        const customerDoc = await db.collection('customers').doc(data.customerId).get();
        if (customerDoc.exists) {
          const customerData = customerDoc.data();
          if (customerData.companyId) {
            fixes.companyId = customerData.companyId;
            needsUpdate = true;
          } else {
            console.log(`    ℹ️  ${doc.id.slice(0, 8)}...: Customer ${data.customerId.slice(0, 8)}... has no companyId`);
          }
        } else {
          console.log(`    ⚠️  ${doc.id.slice(0, 8)}...: Customer ${data.customerId.slice(0, 8)}... not found`);
        }
      } catch (error) {
        console.log(`    ⚠️  ${doc.id.slice(0, 8)}...: Error looking up customer: ${error.message}`);
      }
    }

    // Fix missing buildingId - check if it has a linked scheduledVisit with buildingId
    if (!data.buildingId && data.scheduledVisitId) {
      try {
        const visitDoc = await db.collection('scheduledVisits').doc(data.scheduledVisitId).get();
        if (visitDoc.exists) {
          const visitData = visitDoc.data();
          if (visitData.buildingId) {
            fixes.buildingId = visitData.buildingId;
            needsUpdate = true;
          }
        }
      } catch (error) {
        console.log(`    ⚠️  ${doc.id.slice(0, 8)}...: Error looking up scheduledVisit: ${error.message}`);
      }
    }

    if (needsUpdate) {
      needsFix++;
      const fixNames = Object.keys(fixes).join(', ');
      console.log(`  📝 ${doc.id.slice(0, 8)}...: Adding ${fixNames}`);
      updates.push({
        id: doc.id,
        data: fixes,
      });
    }
  }

  console.log(`\n  Summary: ${needsFix} documents need fixing`);

  if (needsFix > 0 && !isDryRun) {
    console.log(`  ⏳ Applying fixes...`);
    let updated = 0;
    for (const update of updates) {
      try {
        await db.collection('appointments').doc(update.id).update(update.data);
        updated++;
      } catch (error) {
        console.log(`  ❌ Failed to update ${update.id}: ${error.message}`);
      }
    }
    console.log(`  ✅ Updated ${updated}/${needsFix} appointment documents`);
  }

  return { needsFix, skipped: isDryRun };
}

// ============================================================================
// MIGRATION 3: Add bidirectional appointmentId to ScheduledVisits
// ============================================================================

async function fixScheduledVisits() {
  console.log(`\n📋 MIGRATION 3: Add bidirectional appointmentId to ScheduledVisits`);
  console.log('='.repeat(50));

  const snapshot = await db.collection('scheduledVisits').get();
  let needsFix = 0;
  const updates = [];

  console.log(`Found ${snapshot.docs.length} scheduledVisit documents\n`);

  // Get all appointments and build reverse mapping
  const appointmentSnap = await db.collection('appointments').get();
  const visitToAppointment = {};
  appointmentSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.scheduledVisitId) {
      visitToAppointment[data.scheduledVisitId] = doc.id;
    }
  });

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if appointmentId is missing but we can find it
    if (!data.appointmentId && visitToAppointment[doc.id]) {
      needsFix++;
      const appointmentId = visitToAppointment[doc.id];
      console.log(`  📝 ${doc.id.slice(0, 8)}...: Adding appointmentId (${appointmentId.slice(0, 8)}...)`);
      updates.push({
        id: doc.id,
        data: { appointmentId },
      });
    } else if (!data.appointmentId) {
      console.log(`  ⚠️  ${doc.id.slice(0, 8)}...: No linked appointment found`);
    }
  }

  console.log(`\n  Summary: ${needsFix} documents need fixing`);

  if (needsFix > 0 && !isDryRun) {
    console.log(`  ⏳ Applying fixes...`);
    let updated = 0;
    for (const update of updates) {
      try {
        await db.collection('scheduledVisits').doc(update.id).update(update.data);
        updated++;
      } catch (error) {
        console.log(`  ❌ Failed to update ${update.id}: ${error.message}`);
      }
    }
    console.log(`  ✅ Updated ${updated}/${updates.length} scheduledVisit documents`);
  }

  return { needsFix, skipped: isDryRun };
}

// ============================================================================
// Main Migration Runner
// ============================================================================

async function main() {
  try {
    const results = {
      customers: await fixCustomerIds(),
      appointments: await fixAppointments(),
      scheduledVisits: await fixScheduledVisits(),
    };

    const totalChanges = results.customers.needsFix + results.appointments.needsFix + results.scheduledVisits.needsFix;

    console.log(`\n\n📊 MIGRATION SUMMARY`);
    console.log('='.repeat(50));
    console.log(`  Customers: ${results.customers.needsFix} documents need fixing`);
    console.log(`  Appointments: ${results.appointments.needsFix} documents need fixing`);
    console.log(`  ScheduledVisits: ${results.scheduledVisits.needsFix} documents need fixing`);
    console.log(`\n  Total changes: ${totalChanges}`);

    if (isDryRun) {
      console.log(`\n  ℹ️  This was a DRY-RUN. No changes were applied.`);
      console.log(`\n  To apply these changes, run:`);
      console.log(`    node scripts/migrate-missing-fields.cjs --execute`);
    } else {
      console.log(`\n  ✅ Migration completed successfully!`);
    }

    console.log();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
