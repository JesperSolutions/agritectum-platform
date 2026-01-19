#!/usr/bin/env node

/**
 * Create German Test Department
 * 
 * Creates a complete German test department for Agritectum with:
 * - German branch: "Agritectum Deutschland"
 * - Branch manager: Marcus
 * - 3 inspectors
 * - 1 example customer with 1 example building
 * - 1 example report and 1 example ESG report
 * 
 * Usage: node scripts/setup/create-german-test-department.cjs
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

async function createGermanTestDepartment() {
  console.log('🇩🇪 CREATING GERMAN TEST DEPARTMENT FOR AGRITECTUM\n');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Create German branch
    console.log('\n📍 STEP 1: CREATING GERMAN BRANCH\n');
    console.log('─'.repeat(80));
    
    const branchId = 'agritectum-deutschland';
    const branchData = {
      id: branchId,
      name: 'Agritectum Deutschland',
      address: 'Friedrichstraße 50, 10117 Berlin, Germany',
      phone: '+49 30 123 456 78',
      email: 'deutschland@agritectum.de',
      country: 'Germany',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection('branches').doc(branchId).set(branchData);
    console.log(`✅ Created branch: ${branchData.name} (${branchId})`);
    console.log(`   Address: ${branchData.address}`);
    console.log(`   Email: ${branchData.email}`);
    
    // Step 2: Create branch manager (Marcus Schmidt)
    console.log('\n👔 STEP 2: CREATING BRANCH MANAGER - MARCUS\n');
    console.log('─'.repeat(80));
    
    const managerEmail = 'marcus@agritectum.de';
    const managerPassword = 'MarcusTester123!';
    const managerName = 'Marcus';
    
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
    
    // Step 3: Create 3 inspectors
    console.log('\n👷 STEP 3: CREATING 3 INSPECTORS\n');
    console.log('─'.repeat(80));
    
    const inspectorData = [
      { 
        email: 'hans.mueller@agritectum.de', 
        name: 'Hans Müller',
        password: 'HansInspector123!'
      },
      { 
        email: 'anna.weber@agritectum.de', 
        name: 'Anna Weber',
        password: 'AnnaInspector123!'
      },
      { 
        email: 'peter.bauer@agritectum.de', 
        name: 'Peter Bauer',
        password: 'PeterInspector123!'
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
      name: 'Beispiel GmbH',
      email: 'kontakt@beispiel-gmbh.de',
      phone: '+49 30 987 654 32',
      address: 'Unter den Linden 15, 10117 Berlin, Germany',
      customerType: 'company',
      company: 'Beispiel GmbH',
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
      address: 'Unter den Linden 15, 10117 Berlin, Germany',
      buildingType: 'commercial',
      roofType: 'tile',
      roofSize: 450,
      roofAge: 20,
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
      conditionNotes: 'Gründliche Dachinspektion durchgeführt. Das Ziegeldach ist in allgemein gutem Zustand mit geringem Verschleiß an einigen Ziegeln. Einige Bereiche zeigen Mooswachstum und einige Ziegel weisen kleine Risse auf. Dachrinnen sind sauber und Blecharbeiten sind intakt.',
      issuesFound: [
        {
          title: 'Leichtes Mooswachstum',
          description: 'Geringes Mooswachstum auf der Nordseite',
          severity: 'low',
          location: 'Nordseite'
        },
        {
          title: 'Haarrisse in Ziegeln',
          description: 'Einige Dachziegel zeigen kleine Haarrisse',
          severity: 'low',
          location: 'Verschiedene Stellen'
        }
      ],
      recommendedActions: [
        {
          title: 'Moos entfernen',
          description: 'Professionelle Moosentfernung von der Dachoberfläche',
          estimatedCost: 6000,
          priority: 'medium',
          timeline: '3-6 Monate'
        },
        {
          title: 'Ziegel überwachen',
          description: 'Ziegel mit Haarrissen auf weitere Verschlechterung überwachen',
          estimatedCost: 0,
          priority: 'low',
          timeline: 'Laufend'
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
        biodiversityScore: 68,
        solarPotentialKwh: 62000,
        rainwaterHarvestingLiters: 95000,
        insulationScore: 72,
        co2OffsetKg: 15500,
        greenRoofPercentage: 10,
      },
      recommendations: [
        {
          title: 'Solaranlage installieren',
          description: 'Die Dachfläche ist ideal für eine Solaranlageninstallation mit hoher Sonneneinstrahlung',
          estimatedCost: 200000,
          estimatedSavings: 32000,
          co2Impact: 10000,
          priority: 'high'
        },
        {
          title: 'Gründachflächen erweitern',
          description: 'Gründachflächen zur Verbesserung der Biodiversität und Dämmung erweitern',
          estimatedCost: 60000,
          estimatedSavings: 7000,
          co2Impact: 2500,
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
    console.log('🎉 GERMAN TEST DEPARTMENT CREATED SUCCESSFULLY!\n');
    console.log('='.repeat(80));
    
    console.log('\n📝 CREDENTIALS SUMMARY:\n');
    console.log('─'.repeat(80));
    
    console.log(`\n🔑 Branch Manager (Marcus):`);
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Password: ${managerPassword}`);
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
    console.error('\n❌ Error creating German test department:', error);
    throw error;
  }
}

async function main() {
  await initializeFirebase();
  db = admin.firestore();
  auth = admin.auth();
  await createGermanTestDepartment();
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
