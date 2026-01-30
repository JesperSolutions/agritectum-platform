#!/usr/bin/env node
/**
 * Monitoring Dashboard Script - Phase 3
 * Generates comprehensive metrics about database health
 * 
 * Usage:
 *   node monitoring-dashboard.cjs                    # Console output
 *   node monitoring-dashboard.cjs --json             # JSON output
 *   node monitoring-dashboard.cjs --html             # HTML report
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const outputFormat = args.includes('--json') ? 'json' : args.includes('--html') ? 'html' : 'console';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Color codes (only for console)
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
  if (outputFormat === 'console') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function header(text) {
  if (outputFormat === 'console') {
    console.log('\n' + '='.repeat(70));
    log(text, 'cyan');
    console.log('='.repeat(70));
  }
}

const metrics = {
  timestamp: new Date().toISOString(),
  collectionSizes: {},
  relationships: {},
  branchDistribution: {},
  validationErrors: {},
  recentActivity: {},
  healthScore: 100,
  issues: [],
};

async function collectCollectionSizes() {
  header('METRIC: Collection Sizes');
  
  const collections = [
    'users', 'branches', 'customers', 'companies', 'buildings', 
    'reports', 'offers', 'appointments', 'scheduledVisits', 
    'serviceAgreements', 'esgServiceReports', 'notifications',
    'mail', 'emailLogs', 'validation_errors'
  ];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    metrics.collectionSizes[collectionName] = snapshot.size;
    log(`  ${collectionName}: ${snapshot.size}`, 'blue');
  }
}

async function collectRelationshipHealth() {
  header('METRIC: Relationship Health');
  
  // Reports → Buildings
  const reportsSnapshot = await db.collection('reports').get();
  let validReportBuildings = 0;
  let invalidReportBuildings = 0;
  
  for (const reportDoc of reportsSnapshot.docs) {
    const report = reportDoc.data();
    if (report.buildingId) {
      const building = await db.collection('buildings').doc(report.buildingId).get();
      if (building.exists) {
        validReportBuildings++;
      } else {
        invalidReportBuildings++;
      }
    }
  }
  
  metrics.relationships.reportsToBuildings = {
    valid: validReportBuildings,
    invalid: invalidReportBuildings,
    total: reportsSnapshot.size,
    healthPercent: reportsSnapshot.size > 0 ? (validReportBuildings / reportsSnapshot.size * 100).toFixed(1) : 100
  };
  
  log(`  Reports → Buildings: ${validReportBuildings}/${reportsSnapshot.size} valid (${metrics.relationships.reportsToBuildings.healthPercent}%)`, 
    invalidReportBuildings > 0 ? 'yellow' : 'green');
  
  // Offers → Reports
  const offersSnapshot = await db.collection('offers').get();
  let validOfferReports = 0;
  let invalidOfferReports = 0;
  
  for (const offerDoc of offersSnapshot.docs) {
    const offer = offerDoc.data();
    if (offer.reportId) {
      const report = await db.collection('reports').doc(offer.reportId).get();
      if (report.exists) {
        validOfferReports++;
      } else {
        invalidOfferReports++;
      }
    }
  }
  
  metrics.relationships.offersToReports = {
    valid: validOfferReports,
    invalid: invalidOfferReports,
    total: offersSnapshot.size,
    healthPercent: offersSnapshot.size > 0 ? (validOfferReports / offersSnapshot.size * 100).toFixed(1) : 100
  };
  
  log(`  Offers → Reports: ${validOfferReports}/${offersSnapshot.size} valid (${metrics.relationships.offersToReports.healthPercent}%)`,
    invalidOfferReports > 0 ? 'yellow' : 'green');
  
  // Buildings → Customers
  const buildingsSnapshot = await db.collection('buildings').get();
  let validBuildingCustomers = 0;
  let invalidBuildingCustomers = 0;
  
  for (const buildingDoc of buildingsSnapshot.docs) {
    const building = buildingDoc.data();
    if (building.customerId) {
      const customer = await db.collection('customers').doc(building.customerId).get();
      if (customer.exists) {
        validBuildingCustomers++;
      } else {
        invalidBuildingCustomers++;
      }
    }
  }
  
  metrics.relationships.buildingsToCustomers = {
    valid: validBuildingCustomers,
    invalid: invalidBuildingCustomers,
    total: buildingsSnapshot.size,
    healthPercent: buildingsSnapshot.size > 0 ? (validBuildingCustomers / buildingsSnapshot.size * 100).toFixed(1) : 100
  };
  
  log(`  Buildings → Customers: ${validBuildingCustomers}/${buildingsSnapshot.size} valid (${metrics.relationships.buildingsToCustomers.healthPercent}%)`,
    invalidBuildingCustomers > 0 ? 'yellow' : 'green');
}

async function collectBranchDistribution() {
  header('METRIC: Branch Distribution');
  
  const collections = ['users', 'customers', 'buildings', 'reports', 'offers', 'appointments'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const branchCounts = {};
    let missingBranch = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Skip customer users for users collection
      if (collectionName === 'users' && data.role === 'customer') continue;
      
      if (data.branchId) {
        branchCounts[data.branchId] = (branchCounts[data.branchId] || 0) + 1;
      } else {
        missingBranch++;
      }
    }
    
    metrics.branchDistribution[collectionName] = {
      branches: branchCounts,
      missingBranch
    };
    
    log(`  ${collectionName}:`, 'blue');
    for (const [branchId, count] of Object.entries(branchCounts)) {
      log(`    ${branchId}: ${count}`, 'blue');
    }
    if (missingBranch > 0) {
      log(`    (missing branchId): ${missingBranch}`, 'yellow');
    }
  }
}

async function collectValidationErrors() {
  header('METRIC: Validation Errors (Last 30 Days)');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    const errorsSnapshot = await db.collection('validation_errors')
      .where('timestamp', '>=', thirtyDaysAgo)
      .get();
    
    const errorTypes = {};
    
    for (const errorDoc of errorsSnapshot.docs) {
      const error = errorDoc.data();
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    }
    
    metrics.validationErrors = {
      total: errorsSnapshot.size,
      byType: errorTypes,
      since: thirtyDaysAgo.toISOString()
    };
    
    log(`  Total validation errors: ${errorsSnapshot.size}`, errorsSnapshot.size > 0 ? 'yellow' : 'green');
    
    if (errorsSnapshot.size > 0) {
      for (const [type, count] of Object.entries(errorTypes)) {
        log(`    ${type}: ${count}`, 'yellow');
      }
    }
  } catch (error) {
    log(`  Validation errors collection not found (this is normal if validation functions not deployed yet)`, 'blue');
    metrics.validationErrors = { total: 0, byType: {}, note: 'Collection not found' };
  }
}

async function collectRecentActivity() {
  header('METRIC: Recent Activity (Last 7 Days)');
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const collections = ['reports', 'offers', 'appointments', 'scheduledVisits'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName)
      .where('createdAt', '>=', sevenDaysAgo)
      .get();
    
    metrics.recentActivity[collectionName] = snapshot.size;
    log(`  ${collectionName}: ${snapshot.size} created`, 'blue');
  }
}

function calculateHealthScore() {
  header('METRIC: Overall Health Score');
  
  let score = 100;
  const issues = [];
  
  // Deduct for invalid relationships
  if (metrics.relationships.reportsToBuildings) {
    const invalid = metrics.relationships.reportsToBuildings.invalid;
    if (invalid > 0) {
      const penalty = Math.min(20, invalid * 2);
      score -= penalty;
      issues.push(`${invalid} reports with invalid building references (-${penalty} points)`);
    }
  }
  
  if (metrics.relationships.offersToReports) {
    const invalid = metrics.relationships.offersToReports.invalid;
    if (invalid > 0) {
      const penalty = Math.min(15, invalid * 3);
      score -= penalty;
      issues.push(`${invalid} offers with invalid report references (-${penalty} points)`);
    }
  }
  
  if (metrics.relationships.buildingsToCustomers) {
    const invalid = metrics.relationships.buildingsToCustomers.invalid;
    if (invalid > 0) {
      const penalty = Math.min(15, invalid * 2);
      score -= penalty;
      issues.push(`${invalid} buildings with invalid customer references (-${penalty} points)`);
    }
  }
  
  // Deduct for missing branch IDs
  for (const [collection, data] of Object.entries(metrics.branchDistribution)) {
    if (data.missingBranch > 0) {
      const penalty = Math.min(10, data.missingBranch);
      score -= penalty;
      issues.push(`${data.missingBranch} ${collection} missing branchId (-${penalty} points)`);
    }
  }
  
  // Deduct for validation errors
  if (metrics.validationErrors.total > 0) {
    const penalty = Math.min(20, metrics.validationErrors.total);
    score -= penalty;
    issues.push(`${metrics.validationErrors.total} validation errors in last 30 days (-${penalty} points)`);
  }
  
  metrics.healthScore = Math.max(0, score);
  metrics.issues = issues;
  
  const color = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
  log(`\n  Health Score: ${score}/100`, color);
  
  if (issues.length > 0) {
    log('\n  Issues affecting score:', 'yellow');
    issues.forEach(issue => log(`    - ${issue}`, 'yellow'));
  } else {
    log('  ✓ No issues found - database is healthy!', 'green');
  }
}

function generateConsoleOutput() {
  console.log('\n' + '='.repeat(70));
  
  if (metrics.healthScore >= 90) {
    log('✅ DATABASE HEALTH: EXCELLENT', 'green');
  } else if (metrics.healthScore >= 70) {
    log('⚠️  DATABASE HEALTH: GOOD', 'yellow');
  } else {
    log('❌ DATABASE HEALTH: NEEDS ATTENTION', 'red');
  }
  
  console.log('='.repeat(70) + '\n');
}

function generateJsonOutput() {
  console.log(JSON.stringify(metrics, null, 2));
}

function generateHtmlOutput() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agritectum Platform - Database Health Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .metric-card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .health-score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
    .score-excellent { color: #4CAF50; }
    .score-good { color: #FF9800; }
    .score-poor { color: #f44336; }
    .issue-list { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    th { background-color: #4CAF50; color: white; }
    .timestamp { color: #888; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>🏢 Agritectum Platform - Database Health Report</h1>
  <p class="timestamp">Generated: ${metrics.timestamp}</p>
  
  <div class="health-score ${
    metrics.healthScore >= 90 ? 'score-excellent' : 
    metrics.healthScore >= 70 ? 'score-good' : 'score-poor'
  }">
    ${metrics.healthScore}/100
  </div>
  
  ${metrics.issues.length > 0 ? `
  <div class="issue-list">
    <h3>⚠️ Issues Affecting Score</h3>
    <ul>
      ${metrics.issues.map(issue => `<li>${issue}</li>`).join('')}
    </ul>
  </div>
  ` : '<p style="text-align: center; color: #4CAF50;">✅ No issues found - database is healthy!</p>'}
  
  <h2>📊 Collection Sizes</h2>
  <table>
    <tr><th>Collection</th><th>Documents</th></tr>
    ${Object.entries(metrics.collectionSizes).map(([name, count]) => 
      `<tr><td>${name}</td><td>${count}</td></tr>`
    ).join('')}
  </table>
  
  <h2>🔗 Relationship Health</h2>
  ${Object.entries(metrics.relationships).map(([name, data]) => `
    <div class="metric-card">
      <strong>${name}</strong><br>
      Valid: ${data.valid}/${data.total} (${data.healthPercent}%)<br>
      ${data.invalid > 0 ? `<span style="color: #f44336;">Invalid: ${data.invalid}</span>` : ''}
    </div>
  `).join('')}
  
  <h2>🏢 Branch Distribution</h2>
  ${Object.entries(metrics.branchDistribution).map(([collection, data]) => `
    <div class="metric-card">
      <strong>${collection}</strong><br>
      ${Object.entries(data.branches).map(([branch, count]) => 
        `${branch}: ${count}`
      ).join('<br>')}
      ${data.missingBranch > 0 ? `<br><span style="color: #FF9800;">Missing branch: ${data.missingBranch}</span>` : ''}
    </div>
  `).join('')}
  
  <h2>📈 Recent Activity (Last 7 Days)</h2>
  <table>
    <tr><th>Collection</th><th>Created</th></tr>
    ${Object.entries(metrics.recentActivity).map(([name, count]) => 
      `<tr><td>${name}</td><td>${count}</td></tr>`
    ).join('')}
  </table>
  
  ${metrics.validationErrors.total > 0 ? `
  <h2>⚠️ Validation Errors (Last 30 Days)</h2>
  <table>
    <tr><th>Error Type</th><th>Count</th></tr>
    ${Object.entries(metrics.validationErrors.byType).map(([type, count]) => 
      `<tr><td>${type}</td><td>${count}</td></tr>`
    ).join('')}
  </table>
  ` : ''}
</body>
</html>`;
  
  const filename = './database-health-report.html';
  fs.writeFileSync(filename, html);
  console.log(`HTML report saved to: ${filename}`);
}

async function main() {
  if (outputFormat === 'console') {
    console.log('\n');
    log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║        AGRITECTUM PLATFORM - MONITORING DASHBOARD                ║', 'cyan');
    log('║        Phase 3: Database Health Metrics                          ║', 'cyan');
    log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
    log(`Date: ${metrics.timestamp}`, 'blue');
  }

  try {
    await collectCollectionSizes();
    await collectRelationshipHealth();
    await collectBranchDistribution();
    await collectValidationErrors();
    await collectRecentActivity();
    calculateHealthScore();
    
    switch (outputFormat) {
      case 'json':
        generateJsonOutput();
        break;
      case 'html':
        generateHtmlOutput();
        break;
      default:
        generateConsoleOutput();
    }
    
    process.exit(metrics.healthScore < 70 ? 1 : 0);
    
  } catch (error) {
    console.error(`❌ FATAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
