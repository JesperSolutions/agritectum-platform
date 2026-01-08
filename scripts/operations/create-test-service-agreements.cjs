#!/usr/bin/env node

/**
 * Create Test Service Agreements
 * 
 * Creates 5 test service agreements with public tokens for testing the public acceptance flow
 * Usage: node scripts/operations/create-test-service-agreements.cjs [--project PROJECT_ID]
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    console.error('   Please install it: npm install firebase-admin');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let projectId = 'taklaget-service-app-test'; // Default to test project

const projectIndex = args.indexOf('--project');
if (projectIndex !== -1 && args[projectIndex + 1]) {
  projectId = args[projectIndex + 1];
}

// Initialize Firebase Admin
async function initializeFirebase() {
  try {
    // Find test project service account key
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    const serviceAccountFile = files.find(f => 
      f.startsWith(`${projectId}-firebase-adminsdk-`) && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      console.error('❌ Service account key not found!');
      console.error(`   Expected file pattern: ${projectId}-firebase-adminsdk-*.json`);
      console.error('   Please download it from Firebase Console > Project Settings > Service Accounts');
      process.exit(1);
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // If already initialized, check if it's the correct project
      const currentProject = admin.app().options.projectId;
      if (currentProject !== projectId) {
        console.log(`⚠️  Reinitializing with ${projectId} project...`);
        admin.app().delete();
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
    
    console.log(`✅ Firebase Admin initialized for project: ${projectId}\n`);
    return admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

// Generate a unique public token
function generatePublicToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Test customers data
const testCustomers = [
  {
    name: 'Test Customer 1 - Maintenance',
    email: 'test1@example.com',
    phone: '+46 70 123 4567',
    address: 'Storgatan 1, 111 51 Stockholm, Sweden',
  },
  {
    name: 'Test Customer 2 - Inspection',
    email: 'test2@example.com',
    phone: '+46 70 234 5678',
    address: 'Drottninggatan 15, 111 51 Stockholm, Sweden',
  },
  {
    name: 'Test Customer 3 - Repair',
    email: 'test3@example.com',
    phone: '+46 70 345 6789',
    address: 'Kungsgatan 20, 111 43 Stockholm, Sweden',
  },
  {
    name: 'Test Customer 4 - Annual Service',
    email: 'test4@example.com',
    phone: '+46 70 456 7890',
    address: 'Vasagatan 30, 111 20 Stockholm, Sweden',
  },
  {
    name: 'Test Customer 5 - Quarterly Maintenance',
    email: 'test5@example.com',
    phone: '+46 70 567 8901',
    address: 'Birger Jarlsgatan 10, 114 34 Stockholm, Sweden',
  },
];

// Service agreements data
const serviceAgreements = [
  {
    agreementType: 'maintenance',
    title: 'Årligt takunderhåll',
    description: 'Komplett årligt underhåll av taket inklusive rengöring, kontroll av takpapp och reparation av mindre skador.',
    serviceFrequency: 'annual',
    price: 15000,
    currency: 'SEK',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    termsAndConditions: 'Genom att acceptera detta serviceavtal godkänner du att:\n1. Service utförs enligt överenskommelse\n2. Betalning sker enligt faktura\n3. Avtalet gäller för angiven period\n4. Ändringar måste godkännas skriftligt',
  },
  {
    agreementType: 'inspection',
    title: 'Halvårsvis takinspektion',
    description: 'Grundlig inspektion av takets skick, dokumentation av eventuella skador och rekommendationer för åtgärder.',
    serviceFrequency: 'biannual',
    price: 5000,
    currency: 'SEK',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    termsAndConditions: 'Genom att acceptera detta serviceavtal godkänner du att:\n1. Inspektioner utförs regelbundet\n2. Rapporter levereras efter varje inspektion\n3. Åtgärder rekommenderas vid behov\n4. Kostnader faktureras separat',
  },
  {
    agreementType: 'repair',
    title: 'Akut reparation - Takläckage',
    description: 'Reparation av identifierat takläckage med garanti på utfört arbete. Inkluderar material och arbete.',
    serviceFrequency: 'custom',
    serviceInterval: 0,
    price: 25000,
    currency: 'SEK',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    termsAndConditions: 'Genom att acceptera detta serviceavtal godkänner du att:\n1. Reparation utförs inom angiven tidsram\n2. Material och arbete ingår i priset\n3. Garanti gäller på utfört arbete\n4. Ytterligare skador kan komma att upptäckas',
  },
  {
    agreementType: 'maintenance',
    title: 'Månadsvis takunderhåll',
    description: 'Regelbundet månadsvis underhåll för att säkerställa takets långsiktiga hållbarhet.',
    serviceFrequency: 'monthly',
    price: 3000,
    currency: 'SEK',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    termsAndConditions: 'Genom att acceptera detta serviceavtal godkänner du att:\n1. Service utförs månadsvis\n2. Betalning sker månadsvis\n3. Avtalet löper i 12 månader\n4. Uppsägning kräver 30 dagars varsel',
  },
  {
    agreementType: 'maintenance',
    title: 'Kvartalsvis takunderhåll',
    description: 'Kvartalsvis service för att hålla taket i optimalt skick genom hela året.',
    serviceFrequency: 'quarterly',
    price: 8000,
    currency: 'SEK',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    termsAndConditions: 'Genom att acceptera detta serviceavtal godkänner du att:\n1. Service utförs kvartalsvis\n2. Betalning sker kvartalsvis\n3. Avtalet löper i 12 månader\n4. Ytterligare service kan beställas separat',
  },
];

async function createTestServiceAgreements() {
  try {
    console.log(`\n🔧 Creating test service agreements in project: ${projectId}\n`);
    
    // Initialize Firebase
    const db = await initializeFirebase();

    // Get or create a test branch admin user for createdBy
    let adminUserId = null;
    let adminUserName = 'Test Admin';
    
    try {
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'branchAdmin')
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        const adminUser = usersSnapshot.docs[0].data();
        adminUserId = usersSnapshot.docs[0].id;
        adminUserName = adminUser.displayName || adminUser.email || 'Test Admin';
      } else {
        // Try to get any user
        const anyUserSnapshot = await db.collection('users').limit(1).get();
        if (!anyUserSnapshot.empty) {
          adminUserId = anyUserSnapshot.docs[0].id;
          adminUserName = anyUserSnapshot.docs[0].data().displayName || anyUserSnapshot.docs[0].data().email || 'Test Admin';
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not find admin user, using placeholder');
    }

    // Get or determine branch ID - try to find Stockholm branch first
    let branchId = 'main';
    try {
      // First try to find Stockholm branch by name
      const stockholmBranchSnapshot = await db.collection('branches')
        .where('name', '>=', 'Stockholm')
        .where('name', '<=', 'Stockholm\uf8ff')
        .limit(1)
        .get();
      
      if (!stockholmBranchSnapshot.empty) {
        branchId = stockholmBranchSnapshot.docs[0].id;
        console.log(`✅ Found Stockholm branch: ${branchId}`);
      } else {
        // Try to find any branch
        const branchesSnapshot = await db.collection('branches').limit(1).get();
        if (!branchesSnapshot.empty) {
          branchId = branchesSnapshot.docs[0].id;
          console.log(`⚠️  Using first available branch: ${branchId}`);
        } else {
          // Check if user has a branchId
          if (adminUserId) {
            const userDoc = await db.collection('users').doc(adminUserId).get();
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.branchId) {
                branchId = userData.branchId;
                console.log(`✅ Using user's branch: ${branchId}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not find branch, using "main"');
    }
    
    console.log(`📌 Creating agreements for branch: ${branchId}\n`);

    const createdAgreements = [];

    for (let i = 0; i < testCustomers.length; i++) {
      const customer = testCustomers[i];
      const agreementData = serviceAgreements[i];

      // Generate public token
      const publicToken = generatePublicToken();

      // Create or get customer
      let customerId = null;
      try {
        const customerQuery = await db.collection('customers')
          .where('email', '==', customer.email)
          .limit(1)
          .get();
        
        if (!customerQuery.empty) {
          customerId = customerQuery.docs[0].id;
        } else {
          // Create customer
          const customerRef = await db.collection('customers').add({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            branchId: branchId,
            customerType: 'individual',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          customerId = customerRef.id;
          console.log(`✅ Created customer: ${customer.name}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not create/get customer ${customer.name}, using placeholder ID`);
        customerId = `test-customer-${i + 1}`;
      }

      // Create service agreement
      const agreementDoc = {
        customerId: customerId,
        customerName: customer.name,
        customerAddress: customer.address,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        branchId: branchId,
        createdBy: adminUserId || 'system',
        createdByName: adminUserName,
        agreementType: agreementData.agreementType,
        title: agreementData.title,
        description: agreementData.description,
        startDate: agreementData.startDate,
        endDate: agreementData.endDate,
        nextServiceDate: agreementData.nextServiceDate,
        serviceFrequency: agreementData.serviceFrequency,
        status: agreementData.status,
        price: agreementData.price,
        currency: agreementData.currency,
        isPublic: true,
        publicToken: publicToken,
        termsAndConditions: agreementData.termsAndConditions,
        termsDocuments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only add serviceInterval if it's defined
      if (agreementData.serviceInterval !== undefined) {
        agreementDoc.serviceInterval = agreementData.serviceInterval;
      }

      const agreementRef = await db.collection('serviceAgreements').add(agreementDoc);

      const publicUrl = `https://${projectId}.web.app/service-agreement/public/${publicToken}`;
      
      createdAgreements.push({
        id: agreementRef.id,
        title: agreementData.title,
        customer: customer.name,
        publicToken: publicToken,
        publicUrl: publicUrl,
      });

      console.log(`✅ Created service agreement: ${agreementData.title}`);
      console.log(`   Customer: ${customer.name}`);
      console.log(`   Public URL: ${publicUrl}\n`);
    }

    console.log('\n📋 Summary:');
    console.log(`   Created ${createdAgreements.length} service agreements\n`);
    console.log('🔗 Public URLs:');
    createdAgreements.forEach((agreement, index) => {
      console.log(`   ${index + 1}. ${agreement.title}`);
      console.log(`      ${agreement.publicUrl}`);
    });

    console.log('\n✅ All test service agreements created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error creating test service agreements:', error);
    process.exit(1);
  }
}

// Run the script
createTestServiceAgreements()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

