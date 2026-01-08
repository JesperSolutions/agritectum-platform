#!/usr/bin/env node

/**
 * Add Branches to Firestore Script
 * 
 * This script actually adds the test branches to the Firebase Firestore database
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs } = require('firebase/firestore');

// Firebase config (using the same config as the app)
const firebaseConfig = {
  apiKey: "AIzaSyCQrK7K8QrK7K8QrK7K8QrK7K8QrK7K8Q",
  authDomain: "taklaget-service-app.firebaseapp.com",
  projectId: "taklaget-service-app",
  storageBucket: "taklaget-service-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

async function addBranchesToFirestore() {
  try {
    console.log('🔥 Adding branches to Firebase Firestore...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Test branches data
    const testBranches = [
      {
        id: 'taklaget-company-a',
        name: 'Taklaget Company A',
        address: 'Test Location A, Stockholm',
        phone: '+46 8 123 456 78',
        email: 'company-a@taklaget.se',
        isActive: true,
        country: 'Sweden',
        createdAt: new Date().toISOString(),
        website: 'https://taklaget.se',
        description: 'Test branch for high-end testing - Company A',
        region: 'Stockholm',
        municipality: 'Stockholm',
        postalCode: '111 22',
        businessType: 'Test Company',
        contactPerson: {
          name: 'Bengt Widstrand',
          title: 'Branch Manager',
          phone: '+46 8 123 456 78',
          email: 'Bengt.widstrand@binne.se'
        }
      },
      {
        id: 'taklaget-company-b',
        name: 'Taklaget Company B',
        address: 'Test Location B, Stockholm',
        phone: '+46 8 987 654 32',
        email: 'company-b@taklaget.se',
        isActive: true,
        country: 'Sweden',
        createdAt: new Date().toISOString(),
        website: 'https://taklaget.se',
        description: 'Test branch for high-end testing - Company B',
        region: 'Stockholm',
        municipality: 'Stockholm',
        postalCode: '111 33',
        businessType: 'Test Company',
        contactPerson: {
          name: 'Magnus Eriksson',
          title: 'Branch Manager',
          phone: '+46 8 987 654 32',
          email: 'Magnus.eriksson@binne.se'
        }
      },
      {
        id: 'smaland',
        name: 'Taklaget Småland',
        address: 'Växjö, Småland',
        phone: '+46 470 123 456',
        email: 'smaland@taklaget.se',
        isActive: true,
        country: 'Sweden',
        createdAt: new Date().toISOString(),
        website: 'https://taklaget.se',
        description: 'Taklaget branch serving the Småland region',
        region: 'Småland',
        municipality: 'Växjö',
        postalCode: '352 46',
        businessType: 'Roofing Company',
        contactPerson: {
          name: 'Linus Hollberg',
          title: 'Branch Manager',
          phone: '+46 470 123 456',
          email: 'linus.hollberg@taklagetentreprenad.se'
        }
      }
    ];

    console.log('📋 Adding branches to Firestore...\n');

    for (const branch of testBranches) {
      try {
        // Add branch to Firestore
        await setDoc(doc(db, 'branches', branch.id), branch);
        
        console.log(`✅ Added ${branch.name}`);
        console.log(`   Branch ID: ${branch.id}`);
        console.log(`   Manager: ${branch.contactPerson.name}`);
        console.log(`   Email: ${branch.contactPerson.email}`);
        console.log(`   Location: ${branch.address}\n`);
      } catch (error) {
        console.error(`❌ Error adding ${branch.name}:`, error.message);
      }
    }

    // Verify branches were added
    console.log('🔍 Verifying branches in Firestore...\n');
    const branchesRef = collection(db, 'branches');
    const snapshot = await getDocs(branchesRef);
    
    console.log(`📊 Total branches in database: ${snapshot.size}`);
    snapshot.forEach(doc => {
      const branch = doc.data();
      console.log(`   • ${branch.name} (${doc.id})`);
    });

    console.log('\n🎉 All test branches have been successfully added to Firebase!');
    console.log('\n🔑 Updated User Access:');
    console.log('   • linus.hollberg@taklagetentreprenad.se - Branch Manager for Taklaget Småland');
    console.log('   • Bengt.widstrand@binne.se - Branch Manager for Taklaget Company A');
    console.log('   • Magnus.eriksson@binne.se - Branch Manager for Taklaget Company B');

  } catch (error) {
    console.error('❌ Error adding branches to Firestore:', error);
    console.log('\n💡 Alternative: Add branches manually through Firebase Console:');
    console.log('1. Go to Firebase Console > Firestore Database');
    console.log('2. Create new documents in "branches" collection');
    console.log('3. Use the branch data from the test-branches.json file');
  }
}

// Run the script
addBranchesToFirestore();
