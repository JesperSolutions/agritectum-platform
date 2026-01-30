#!/usr/bin/env node

/**
 * Database Migration Script - Add companyId and buildingId
 * 
 * Steps:
 * 1. Infer companyId for customers from existing data relationships
 * 2. Add companyId to appointments from their linked customer
 * 3. Add buildingId to appointments from their linked scheduledVisit
 * 
 * Run: node scripts/migrate-add-company-and-building.cjs [--dry-run|--execute]
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
║        FIRESTORE MIGRATION - ADD companyId & buildingId        ║
║        Mode: ${isDryRun ? 'DRY-RUN (no changes)' : 'EXECUTE (applying changes)'.padEnd(42)}║
╚════════════════════════════════════════════════════════════════╝
`);

// ============================================================================
// STEP 1: Infer and add companyId to Customers
// ============================================================================

async function addCompanyIdToCustomers() {
  console.log(`\n📋 STEP 1: Infer and Add companyId to Customers`);
  console.log('='.repeat(50));

  const customerSnapshot = await db.collection('customers').get();
  let needsFix = 0;
  const updates = [];

  console.log(`Found ${customerSnapshot.docs.length} customer documents\n`);

  for (const doc of customerSnapshot.docs) {
    const data = doc.data();
    
    if (!data.companyId) {
      // Strategy: Check if there's a companyId in related documents (reports, agreements)
      let companyId = null;

      // Check reports linked to this customer
      try {
        const reportSnap = await db.collection('reports')
          .where('customerId', '==', doc.id)
          .limit(1)
          .get();
        
        if (!reportSnap.empty) {
          const reportData = reportSnap.docs[0].data();
          if (reportData.companyId) {
            companyId = reportData.companyId;
          }
        }
      } catch (error) {
        // Index might not exist, continue
      }

      // Fallback: Check service agreements
      if (!companyId) {
        try {
          const agreementSnap = await db.collection('serviceAgreements')
            .where('customerId', '==', doc.id)
            .limit(1)
            .get();
          
          if (!agreementSnap.empty) {
            const agreementData = agreementSnap.docs[0].data();
            if (agreementData.companyId) {
              companyId = agreementData.companyId;
            }
          }
        } catch (error) {
          // Continue
        }
      }

      // Ultimate fallback: Use the customer's own ID as companyId
      // (Treats the customer as their own company/organization)
      if (!companyId) {
        companyId = doc.id;
      }

      needsFix++;
      console.log(`  📝 ${doc.id.slice(0, 8)}...: Adding companyId (${companyId.slice(0, 8)}...)`);
      updates.push({
        id: doc.id,
        data: { companyId },
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
// STEP 2: Add companyId and buildingId to Appointments
// ============================================================================

async function addFieldsToAppointments() {
  console.log(`\n📋 STEP 2: Add companyId and buildingId to Appointments`);
  console.log('='.repeat(50));

  const appointmentSnapshot = await db.collection('appointments').get();
  let needsFix = 0;
  const updates = [];

  console.log(`Found ${appointmentSnapshot.docs.length} appointment documents\n`);

  for (const doc of appointmentSnapshot.docs) {
    const data = doc.data();
    const fixes = {};
    let needsUpdate = false;

    // Add companyId from linked customer
    if (!data.companyId && data.customerId) {
      try {
        const customerDoc = await db.collection('customers').doc(data.customerId).get();
        if (customerDoc.exists) {
          const customerData = customerDoc.data();
          if (customerData.companyId) {
            fixes.companyId = customerData.companyId;
            needsUpdate = true;
          }
        }
      } catch (error) {
        console.log(`    ⚠️  Could not look up customer ${data.customerId.slice(0, 8)}...`);
      }
    }

    // Add buildingId from linked scheduledVisit
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
        console.log(`    ⚠️  Could not look up scheduledVisit ${data.scheduledVisitId.slice(0, 8)}...`);
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
// STEP 3: Add companyId to Buildings (for consistency)
// ============================================================================

async function addCompanyIdToBuildings() {
  console.log(`\n📋 STEP 3: Add companyId to Buildings (for consistency)`);
  console.log('='.repeat(50));

  const buildingSnapshot = await db.collection('buildings').get();
  let needsFix = 0;
  const updates = [];

  console.log(`Found ${buildingSnapshot.docs.length} building documents\n`);

  for (const doc of buildingSnapshot.docs) {
    const data = doc.data();
    
    if (!data.companyId && data.customerId) {
      try {
        const customerDoc = await db.collection('customers').doc(data.customerId).get();
        if (customerDoc.exists) {
          const customerData = customerDoc.data();
          if (customerData.companyId) {
            needsFix++;
            console.log(`  📝 ${doc.id.slice(0, 8)}...: Adding companyId from customer`);
            updates.push({
              id: doc.id,
              data: { companyId: customerData.companyId },
            });
          }
        }
      } catch (error) {
        // Continue
      }
    }
  }

  console.log(`\n  Summary: ${needsFix} documents need fixing`);

  if (needsFix > 0 && !isDryRun) {
    console.log(`  ⏳ Applying fixes...`);
    let updated = 0;
    for (const update of updates) {
      try {
        await db.collection('buildings').doc(update.id).update(update.data);
        updated++;
      } catch (error) {
        console.log(`  ❌ Failed to update ${update.id}: ${error.message}`);
      }
    }
    console.log(`  ✅ Updated ${updated}/${needsFix} building documents`);
  }

  return { needsFix, skipped: isDryRun };
}

// ============================================================================
// Main Migration Runner
// ============================================================================

async function main() {
  try {
    const results = {
      customers: await addCompanyIdToCustomers(),
      appointments: await addFieldsToAppointments(),
      buildings: await addCompanyIdToBuildings(),
    };

    const totalChanges = results.customers.needsFix + results.appointments.needsFix + results.buildings.needsFix;

    console.log(`\n\n📊 MIGRATION SUMMARY`);
    console.log('='.repeat(50));
    console.log(`  Customers: ${results.customers.needsFix} documents updated`);
    console.log(`  Appointments: ${results.appointments.needsFix} documents updated`);
    console.log(`  Buildings: ${results.buildings.needsFix} documents updated`);
    console.log(`\n  Total changes: ${totalChanges}`);

    if (isDryRun) {
      console.log(`\n  ℹ️  This was a DRY-RUN. No changes were applied.`);
      console.log(`\n  To apply these changes, run:`);
      console.log(`    node scripts/migrate-add-company-and-building.cjs --execute`);
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
