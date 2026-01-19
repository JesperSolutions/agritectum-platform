#!/usr/bin/env node

/**
 * Create Swedish Test Department
 * 
 * Creates a complete Swedish test department for Agritectum with:
 * - Swedish branch: "Agritectum Sverige"
 * - Branch manager: Benght
 * - Additional manager: Magnus
 * - 3 inspectors
 * - 1 example customer with 1 example building
 * - 1 example report and 1 example ESG report
 * 
 * Usage: node scripts/setup/create-swedish-test-department.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
async function initializeFirebase() {
  try {
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    
    const serviceAccountFile = files.find(f => 
      f.startsWith('agritectum-platform-firebase-adminsdk-') && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      throw new Error('Agritectum service account key file not found. Expected: agritectum-platform-firebase-adminsdk-*.json');
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    if (admin.apps.length > 0) {
      admin.app().delete();
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin initialized for Agritectum Platform\n');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }
}

let db;
let auth;

// Generate public token for service agreements
function generatePublicToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get random roof type
function getRandomRoofType() {
  const types = ['tile', 'metal', 'shingle', 'slate', 'flat'];
  return types[Math.floor(Math.random() * types.length)];
}

// Generate random date in the past
function getRandomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Generate random date in the future
function getRandomFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

async function createSwedishTestDepartment() {
  console.log('🇸🇪 CREATING SWEDISH TEST DEPARTMENT FOR AGRITECTUM\n');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Create Swedish branch
    console.log('\n📍 STEP 1: CREATING SWEDISH BRANCH\n');
    console.log('─'.repeat(80));
    
    const branchId = 'agritectum-sverige';
    const branchData = {
      id: branchId,
      name: 'Agritectum Sverige',
      address: 'Kungsgatan 10, 111 43 Stockholm, Sweden',
      phone: '+46 8 123 45 67',
      email: 'sverige@agritectum.se',
      country: 'Sweden',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection('branches').doc(branchId).set(branchData);
    console.log(`✅ Created branch: ${branchData.name} (${branchId})`);
    console.log(`   Address: ${branchData.address}`);
    console.log(`   Email: ${branchData.email}`);
    
    // Step 2: Create branch manager (Benght Andersson)
    console.log('\n👔 STEP 2: CREATING BRANCH MANAGER - BENGHT\n');
    console.log('─'.repeat(80));
    
    const managerEmail = 'benght@agritectum.se';
    const managerPassword = 'BenghtTester123!';
    const managerName = 'Benght';
    
    let managerUser;
    try {
      // Try to get existing user
      try {
        managerUser = await auth.getUserByEmail(managerEmail);
        console.log(`⚠️  Manager ${managerEmail} already exists, using existing user...`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new manager user
          managerUser = await auth.createUser({
            email: managerEmail,
            password: managerPassword,
            displayName: managerName,
            emailVerified: true,
          });
          console.log(`✅ Created manager: ${managerName}`);
        } else {
          throw error;
        }
      }
      
      // Set custom claims for manager
      await auth.setCustomUserClaims(managerUser.uid, {
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: branchId,
      });
      
      // Create user document
      await db.collection('users').doc(managerUser.uid).set({
        uid: managerUser.uid,
        email: managerEmail,
        displayName: managerName,
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: branchId,
        userType: 'internal',
        isActive: true,
        department: 'management',
        createdAt: new Date().toISOString(),
      });
      
      console.log(`   Email: ${managerEmail}`);
      console.log(`   Password: ${managerPassword}`);
      console.log(`   Role: Branch Manager (branchAdmin)`);
      
    } catch (error) {
      console.error(`❌ Error creating manager:`, error.message);
      throw error;
    }
    
    // Step 2b: Create second branch manager (Magnus Lindqvist)
    console.log('\n👔 STEP 2b: CREATING BRANCH MANAGER - MAGNUS\n');
    console.log('─'.repeat(80));
    
    const manager2Email = 'magnus@agritectum.se';
    const manager2Password = 'MagnusTester123!';
    const manager2Name = 'Magnus';
    
    let manager2User;
    try {
      try {
        manager2User = await auth.getUserByEmail(manager2Email);
        console.log(`⚠️  Manager ${manager2Email} already exists, using existing user...`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          manager2User = await auth.createUser({
            email: manager2Email,
            password: manager2Password,
            displayName: manager2Name,
            emailVerified: true,
          });
          console.log(`✅ Created manager: ${manager2Name}`);
        } else {
          throw error;
        }
      }
      
      // Set custom claims for manager
      await auth.setCustomUserClaims(manager2User.uid, {
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: branchId,
      });
      
      // Create user document
      await db.collection('users').doc(manager2User.uid).set({
        uid: manager2User.uid,
        email: manager2Email,
        displayName: manager2Name,
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: branchId,
        userType: 'internal',
        isActive: true,
        department: 'management',
        createdAt: new Date().toISOString(),
      });
      
      console.log(`   Email: ${manager2Email}`);
      console.log(`   Password: ${manager2Password}`);
      console.log(`   Role: Branch Manager (branchAdmin)`);
      
    } catch (error) {
      console.error(`❌ Error creating manager:`, error.message);
      throw error;
    }
    
    // Step 3: Create 3 inspectors
    console.log('\n👷 STEP 3: CREATING 3 INSPECTORS\n');
    console.log('─'.repeat(80));
    
    const inspectorData = [
      { 
        email: 'erik.eriksson@agritectum.se', 
        name: 'Erik Eriksson',
        password: 'ErikInspector123!'
      },
      { 
        email: 'anna.svensson@agritectum.se', 
        name: 'Anna Svensson',
        password: 'AnnaInspector123!'
      },
      { 
        email: 'lars.nilsson@agritectum.se', 
        name: 'Lars Nilsson',
        password: 'LarsInspector123!'
      },
    ];
    
    const createdInspectors = [];
    
    for (const inspector of inspectorData) {
      try {
        let inspectorUser;
        try {
          inspectorUser = await auth.getUserByEmail(inspector.email);
          console.log(`⚠️  Inspector ${inspector.email} already exists, using existing user...`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            inspectorUser = await auth.createUser({
              email: inspector.email,
              password: inspector.password,
              displayName: inspector.name,
              emailVerified: true,
            });
            console.log(`✅ Created inspector: ${inspector.name}`);
          } else {
            throw error;
          }
        }
        
        await auth.setCustomUserClaims(inspectorUser.uid, {
          role: 'inspector',
          permissionLevel: 0,
          branchId: branchId,
        });
        
        await db.collection('users').doc(inspectorUser.uid).set({
          uid: inspectorUser.uid,
          email: inspector.email,
          displayName: inspector.name,
          role: 'inspector',
          permissionLevel: 0,
          branchId: branchId,
          userType: 'internal',
          isActive: true,
          department: 'inspectors',
          createdAt: new Date().toISOString(),
        });
        
        createdInspectors.push({ 
          id: inspectorUser.uid, 
          email: inspector.email, 
          name: inspector.name,
          password: inspector.password
        });
        console.log(`   Email: ${inspector.email}`);
        console.log(`   Password: ${inspector.password}`);
        
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  Inspector ${inspector.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating inspector ${inspector.email}:`, error.message);
        }
      }
    }
    
    // Step 4: Create example customer
    console.log('\n👥 STEP 4: CREATING EXAMPLE CUSTOMER\n');
    console.log('─'.repeat(80));
    
    const exampleCustomer = {
      name: 'Example AB',
      email: 'kontakt@example-ab.se',
      phone: '+46 8 765 43 21',
      address: 'Storgatan 25, 114 55 Stockholm, Sweden',
      customerType: 'company',
      company: 'Example AB',
      branchId: branchId,
      totalReports: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
    };
    
    const customerRef = await db.collection('customers').add(exampleCustomer);
    const customerId = customerRef.id;
    console.log(`✅ Created example customer: ${exampleCustomer.name}`);
    console.log(`   Email: ${exampleCustomer.email}`);
    console.log(`   Address: ${exampleCustomer.address}`);
    
    // Step 5: Create example building
    console.log('\n🏢 STEP 5: CREATING EXAMPLE BUILDING\n');
    console.log('─'.repeat(80));
    
    const exampleBuilding = {
      customerId: customerId,
      address: 'Storgatan 25, 114 55 Stockholm, Sweden',
      buildingType: 'commercial',
      roofType: 'tile',
      roofSize: 320,
      roofAge: 12,
      branchId: branchId,
      createdAt: new Date().toISOString(),
    };
    
    const buildingRef = await db.collection('buildings').add(exampleBuilding);
    const buildingId = buildingRef.id;
    console.log(`✅ Created example building`);
    console.log(`   Address: ${exampleBuilding.address}`);
    console.log(`   Type: ${exampleBuilding.buildingType}`);
    console.log(`   Roof: ${exampleBuilding.roofType}, ${exampleBuilding.roofSize}m², ${exampleBuilding.roofAge} years old`);
    
    // Step 6: Create example inspection report
    console.log('\n📋 STEP 6: CREATING EXAMPLE INSPECTION REPORT\n');
    console.log('─'.repeat(80));
    
    const inspectionDate = getRandomPastDate(15);
    const inspectorForReport = createdInspectors[0]; // Use first inspector
    
    const exampleReport = {
      createdBy: inspectorForReport?.id || managerUser.uid,
      createdByName: inspectorForReport?.name || managerName,
      branchId: branchId,
      buildingId: buildingId,
      customerId: customerId,
      customerName: exampleCustomer.name,
      customerAddress: exampleCustomer.address,
      customerPhone: exampleCustomer.phone,
      customerEmail: exampleCustomer.email,
      customerType: exampleCustomer.customerType,
      buildingAddress: exampleBuilding.address,
      roofType: exampleBuilding.roofType,
      roofAge: exampleBuilding.roofAge,
      roofSize: exampleBuilding.roofSize,
      inspectionDate: inspectionDate,
      conditionNotes: 'Grundlig takinspektion genomförd. Takteglet är i generellt gott skick med mindre slitage på vissa plattor. Några områden visar mosstillväxt och några plattor har mindre sprickor. Hängrännor är rena och plåtdetaljer är intakta.',
      issuesFound: [
        {
          title: 'Mindre mosstillväxt',
          description: 'Lätt mosstillväxt på norra sluttningen',
          severity: 'low',
          location: 'Norra sluttningen'
        },
        {
          title: 'Sprickor i plattor',
          description: 'Några tegelpannor visar mindre sprickor',
          severity: 'low',
          location: 'Olika platser'
        }
      ],
      recommendedActions: [
        {
          title: 'Rengör mossa',
          description: 'Professionell rengöring av mossa från takytan',
          estimatedCost: 8000,
          priority: 'medium',
          timeline: '3-6 månader'
        },
        {
          title: 'Övervaka plattor',
          description: 'Övervaka plattorna med sprickor för vidare försämring',
          estimatedCost: 0,
          priority: 'low',
          timeline: 'Löpande'
        },
      ],
      status: 'completed',
      createdAt: new Date(inspectionDate).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const reportRef = await db.collection('reports').add(exampleReport);
    console.log(`✅ Created example inspection report`);
    console.log(`   Report ID: ${reportRef.id}`);
    console.log(`   Inspector: ${exampleReport.createdByName}`);
    console.log(`   Date: ${inspectionDate}`);
    
    // Step 7: Create example ESG report
    console.log('\n🌱 STEP 7: CREATING EXAMPLE ESG REPORT\n');
    console.log('─'.repeat(80));
    
    const esgReport = {
      reportId: reportRef.id,
      buildingId: buildingId,
      customerId: customerId,
      branchId: branchId,
      createdBy: inspectorForReport?.id || managerUser.uid,
      createdByName: inspectorForReport?.name || managerName,
      customerName: exampleCustomer.name,
      buildingAddress: exampleBuilding.address,
      calculatedAt: new Date().toISOString(),
      metrics: {
        biodiversityScore: 72,
        solarPotentialKwh: 45000,
        rainwaterHarvestingLiters: 85000,
        insulationScore: 68,
        co2OffsetKg: 12500,
        greenRoofPercentage: 15,
      },
      recommendations: [
        {
          title: 'Installera solpaneler',
          description: 'Takytan är idealisk för solpanelsinstallation med hög solinstrålning',
          estimatedCost: 150000,
          estimatedSavings: 25000,
          co2Impact: 8000,
          priority: 'high'
        },
        {
          title: 'Utöka gröna takytor',
          description: 'Öka gröna takytor för att förbättra biodiversitet och isolering',
          estimatedCost: 45000,
          estimatedSavings: 5000,
          co2Impact: 2000,
          priority: 'medium'
        },
      ],
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    
    const esgRef = await db.collection('esgReports').add(esgReport);
    console.log(`✅ Created example ESG report`);
    console.log(`   ESG Report ID: ${esgRef.id}`);
    console.log(`   Biodiversity Score: ${esgReport.metrics.biodiversityScore}`);
    console.log(`   Solar Potential: ${esgReport.metrics.solarPotentialKwh} kWh`);
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SWEDISH TEST DEPARTMENT CREATED SUCCESSFULLY!\n');
    console.log('='.repeat(80));
    
    console.log('\n📝 CREDENTIALS SUMMARY:\n');
    console.log('─'.repeat(80));
    
    console.log(`\n🔑 Branch Manager 1 (Benght):`);
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Password: ${managerPassword}`);
    console.log(`   Branch: ${branchData.name}`);
    
    console.log(`\n🔑 Branch Manager 2 (Magnus):`);
    console.log(`   Email: ${manager2Email}`);
    console.log(`   Password: ${manager2Password}`);
    console.log(`   Branch: ${branchData.name}`);
    
    console.log('\n👷 Inspectors:');
    for (const inspector of inspectorData) {
      console.log(`   - ${inspector.name}: ${inspector.email} / ${inspector.password}`);
    }
    
    console.log('\n📊 Resources Created:');
    console.log(`   - Branch: ${branchData.name} (${branchId})`);
    console.log(`   - Customer: ${exampleCustomer.name}`);
    console.log(`   - Building: ${exampleBuilding.address}`);
    console.log(`   - Inspection Report: ${reportRef.id}`);
    console.log(`   - ESG Report: ${esgRef.id}`);
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error creating Swedish test department:', error);
    throw error;
  }
}

async function main() {
  await initializeFirebase();
  db = admin.firestore();
  auth = admin.auth();
  await createSwedishTestDepartment();
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
