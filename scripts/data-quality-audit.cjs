#!/usr/bin/env node
/**
 * Data Quality Audit Script - Phase 3
 * Comprehensive validation of database relationships and data integrity
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '='.repeat(70));
  log(text, 'cyan');
  console.log('='.repeat(70));
}

// Track issues found
const issues = {
  critical: [],
  warning: [],
  info: [],
};

function addIssue(severity, collection, docId, description) {
  issues[severity].push({ collection, docId, description });
}

async function auditReportBuildingLinks() {
  header('AUDIT: Reports → Buildings Relationship');
  
  const reportsSnapshot = await db.collection('reports').get();
  let valid = 0;
  let missingBuildingId = 0;
  let invalidBuilding = 0;
  
  for (const reportDoc of reportsSnapshot.docs) {
    const report = reportDoc.data();
    
    if (!report.buildingId) {
      missingBuildingId++;
      addIssue('critical', 'reports', reportDoc.id, 'Missing buildingId field');
      continue;
    }
    
    // Check if building exists
    const buildingDoc = await db.collection('buildings').doc(report.buildingId).get();
    if (!buildingDoc.exists) {
      invalidBuilding++;
      addIssue('critical', 'reports', reportDoc.id, `References non-existent building: ${report.buildingId}`);
    } else {
      valid++;
    }
  }
  
  log(`\n  Total reports: ${reportsSnapshot.size}`, 'blue');
  log(`  ✓ Valid building links: ${valid}`, 'green');
  if (missingBuildingId > 0) log(`  ✗ Missing buildingId: ${missingBuildingId}`, 'red');
  if (invalidBuilding > 0) log(`  ✗ Invalid building reference: ${invalidBuilding}`, 'red');
}

async function auditBuildingCustomerLinks() {
  header('AUDIT: Buildings → Customers/Companies Relationship');
  
  const buildingsSnapshot = await db.collection('buildings').get();
  let validCustomer = 0;
  let validCompany = 0;
  let hasBoth = 0;
  let hasNeither = 0;
  let invalidCustomer = 0;
  let invalidCompany = 0;
  
  for (const buildingDoc of buildingsSnapshot.docs) {
    const building = buildingDoc.data();
    const hasCustomerId = !!building.customerId;
    const hasCompanyId = !!building.companyId;
    
    if (hasCustomerId && hasCompanyId) {
      hasBoth++;
      addIssue('warning', 'buildings', buildingDoc.id, 'Has both customerId and companyId (should have only one)');
    } else if (!hasCustomerId && !hasCompanyId) {
      hasNeither++;
      addIssue('critical', 'buildings', buildingDoc.id, 'Missing both customerId and companyId');
      continue;
    }
    
    // Validate customerId if present
    if (hasCustomerId) {
      const customerDoc = await db.collection('customers').doc(building.customerId).get();
      if (customerDoc.exists) {
        validCustomer++;
      } else {
        invalidCustomer++;
        addIssue('critical', 'buildings', buildingDoc.id, `References non-existent customer: ${building.customerId}`);
      }
    }
    
    // Validate companyId if present
    if (hasCompanyId) {
      const companyDoc = await db.collection('companies').doc(building.companyId).get();
      if (companyDoc.exists) {
        validCompany++;
      } else {
        invalidCompany++;
        addIssue('critical', 'buildings', buildingDoc.id, `References non-existent company: ${building.companyId}`);
      }
    }
  }
  
  log(`\n  Total buildings: ${buildingsSnapshot.size}`, 'blue');
  log(`  ✓ Valid customer links: ${validCustomer}`, 'green');
  log(`  ✓ Valid company links: ${validCompany}`, 'green');
  if (hasBoth > 0) log(`  ⚠ Has both customer & company: ${hasBoth}`, 'yellow');
  if (hasNeither > 0) log(`  ✗ Has neither: ${hasNeither}`, 'red');
  if (invalidCustomer > 0) log(`  ✗ Invalid customer reference: ${invalidCustomer}`, 'red');
  if (invalidCompany > 0) log(`  ✗ Invalid company reference: ${invalidCompany}`, 'red');
}

async function auditOfferReportLinks() {
  header('AUDIT: Offers → Reports Relationship');
  
  const offersSnapshot = await db.collection('offers').get();
  let valid = 0;
  let missingReportId = 0;
  let invalidReport = 0;
  
  for (const offerDoc of offersSnapshot.docs) {
    const offer = offerDoc.data();
    
    if (!offer.reportId) {
      missingReportId++;
      addIssue('critical', 'offers', offerDoc.id, 'Missing reportId field');
      continue;
    }
    
    const reportDoc = await db.collection('reports').doc(offer.reportId).get();
    if (!reportDoc.exists) {
      invalidReport++;
      addIssue('critical', 'offers', offerDoc.id, `References non-existent report: ${offer.reportId}`);
    } else {
      valid++;
    }
  }
  
  log(`\n  Total offers: ${offersSnapshot.size}`, 'blue');
  log(`  ✓ Valid report links: ${valid}`, 'green');
  if (missingReportId > 0) log(`  ✗ Missing reportId: ${missingReportId}`, 'red');
  if (invalidReport > 0) log(`  ✗ Invalid report reference: ${invalidReport}`, 'red');
}

async function auditAppointmentInspectorLinks() {
  header('AUDIT: Appointments → Inspectors Relationship');
  
  const appointmentsSnapshot = await db.collection('appointments').get();
  let valid = 0;
  let missingInspector = 0;
  let invalidInspector = 0;
  
  for (const appointmentDoc of appointmentsSnapshot.docs) {
    const appointment = appointmentDoc.data();
    
    if (!appointment.assignedInspectorId) {
      missingInspector++;
      addIssue('critical', 'appointments', appointmentDoc.id, 'Missing assignedInspectorId');
      continue;
    }
    
    const userDoc = await db.collection('users').doc(appointment.assignedInspectorId).get();
    if (!userDoc.exists) {
      invalidInspector++;
      addIssue('critical', 'appointments', appointmentDoc.id, `References non-existent inspector: ${appointment.assignedInspectorId}`);
    } else {
      const user = userDoc.data();
      if (user.role !== 'inspector' && user.role !== 'branchAdmin' && user.role !== 'superadmin') {
        addIssue('warning', 'appointments', appointmentDoc.id, `Assigned to non-inspector user: ${user.role}`);
      }
      valid++;
    }
  }
  
  log(`\n  Total appointments: ${appointmentsSnapshot.size}`, 'blue');
  log(`  ✓ Valid inspector links: ${valid}`, 'green');
  if (missingInspector > 0) log(`  ✗ Missing assignedInspectorId: ${missingInspector}`, 'red');
  if (invalidInspector > 0) log(`  ✗ Invalid inspector reference: ${invalidInspector}`, 'red');
}

async function auditScheduledVisitLinks() {
  header('AUDIT: Scheduled Visits → Buildings/Inspectors Relationship');
  
  const visitsSnapshot = await db.collection('scheduledVisits').get();
  let validBuilding = 0;
  let validInspector = 0;
  let missingBuilding = 0;
  let invalidBuilding = 0;
  let missingInspector = 0;
  let invalidInspector = 0;
  
  for (const visitDoc of visitsSnapshot.docs) {
    const visit = visitDoc.data();
    
    // Check building link
    if (visit.buildingId) {
      const buildingDoc = await db.collection('buildings').doc(visit.buildingId).get();
      if (buildingDoc.exists) {
        validBuilding++;
      } else {
        invalidBuilding++;
        addIssue('warning', 'scheduledVisits', visitDoc.id, `References non-existent building: ${visit.buildingId}`);
      }
    } else {
      missingBuilding++;
      addIssue('info', 'scheduledVisits', visitDoc.id, 'No buildingId (may be pre-building visit)');
    }
    
    // Check inspector link
    if (!visit.assignedInspectorId) {
      missingInspector++;
      addIssue('critical', 'scheduledVisits', visitDoc.id, 'Missing assignedInspectorId');
      continue;
    }
    
    const userDoc = await db.collection('users').doc(visit.assignedInspectorId).get();
    if (!userDoc.exists) {
      invalidInspector++;
      addIssue('critical', 'scheduledVisits', visitDoc.id, `References non-existent inspector: ${visit.assignedInspectorId}`);
    } else {
      validInspector++;
    }
  }
  
  log(`\n  Total scheduled visits: ${visitsSnapshot.size}`, 'blue');
  log(`  ✓ Valid building links: ${validBuilding}`, 'green');
  log(`  ✓ Valid inspector links: ${validInspector}`, 'green');
  if (missingBuilding > 0) log(`  ⚠ Missing buildingId: ${missingBuilding}`, 'yellow');
  if (invalidBuilding > 0) log(`  ✗ Invalid building reference: ${invalidBuilding}`, 'red');
  if (missingInspector > 0) log(`  ✗ Missing assignedInspectorId: ${missingInspector}`, 'red');
  if (invalidInspector > 0) log(`  ✗ Invalid inspector reference: ${invalidInspector}`, 'red');
}

async function auditServiceAgreementLinks() {
  header('AUDIT: Service Agreements → Customers/Buildings Relationship');
  
  const agreementsSnapshot = await db.collection('serviceAgreements').get();
  let validCustomer = 0;
  let validBuilding = 0;
  let invalidCustomer = 0;
  let invalidBuilding = 0;
  
  for (const agreementDoc of agreementsSnapshot.docs) {
    const agreement = agreementDoc.data();
    
    // Check customer link
    if (agreement.customerId) {
      const customerDoc = await db.collection('customers').doc(agreement.customerId).get();
      if (customerDoc.exists) {
        validCustomer++;
      } else {
        invalidCustomer++;
        addIssue('critical', 'serviceAgreements', agreementDoc.id, `References non-existent customer: ${agreement.customerId}`);
      }
    }
    
    // Check building link
    if (agreement.buildingId) {
      const buildingDoc = await db.collection('buildings').doc(agreement.buildingId).get();
      if (buildingDoc.exists) {
        validBuilding++;
      } else {
        invalidBuilding++;
        addIssue('warning', 'serviceAgreements', agreementDoc.id, `References non-existent building: ${agreement.buildingId}`);
      }
    }
  }
  
  log(`\n  Total service agreements: ${agreementsSnapshot.size}`, 'blue');
  log(`  ✓ Valid customer links: ${validCustomer}`, 'green');
  log(`  ✓ Valid building links: ${validBuilding}`, 'green');
  if (invalidCustomer > 0) log(`  ✗ Invalid customer reference: ${invalidCustomer}`, 'red');
  if (invalidBuilding > 0) log(`  ✗ Invalid building reference: ${invalidBuilding}`, 'red');
}

async function auditBranchScoping() {
  header('AUDIT: Branch Scoping Consistency');
  
  const collections = [
    { name: 'users', field: 'branchId', required: true, excludeRoles: ['customer'] },
    { name: 'customers', field: 'branchId', required: true },
    { name: 'buildings', field: 'branchId', required: false },
    { name: 'reports', field: 'branchId', required: true },
    { name: 'offers', field: 'branchId', required: true },
    { name: 'appointments', field: 'branchId', required: true },
    { name: 'scheduledVisits', field: 'branchId', required: true },
  ];
  
  for (const collectionInfo of collections) {
    const snapshot = await db.collection(collectionInfo.name).get();
    let missing = 0;
    let invalid = 0;
    let valid = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip excluded roles (e.g., customer users)
      if (collectionInfo.excludeRoles && collectionInfo.excludeRoles.includes(data.role)) {
        continue;
      }
      
      if (!data[collectionInfo.field]) {
        if (collectionInfo.required) {
          missing++;
          addIssue('critical', collectionInfo.name, doc.id, `Missing required field: ${collectionInfo.field}`);
        }
      } else {
        // Verify branch exists
        const branchDoc = await db.collection('branches').doc(data[collectionInfo.field]).get();
        if (!branchDoc.exists && data[collectionInfo.field] !== 'main') {
          invalid++;
          addIssue('critical', collectionInfo.name, doc.id, `References non-existent branch: ${data[collectionInfo.field]}`);
        } else {
          valid++;
        }
      }
    }
    
    log(`\n  ${collectionInfo.name}:`, 'blue');
    log(`    ✓ Valid branch links: ${valid}`, 'green');
    if (missing > 0) log(`    ✗ Missing branchId: ${missing}`, 'red');
    if (invalid > 0) log(`    ✗ Invalid branch reference: ${invalid}`, 'red');
  }
}

async function generateSummaryReport() {
  header('SUMMARY REPORT');
  
  const totalIssues = issues.critical.length + issues.warning.length + issues.info.length;
  
  log(`\n  Total issues found: ${totalIssues}`, totalIssues > 0 ? 'yellow' : 'green');
  log(`    🔴 Critical: ${issues.critical.length}`, issues.critical.length > 0 ? 'red' : 'green');
  log(`    🟡 Warning: ${issues.warning.length}`, issues.warning.length > 0 ? 'yellow' : 'green');
  log(`    🔵 Info: ${issues.info.length}`, 'blue');
  
  if (issues.critical.length > 0) {
    log('\n  CRITICAL ISSUES (requires immediate attention):', 'red');
    issues.critical.forEach((issue, idx) => {
      console.log(`    ${idx + 1}. [${issue.collection}/${issue.docId}] ${issue.description}`);
    });
  }
  
  if (issues.warning.length > 0) {
    log('\n  WARNINGS (should be reviewed):', 'yellow');
    issues.warning.slice(0, 10).forEach((issue, idx) => {
      console.log(`    ${idx + 1}. [${issue.collection}/${issue.docId}] ${issue.description}`);
    });
    if (issues.warning.length > 10) {
      console.log(`    ... and ${issues.warning.length - 10} more warnings`);
    }
  }
  
  if (issues.info.length > 0) {
    log(`\n  INFO (${issues.info.length} items - not shown)`, 'blue');
  }
  
  // Save detailed report to file
  if (totalIssues > 0) {
    const fs = require('fs');
    const reportPath = './data-quality-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
    log(`\n  📄 Detailed report saved to: ${reportPath}`, 'cyan');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (issues.critical.length === 0) {
    log('✅ DATA QUALITY: EXCELLENT', 'green');
  } else if (issues.critical.length < 5) {
    log('⚠️  DATA QUALITY: GOOD (minor issues to fix)', 'yellow');
  } else {
    log('❌ DATA QUALITY: NEEDS ATTENTION', 'red');
  }
  
  console.log('='.repeat(70) + '\n');
}

async function main() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        AGRITECTUM PLATFORM - DATA QUALITY AUDIT                  ║', 'cyan');
  log('║        Phase 3: Relationship & Integrity Validation              ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════╝', 'cyan');
  log(`Date: ${new Date().toISOString()}`, 'blue');

  try {
    await auditReportBuildingLinks();
    await auditBuildingCustomerLinks();
    await auditOfferReportLinks();
    await auditAppointmentInspectorLinks();
    await auditScheduledVisitLinks();
    await auditServiceAgreementLinks();
    await auditBranchScoping();
    await generateSummaryReport();
    
    // Exit with error code if critical issues found
    process.exit(issues.critical.length > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
