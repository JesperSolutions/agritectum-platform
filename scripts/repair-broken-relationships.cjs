#!/usr/bin/env node
/**
 * Data Repair Utility - Phase 3
 * Repairs broken relationships discovered by data-quality-audit.cjs
 * 
 * ALWAYS RUN IN DRY-RUN MODE FIRST!
 * Usage:
 *   node repair-broken-relationships.cjs --dry-run     # Preview changes only
 *   node repair-broken-relationships.cjs --execute     # Apply changes to database
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '='.repeat(70));
  log(text, 'cyan');
  console.log('='.repeat(70));
}

// Track repair operations
const repairs = {
  buildingsCleanedCompanyId: 0,
  usersFixedBranchId: 0,
  skipped: 0,
  errors: 0,
};

async function repairBuildingCompanyLinks() {
  header('REPAIR: Remove Invalid Company References from Buildings');
  
  const buildingsSnapshot = await db.collection('buildings').get();
  const companySnapshot = await db.collection('companies').get();
  
  // Build set of valid company IDs
  const validCompanyIds = new Set(companySnapshot.docs.map(doc => doc.id));
  log(`\n  Found ${validCompanyIds.size} valid companies in database`, 'blue');
  
  for (const buildingDoc of buildingsSnapshot.docs) {
    const building = buildingDoc.data();
    
    // Skip if no companyId
    if (!building.companyId) {
      continue;
    }
    
    // Check if companyId is invalid
    if (!validCompanyIds.has(building.companyId)) {
      // Check if building has a valid customerId
      if (!building.customerId) {
        log(`  ⚠ SKIP: ${buildingDoc.id} has invalid companyId but no customerId to fall back on`, 'yellow');
        repairs.skipped++;
        continue;
      }
      
      // Verify customerId is valid
      const customerDoc = await db.collection('customers').doc(building.customerId).get();
      if (!customerDoc.exists) {
        log(`  ⚠ SKIP: ${buildingDoc.id} has both invalid companyId AND invalid customerId`, 'yellow');
        repairs.skipped++;
        continue;
      }
      
      // OK to remove companyId - building has valid customerId
      if (isDryRun) {
        log(`  🔍 DRY-RUN: Would remove companyId from building ${buildingDoc.id} (invalid: ${building.companyId})`, 'yellow');
      } else {
        try {
          await db.collection('buildings').doc(buildingDoc.id).update({
            companyId: admin.firestore.FieldValue.delete()
          });
          log(`  ✓ Removed invalid companyId from building ${buildingDoc.id}`, 'green');
        } catch (error) {
          log(`  ✗ ERROR removing companyId from ${buildingDoc.id}: ${error.message}`, 'red');
          repairs.errors++;
          continue;
        }
      }
      
      repairs.buildingsCleanedCompanyId++;
    }
  }
  
  log(`\n  Buildings with invalid companyId cleaned: ${repairs.buildingsCleanedCompanyId}`, 
    repairs.buildingsCleanedCompanyId > 0 ? 'green' : 'blue');
}

async function repairUserBranchLinks() {
  header('REPAIR: Fix Missing Branch IDs on Users');
  
  const usersSnapshot = await db.collection('users').get();
  const branchSnapshot = await db.collection('branches').get();
  
  // Find a default branch (prefer first non-main branch, or use main)
  let defaultBranchId = 'main';
  for (const branchDoc of branchSnapshot.docs) {
    if (branchDoc.id !== 'main') {
      defaultBranchId = branchDoc.id;
      break;
    }
  }
  
  log(`\n  Will use '${defaultBranchId}' as default branch for users without branchId`, 'blue');
  
  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    
    // Skip customer users - they don't need branchId
    if (user.role === 'customer') {
      continue;
    }
    
    // Check if branchId is missing
    if (!user.branchId) {
      if (isDryRun) {
        log(`  🔍 DRY-RUN: Would set branchId='${defaultBranchId}' for user ${userDoc.id} (${user.email}, role: ${user.role})`, 'yellow');
      } else {
        try {
          await db.collection('users').doc(userDoc.id).update({
            branchId: defaultBranchId
          });
          log(`  ✓ Set branchId='${defaultBranchId}' for user ${userDoc.id}`, 'green');
        } catch (error) {
          log(`  ✗ ERROR updating user ${userDoc.id}: ${error.message}`, 'red');
          repairs.errors++;
          continue;
        }
      }
      
      repairs.usersFixedBranchId++;
    }
  }
  
  log(`\n  Users with missing branchId fixed: ${repairs.usersFixedBranchId}`, 
    repairs.usersFixedBranchId > 0 ? 'green' : 'blue');
}

async function generateRepairSummary() {
  header('REPAIR SUMMARY');
  
  const totalRepairs = repairs.buildingsCleanedCompanyId + repairs.usersFixedBranchId;
  
  log(`\n  Mode: ${isDryRun ? '🔍 DRY-RUN (preview only)' : '⚡ EXECUTE (changes applied)'}`, 
    isDryRun ? 'yellow' : 'magenta');
  
  log(`\n  Total repairs ${isDryRun ? 'previewed' : 'completed'}: ${totalRepairs}`, 'blue');
  log(`    Buildings: Removed invalid companyId from ${repairs.buildingsCleanedCompanyId} buildings`, 'blue');
  log(`    Users: Fixed missing branchId on ${repairs.usersFixedBranchId} users`, 'blue');
  
  if (repairs.skipped > 0) {
    log(`\n  ⚠ Skipped: ${repairs.skipped} items (requires manual review)`, 'yellow');
  }
  
  if (repairs.errors > 0) {
    log(`\n  ✗ Errors: ${repairs.errors} operations failed`, 'red');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (isDryRun && totalRepairs > 0) {
    log('⚠️  DRY-RUN MODE - No changes were made to the database', 'yellow');
    log('   To apply these repairs, run:', 'cyan');
    log('   node repair-broken-relationships.cjs --execute', 'cyan');
  } else if (!isDryRun && totalRepairs > 0) {
    log('✅ REPAIRS APPLIED SUCCESSFULLY', 'green');
    log('   Run the audit script again to verify:', 'cyan');
    log('   node scripts/data-quality-audit.cjs', 'cyan');
  } else {
    log('✅ NO REPAIRS NEEDED - Database is healthy', 'green');
  }
  
  console.log('='.repeat(70) + '\n');
}

async function main() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        AGRITECTUM PLATFORM - DATA REPAIR UTILITY                 ║', 'cyan');
  log('║        Phase 3: Relationship Repair & Data Cleanup               ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  log(`Date: ${new Date().toISOString()}`, 'blue');
  
  if (isDryRun) {
    log('\n⚠️  RUNNING IN DRY-RUN MODE - No changes will be made', 'yellow');
    log('   Add --execute flag to apply changes', 'yellow');
  } else {
    log('\n⚡ RUNNING IN EXECUTE MODE - Changes will be applied to database!', 'magenta');
    log('   Press Ctrl+C within 5 seconds to cancel...', 'yellow');
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    log('   Proceeding with repairs...', 'green');
  }

  try {
    await repairBuildingCompanyLinks();
    await repairUserBranchLinks();
    await generateRepairSummary();
    
    process.exit(repairs.errors > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
