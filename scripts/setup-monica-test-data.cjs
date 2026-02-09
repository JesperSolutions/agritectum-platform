#!/usr/bin/env node

/**
 * Setup Monica's Test Data
 * Creates:
 * - 1 roofing company branch (Monica's Testing Branch)
 * - 3 roofers/employees
 * - 1 customer
 * - 5 buildings
 * - Sample reports and ESG data
 * - Monica's user accounts for both portals
 */

const admin = require('firebase-admin');
const readline = require('readline');

const serviceAccount = require('../config/credentials/agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'agritectum-platform',
});

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    console.log('\n🎯 Setting up Monica\'s Test Environment\n');

    // ============================================
    // 1. CREATE BRANCH
    // ============================================
    console.log('📍 Creating roofing company branch...');
    const branchData = {
      name: 'Monica Testing Branch',
      address: 'Testgade 42, 8000 Aarhus C, Denmark',
      phone: '+45 40 40 40 40',
      email: 'monica@monicatesting.dk',
      country: 'DK',
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };

    const branchRef = await db.collection('branches').add(branchData);
    const branchId = branchRef.id;
    console.log(`✅ Branch created: ${branchId}`);

    // ============================================
    // 2. CREATE ROOFERS (Employees)
    // ============================================
    console.log('\n👷 Creating 3 roofers...');
    const roofers = [
      {
        name: 'Per Hansen',
        email: 'per.hansen@monicatesting.dk',
        role: 'inspector',
        specialization: 'Roof Inspection',
      },
      {
        name: 'Jens Larsen',
        email: 'jens.larsen@monicatesting.dk',
        role: 'inspector',
        specialization: 'Maintenance',
      },
      {
        name: 'Morten Andersen',
        email: 'morten.andersen@monicatesting.dk',
        role: 'inspector',
        specialization: 'Repair & Installation',
      },
    ];

    const rooferIds = [];
    for (const rooferData of roofers) {
      try {
        // Create Firebase Auth user
        const userRecord = await auth.createUser({
          email: rooferData.email,
          password: 'TestPassword123!',
          displayName: rooferData.name,
          emailVerified: true,
        });

        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, {
          role: rooferData.role,
          branchId: branchId,
        });

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: rooferData.email,
          displayName: rooferData.name,
          role: rooferData.role,
          branchId: branchId,
          isActive: true,
          permissionLevel: 0,
          specialization: rooferData.specialization,
          createdAt: new Date().toISOString(),
        });

        rooferIds.push(userRecord.uid);
        console.log(`  ✅ ${rooferData.name} (${rooferData.email})`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`  ⚠️  ${rooferData.email} already exists (skipping)`);
        } else {
          console.error(`  ❌ Error creating ${rooferData.name}:`, error.message);
        }
      }
    }

    // ============================================
    // 3. CREATE CUSTOMER
    // ============================================
    console.log('\n🏢 Creating customer...');
    const customerData = {
      name: 'Monica Test Customer',
      type: 'commercial',
      phone: '+45 30 30 30 30',
      email: 'customer@monicatesting.dk',
      address: 'Kundevej 10, 8000 Aarhus C, Denmark',
      country: 'DK',
      branchId: branchId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const customerRef = await db.collection('customers').add(customerData);
    const customerId = customerRef.id;
    console.log(`✅ Customer created: ${customerId}`);

    // ============================================
    // 4. CREATE BUILDINGS
    // ============================================
    console.log('\n🏭 Creating 5 buildings...');
    const buildingAddresses = [
      { name: 'Warehouse A', address: 'Lagervej 1, Aarhus', roofSize: 2500, roofType: 'flat' },
      { name: 'Office Building', address: 'Kontorplads 5, Aarhus', roofSize: 1800, roofType: 'pitched' },
      { name: 'Factory C', address: 'Fabriksgade 12, Aarhus', roofSize: 4200, roofType: 'industrial' },
      { name: 'Shopping Center', address: 'Centervej 25, Aarhus', roofSize: 3500, roofType: 'flat' },
      { name: 'Residential Complex', address: 'Boligvej 33, Aarhus', roofSize: 1200, roofType: 'pitched' },
    ];

    const buildingIds = [];
    for (const bdg of buildingAddresses) {
      const buildingData = {
        name: bdg.name,
        address: bdg.address,
        roofType: bdg.roofType,
        roofSize: bdg.roofSize,
        customerId: customerId,
        branchId: branchId,
        grade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        condition: 'good',
        latitude: 56.1629 + Math.random() * 0.05,
        longitude: 10.2039 + Math.random() * 0.05,
        createdAt: new Date().toISOString(),
      };

      const buildingRef = await db.collection('buildings').add(buildingData);
      buildingIds.push(buildingRef.id);
      console.log(`  ✅ ${bdg.name} (${buildingData.roofSize}m²)`);
    }

    // ============================================
    // 5. CREATE REPORTS
    // ============================================
    console.log('\n📊 Creating sample reports...');
    for (let i = 0; i < 3; i++) {
      const buildingId = buildingIds[i];
      const roofer = rooferIds[i % rooferIds.length];

      const reportData = {
        buildingId: buildingId,
        customerId: customerId,
        branchId: branchId,
        inspectorId: roofer,
        inspectorName: roofers[i % roofers.length].name,
        title: `Roof Inspection Report - ${buildingAddresses[i].name}`,
        status: ['completed', 'in_progress', 'proposed'][i % 3],
        grade: ['A', 'B', 'C'][i % 3],
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        findings: `Detailed inspection findings for ${buildingAddresses[i].name}`,
        recommendations: 'Routine maintenance recommended',
        createdAt: new Date().toISOString(),
      };

      const reportRef = await db.collection('reports').add(reportData);
      console.log(`  ✅ Report for ${buildingAddresses[i].name}`);
    }

    // ============================================
    // 6. CREATE ESG DATA
    // ============================================
    console.log('\n🌱 Creating ESG data...');
    for (let i = 0; i < 2; i++) {
      const buildingId = buildingIds[i];

      const esgData = {
        buildingId: buildingId,
        customerId: customerId,
        branchId: branchId,
        score: 65 + Math.random() * 30,
        category: 'environmental',
        improvements: [
          'Solar panel installation',
          'Energy efficiency upgrades',
          'Rainwater harvesting',
        ],
        status: 'completed',
        date: new Date().toISOString(),
      };

      await db.collection('esgReports').add(esgData);
      console.log(`  ✅ ESG Report for Building ${i + 1}`);
    }

    // ============================================
    // 7. CREATE MONICA'S PORTAL ACCOUNTS
    // ============================================
    console.log('\n👩‍💼 Creating Monica\'s user accounts...');

    // Roofing Company Portal Account
    try {
      const monicaRooferEmail = 'monica.roofer@monicatesting.dk';
      const monicaRooferPassword = 'Monica123!';

      const monicaRooferUser = await auth.createUser({
        email: monicaRooferEmail,
        password: monicaRooferPassword,
        displayName: 'Monica - Tagdækker Portal',
        emailVerified: true,
      });

      await auth.setCustomUserClaims(monicaRooferUser.uid, {
        role: 'branchAdmin',
        branchId: branchId,
      });

      await db.collection('users').doc(monicaRooferUser.uid).set({
        uid: monicaRooferUser.uid,
        email: monicaRooferEmail,
        displayName: 'Monica - Roofing Company Portal',
        role: 'branchAdmin',
        branchId: branchId,
        isActive: true,
        permissionLevel: 1,
        createdAt: new Date().toISOString(),
      });

      console.log(`  ✅ Roofing Portal Account:`);
      console.log(`     Email: ${monicaRooferEmail}`);
      console.log(`     Password: ${monicaRooferPassword}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`  ⚠️  Roofing portal account already exists`);
      } else {
        console.error(`  ❌ Error creating roofing portal account:`, error.message);
      }
    }

    // Building Owner Portal Account
    try {
      const monicaCustomerEmail = 'monica.customer@monicatesting.dk';
      const monicaCustomerPassword = 'Monica123!';

      const monicaCustomerUser = await auth.createUser({
        email: monicaCustomerEmail,
        password: monicaCustomerPassword,
        displayName: 'Monica - Bygningsejer Portal',
        emailVerified: true,
      });

      // Create user document with customer profile
      await db.collection('users').doc(monicaCustomerUser.uid).set({
        uid: monicaCustomerUser.uid,
        email: monicaCustomerEmail,
        displayName: 'Monica - Building Owner Portal',
        role: 'customer',
        userType: 'customer',
        permissionLevel: -1,
        companyId: customerId,
        customerProfile: {
          phone: '+45 50 50 50 50',
          address: 'Kundevej 10, Aarhus',
          companyName: 'Monica Test Customer',
        },
        createdAt: new Date().toISOString(),
      });

      console.log(`  ✅ Building Owner Portal Account:`);
      console.log(`     Email: ${monicaCustomerEmail}`);
      console.log(`     Password: ${monicaCustomerPassword}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`  ⚠️  Building owner portal account already exists`);
      } else {
        console.error(`  ❌ Error creating building owner portal account:`, error.message);
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n✨ Setup Complete!\n');
    console.log('📋 Summary:');
    console.log(`   Branch ID: ${branchId}`);
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Buildings: ${buildingIds.length}`);
    console.log(`   Roofers: ${rooferIds.length}`);
    console.log('\n🌐 Portal URLs:');
    console.log('   Roofing Portal: https://agritectum-platform.web.app/admin/dashboard');
    console.log('   Building Owner Portal: https://agritectum-platform.web.app/portal/dashboard');
    console.log('\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
