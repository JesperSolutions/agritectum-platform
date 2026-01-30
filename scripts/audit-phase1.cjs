#!/usr/bin/env node
/**
 * Phase 1 Architecture Cleanup Audit Script
 * Audits current state before migration
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function auditEmployeeCollections() {
  console.log('\n📋 AUDIT: Employee Collections');
  console.log('='.repeat(60));

  try {
    // Check top-level /employees collection
    const employeesSnapshot = await db.collection('employees').get();
    console.log(`\n1️⃣  Top-level /employees collection: ${employeesSnapshot.size} documents`);
    
    if (employeesSnapshot.size > 0) {
      console.log('\n   Sample documents:');
      employeesSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.displayName} (${data.email}) - ${data.role}`);
      });
    }

    // Check /branches/{branchId}/employees subcollections
    const branchesSnapshot = await db.collection('branches').get();
    let totalSubcollectionEmployees = 0;
    
    console.log(`\n2️⃣  Checking ${branchesSnapshot.size} branches for employee subcollections...`);
    
    for (const branchDoc of branchesSnapshot.docs) {
      const employeesSubcollection = await branchDoc.ref.collection('employees').get();
      if (employeesSubcollection.size > 0) {
        console.log(`   - ${branchDoc.id}: ${employeesSubcollection.size} employees`);
        totalSubcollectionEmployees += employeesSubcollection.size;
      }
    }
    
    console.log(`\n   Total subcollection employees: ${totalSubcollectionEmployees}`);

    // Check /users collection for internal users
    const usersSnapshot = await db.collection('users').get();
    const internalUsers = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.userType !== 'customer' && data.role !== 'customer';
    });
    
    console.log(`\n3️⃣  /users collection: ${usersSnapshot.size} total, ${internalUsers.length} internal users`);
    
    console.log('\n✅ Employee audit complete');
    console.log(`\n📊 SUMMARY:`);
    console.log(`   - Top-level employees: ${employeesSnapshot.size}`);
    console.log(`   - Subcollection employees: ${totalSubcollectionEmployees}`);
    console.log(`   - Internal users: ${internalUsers.length}`);
    
    if (employeesSnapshot.size > 0 || totalSubcollectionEmployees > 0) {
      console.log(`\n⚠️  ACTION REQUIRED: ${employeesSnapshot.size + totalSubcollectionEmployees} employee documents need migration`);
    }
    
  } catch (error) {
    console.error('❌ Error auditing employees:', error.message);
  }
}

async function auditReportsWithoutBuildings() {
  console.log('\n\n📋 AUDIT: Reports without buildingId');
  console.log('='.repeat(60));

  try {
    const reportsSnapshot = await db.collection('reports').get();
    const reportsWithoutBuilding = reportsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.buildingId || data.buildingId === '';
    });
    
    console.log(`\n   Total reports: ${reportsSnapshot.size}`);
    console.log(`   Reports without buildingId: ${reportsWithoutBuilding.length}`);
    
    if (reportsWithoutBuilding.length > 0) {
      console.log(`\n   Sample reports without buildingId:`);
      reportsWithoutBuilding.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.customerName} (${data.customerAddress || 'No address'})`);
      });
      
      console.log(`\n⚠️  ACTION REQUIRED: ${reportsWithoutBuilding.length} reports need buildingId`);
    } else {
      console.log(`\n✅ All reports have buildingId`);
    }
    
  } catch (error) {
    console.error('❌ Error auditing reports:', error.message);
  }
}

async function auditCustomerRelationships() {
  console.log('\n\n📋 AUDIT: Customer/Company Relationships');
  console.log('='.repeat(60));

  try {
    // Check buildings collection
    const buildingsSnapshot = await db.collection('buildings').get();
    
    let withCustomerId = 0;
    let withCompanyId = 0;
    let withBoth = 0;
    let withNeither = 0;
    
    buildingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const hasCustomer = !!data.customerId;
      const hasCompany = !!data.companyId;
      
      if (hasCustomer && hasCompany) withBoth++;
      else if (hasCustomer) withCustomerId++;
      else if (hasCompany) withCompanyId++;
      else withNeither++;
    });
    
    console.log(`\n   Total buildings: ${buildingsSnapshot.size}`);
    console.log(`   - With customerId only: ${withCustomerId}`);
    console.log(`   - With companyId only: ${withCompanyId}`);
    console.log(`   - With BOTH: ${withBoth}`);
    console.log(`   - With NEITHER: ${withNeither}`);
    
    if (withBoth > 0) {
      console.log(`\n⚠️  WARNING: ${withBoth} buildings have both customerId and companyId`);
    }
    if (withNeither > 0) {
      console.log(`\n⚠️  WARNING: ${withNeither} buildings have no customer/company link`);
    }
    
  } catch (error) {
    console.error('❌ Error auditing customer relationships:', error.message);
  }
}

async function auditCollectionSizes() {
  console.log('\n\n📋 AUDIT: Collection Sizes');
  console.log('='.repeat(60));

  const collections = [
    'users',
    'branches',
    'customers',
    'companies',
    'buildings',
    'reports',
    'offers',
    'appointments',
    'scheduledVisits',
    'serviceAgreements',
    'esgServiceReports',
    'notifications',
    'externalServiceProviders'
  ];

  try {
    console.log('');
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      console.log(`   ${collectionName.padEnd(25)}: ${snapshot.size.toString().padStart(6)} documents`);
    }
    
  } catch (error) {
    console.error('❌ Error auditing collection sizes:', error.message);
  }
}

async function main() {
  console.log('🏗️  AGRITECTUM PLATFORM - PHASE 1 AUDIT');
  console.log('Architecture Cleanup Analysis');
  console.log('Date:', new Date().toISOString());
  console.log('='.repeat(60));

  await auditEmployeeCollections();
  await auditReportsWithoutBuildings();
  await auditCustomerRelationships();
  await auditCollectionSizes();

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ AUDIT COMPLETE');
  console.log('='.repeat(60));
  console.log('\nReview the findings above before proceeding with Phase 1 migration.\n');

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
