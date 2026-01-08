#!/usr/bin/env node

/**
 * Add Småland Branch Script
 * 
 * This script creates the Småland branch in Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config (using public config - safe for client-side)
const firebaseConfig = {
  apiKey: "AIzaSyCQrK7K8QrK7K8QrK7K8QrK7K8QrK7K8Q",
  authDomain: "taklaget-service-app.firebaseapp.com",
  projectId: "taklaget-service-app",
  storageBucket: "taklaget-service-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

async function addSmalandBranch() {
  try {
    console.log('🏢 Adding Småland branch to the system...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Småland branch data
    const smalandBranch = {
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
      postalCode: '352 46'
    };

    // Add branch to Firestore
    await setDoc(doc(db, 'branches', 'smaland'), smalandBranch);

    console.log('✅ Successfully added Småland branch!');
    console.log(`   Branch ID: smaland`);
    console.log(`   Name: ${smalandBranch.name}`);
    console.log(`   Address: ${smalandBranch.address}`);
    console.log(`   Email: ${smalandBranch.email}`);
    console.log(`   Phone: ${smalandBranch.phone}\n`);

    console.log('🎯 Linus Hollberg can now access the Småland branch as branch manager!');

  } catch (error) {
    console.error('❌ Error adding Småland branch:', error);
    console.log('\n💡 Alternative: Add branch manually through Firebase Console:');
    console.log('1. Go to Firebase Console > Firestore Database');
    console.log('2. Create new document in "branches" collection');
    console.log('3. Document ID: smaland');
    console.log('4. Add fields: name, address, phone, email, isActive, country, etc.');
  }
}

// Run the script
addSmalandBranch();
