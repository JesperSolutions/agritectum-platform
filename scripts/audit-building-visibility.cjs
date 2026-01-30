#!/usr/bin/env node
/**
 * Audit script to verify building visibility across roles
 * Ensures building owners can add buildings visible to roofers and branch admins
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://agritectum-platform.firebaseio.com',
  });
}

const db = admin.firestore();

async function auditBuildingVisibility() {
  console.log('\n📋 Building Visibility Audit\n');
  console.log('=' .repeat(80));

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`\n👥 Found ${users.length} users`);

    // Get all buildings
    const buildingsSnapshot = await db.collection('buildings').get();
    const buildings = buildingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`🏢 Found ${buildings.length} buildings\n`);

    // Categorize buildings
    const customerBuildings = buildings.filter(b => b.customerId && !b.branchId);
    const branchBuildings = buildings.filter(b => b.branchId);
    const orphanBuildings = buildings.filter(b => !b.customerId && !b.branchId);

    console.log(`📊 Building Categories:`);
    console.log(`   • Customer-only buildings: ${customerBuildings.length}`);
    console.log(`   • Branch buildings: ${branchBuildings.length}`);
    console.log(`   • Orphan buildings: ${orphanBuildings.length}\n`);

    // Check customer buildings visibility
    console.log(`🔍 Checking Customer Building Visibility:\n`);

    for (const building of customerBuildings) {
      const owner = users.find(u => u.uid === building.createdBy);
      const customer = users.find(u => u.uid === building.customerId);
      console.log(`\n📍 Building: ${building.name || building.address}`);
      console.log(`   ID: ${building.id}`);
      console.log(`   Created by: ${owner?.displayName} (${building.createdBy})`);
      console.log(`   Customer ID: ${building.customerId}`);
      console.log(`   Company ID: ${building.companyId || 'none'}`);
      console.log(`   Branch ID: ${building.branchId || 'none'}`);
      console.log(`   Created at: ${building.createdAt}`);

      // Check if any roofers can see this building
      const roofersInBranch = users.filter(
        u =>
          (u.permissionLevel === 0 || u.role === 'inspector') && u.branchId === building.branchId
      );
      console.log(`   Visible to ${roofersInBranch.length} roofers (same branch)`);

      // Check branch admins
      const adminsInBranch = users.filter(
        u =>
          (u.permissionLevel >= 1 || u.role === 'branchAdmin') && u.branchId === building.branchId
      );
      console.log(`   Visible to ${adminsInBranch.length} branch admins (same branch)`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Audit Complete!\n`);

    // Summary
    console.log('📝 Summary:');
    console.log(`   • Customer-created buildings are stored with customerId field`);
    console.log(
      `   • Buildings WITHOUT branchId are owned by customers (${customerBuildings.length})`
    );
    console.log(`   • Buildings WITH branchId are admin-created (${branchBuildings.length})`);
    console.log(`   • Roofers can see buildings if they have same branchId`);
    console.log(`   • Customer buildings visible to roofers: ${customerBuildings.filter(b => b.branchId).length}`);
    console.log(`\n💡 Recommendations:`);
    console.log(`   1. Customer buildings may need explicit branchId assignment`);
    console.log(`   2. Or, update building list queries to include both customerId AND branchId matches`);
    console.log(`   3. For customer portal: filter by customerId or companyId`);
    console.log(`   4. For roofer portal: query buildings by branchId\n`);

  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run audit
auditBuildingVisibility();
