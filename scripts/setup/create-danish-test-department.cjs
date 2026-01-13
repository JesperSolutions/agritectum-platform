#!/usr/bin/env node

/**
 * Create Danish Test Department
 * 
 * Creates a complete Danish test department for Agritectum with:
 * - Danish branch: "Agritectum Danmark"
 * - Branch manager: Flemming Adolfsen
 * - 3 inspectors
 * - 1 example customer with 1 example building
 * - 1 example report and 1 example ESG report
 * 
 * Usage: node scripts/setup/create-danish-test-department.cjs
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

async function createDanishTestDepartment() {
  console.log('🇩🇰 CREATING DANISH TEST DEPARTMENT FOR AGRITECTUM\n');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Create Danish branch
    console.log('\n📍 STEP 1: CREATING DANISH BRANCH\n');
    console.log('─'.repeat(80));
    
    const branchId = 'agritectum-danmark';
    const branchData = {
      id: branchId,
      name: 'Agritectum Danmark',
      address: 'Vesterbrogade 10, 1620 København V, Denmark',
      phone: '+45 40 40 40 40',
      email: 'danmark@agritectum.dk',
      country: 'Denmark',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection('branches').doc(branchId).set(branchData);
    console.log(`✅ Created branch: ${branchData.name} (${branchId})`);
    console.log(`   Address: ${branchData.address}`);
    console.log(`   Email: ${branchData.email}`);
    
    // Step 2: Create branch manager (Flemming Adolfsen)
    console.log('\n👔 STEP 2: CREATING BRANCH MANAGER - FLEMMING ADOLFSEN\n');
    console.log('─'.repeat(80));
    
    const managerEmail = 'flemming.adolfsen@agritectum.dk';
    const managerPassword = 'FlemTester123!';
    const managerName = 'Flemming Adolfsen';
    
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
        email: 'jens.jensen@agritectum.dk', 
        name: 'Jens Jensen',
        password: 'JensInspector123!'
      },
      { 
        email: 'anna.andersen@agritectum.dk', 
        name: 'Anna Andersen',
        password: 'AnnaInspector123!'
      },
      { 
        email: 'lars.larsen@agritectum.dk', 
        name: 'Lars Larsen',
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
      name: 'Example Customer A/S',
      email: 'kontakt@example-customer.dk',
      phone: '+45 40 50 60 70',
      address: 'Nørregade 15, 1165 København K, Denmark',
      customerType: 'company',
      company: 'Example Customer A/S',
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
      address: 'Nørregade 15, 1165 København K, Denmark',
      buildingType: 'commercial',
      roofType: 'slate',
      roofSize: 250,
      roofAge: 15,
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
      createdBy: inspectorForReport.id,
      createdByName: inspectorForReport.name,
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
      conditionNotes: 'Thorough roof inspection completed. The slate roof is in generally good condition with minor wear on some tiles. A few areas show moss growth and some tiles have minor hairline cracks. Gutters are clean and flashing is intact.',
      issuesFound: [
        {
          title: 'Minor moss growth',
          description: 'Light moss growth on the northern slope',
          severity: 'low',
          location: 'Northern slope'
        },
        {
          title: 'Hairline cracks in tiles',
          description: 'A few slate tiles show minor hairline cracks',
          severity: 'low',
          location: 'Various locations'
        }
      ],
      recommendedActions: [
        {
          title: 'Clean moss',
          description: 'Professional cleaning of moss from roof surface',
          estimatedCost: 5000,
          priority: 'medium',
          timeline: '3-6 months'
        },
        {
          title: 'Monitor tiles',
          description: 'Monitor the tiles with hairline cracks for further deterioration',
          estimatedCost: 0,
          priority: 'low',
          timeline: 'Ongoing'
        },
        {
          title: 'Preventive maintenance',
          description: 'Annual inspection and cleaning to prevent further deterioration',
          estimatedCost: 8000,
          priority: 'medium',
          timeline: 'Annual'
        }
      ],
      status: 'completed',
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      isShared: true,
      isOffer: false,
    };
    
    const reportRef = await db.collection('reports').add(exampleReport);
    const reportId = reportRef.id;
    console.log(`✅ Created example inspection report`);
    console.log(`   Inspector: ${inspectorForReport.name}`);
    console.log(`   Inspection date: ${inspectionDate}`);
    console.log(`   Status: completed`);
    console.log(`   Issues found: ${exampleReport.issuesFound.length}`);
    console.log(`   Recommended actions: ${exampleReport.recommendedActions.length}`);
    
    // Update customer stats
    await db.collection('customers').doc(customerId).update({
      totalReports: 1,
      lastReportDate: inspectionDate,
    });
    
    // Step 7: Create example ESG report
    console.log('\n🌱 STEP 7: CREATING EXAMPLE ESG REPORT\n');
    console.log('─'.repeat(80));
    
    const esgReportDate = getRandomPastDate(10);
    const esgInspector = createdInspectors[1]; // Use second inspector
    
    const exampleESGReport = {
      createdBy: esgInspector.id,
      createdByName: esgInspector.name,
      branchId: branchId,
      buildingId: buildingId,
      customerId: customerId,
      customerName: exampleCustomer.name,
      customerAddress: exampleCustomer.address,
      buildingAddress: exampleBuilding.address,
      reportType: 'esg',
      reportDate: esgReportDate,
      
      // Environmental metrics
      environmental: {
        roofMaterial: 'slate',
        roofAge: exampleBuilding.roofAge,
        energyEfficiency: 'medium',
        waterRunoffSystem: 'gutters and downspouts',
        greenRoofPotential: true,
        sunExposure: 'south-facing, excellent for solar',
        notes: 'Good potential for solar panel installation. Roof structure is sound for additional weight.'
      },
      
      // Social metrics
      social: {
        buildingOccupancy: 'commercial office',
        accessibilityCompliance: true,
        safetyHazards: false,
        communityImpact: 'Located in central Copenhagen, serves local businesses',
        notes: 'Building well-maintained and accessible. Safe working conditions for inspection.'
      },
      
      // Governance metrics
      governance: {
        maintenanceRecords: true,
        complianceStatus: 'compliant',
        certifications: ['ISO 9001'],
        lastFormalAudit: '2024-06-15',
        insuranceStatus: 'active',
        notes: 'Excellent record-keeping. Regular maintenance performed. Compliant with all regulations.'
      },
      
      overallESGScore: 78,
      recommendations: [
        {
          category: 'Environmental',
          priority: 'high',
          recommendation: 'Evaluate solar panel installation potential',
          estimatedImpact: 'Significant energy savings and carbon reduction'
        },
        {
          category: 'Environmental',
          priority: 'medium',
          recommendation: 'Implement rainwater harvesting system',
          estimatedImpact: 'Reduce water consumption by 20-30%'
        },
        {
          category: 'Governance',
          priority: 'medium',
          recommendation: 'Schedule annual compliance audit',
          estimatedImpact: 'Ensure continued regulatory compliance'
        }
      ],
      
      status: 'completed',
      isShared: true,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
    };
    
    const esgReportRef = await db.collection('esgReports').add(exampleESGReport);
    const esgReportId = esgReportRef.id;
    console.log(`✅ Created example ESG report`);
    console.log(`   Inspector: ${esgInspector.name}`);
    console.log(`   Report date: ${esgReportDate}`);
    console.log(`   Overall ESG Score: ${exampleESGReport.overallESGScore}/100`);
    console.log(`   Recommendations: ${exampleESGReport.recommendations.length}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 DANISH TEST DEPARTMENT CREATION SUMMARY\n');
    console.log('='.repeat(80));
    
    console.log('\n✅ CREATED:');
    console.log(`\n🇩🇰 BRANCH:`);
    console.log(`   Name: ${branchData.name}`);
    console.log(`   ID: ${branchId}`);
    console.log(`   Address: ${branchData.address}`);
    console.log(`   Email: ${branchData.email}`);
    console.log(`   Phone: ${branchData.phone}`);
    
    console.log(`\n👔 BRANCH MANAGER:`);
    console.log(`   Name: ${managerName}`);
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Password: ${managerPassword}`);
    
    console.log(`\n👷 INSPECTORS (3):`);
    createdInspectors.forEach((insp, i) => {
      console.log(`   ${i + 1}. ${insp.name}`);
      console.log(`      Email: ${insp.email}`);
      console.log(`      Password: ${insp.password}`);
    });
    
    console.log(`\n👥 EXAMPLE DATA:`);
    console.log(`   Customer: ${exampleCustomer.name}`);
    console.log(`   Building: ${exampleBuilding.address}`);
    console.log(`   Inspection Report: 1 (status: completed)`);
    console.log(`   ESG Report: 1 (ESG Score: ${exampleESGReport.overallESGScore}/100)`);
    
    console.log('\n📝 LOGIN CREDENTIALS:\n');
    console.log(`🔑 Branch Manager (Flemming Adolfsen):`);
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Password: ${managerPassword}`);
    console.log(`   Role: Branch Admin`);
    
    console.log(`\n🔑 Inspectors:`);
    createdInspectors.forEach(insp => {
      console.log(`   Email: ${insp.email}`);
      console.log(`   Password: ${insp.password}`);
      console.log(`   Role: Inspector`);
      console.log();
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ DANISH TEST DEPARTMENT CREATION COMPLETE!\n');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await initializeFirebase();
    db = admin.firestore();
    auth = admin.auth();
    await createDanishTestDepartment();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
})();
