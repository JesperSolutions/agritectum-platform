#!/usr/bin/env node

/**
 * Add Company Branches Script
 * 
 * This script creates Taklaget Company A and Company B branches using the same approach as Småland
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

async function addCompanyBranches() {
  try {
    console.log('🏢 Adding Company A and Company B branches...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Company A branch data
    const companyABranch = {
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
      postalCode: '111 22'
    };

    // Company B branch data
    const companyBBranch = {
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
      postalCode: '111 33'
    };

    // Add Company A branch to Firestore
    console.log('Adding Taklaget Company A...');
    await setDoc(doc(db, 'branches', 'taklaget-company-a'), companyABranch);
    console.log('✅ Successfully added Taklaget Company A!');
    console.log(`   Branch ID: taklaget-company-a`);
    console.log(`   Name: ${companyABranch.name}`);
    console.log(`   Address: ${companyABranch.address}`);
    console.log(`   Email: ${companyABranch.email}`);
    console.log(`   Phone: ${companyABranch.phone}\n`);

    // Add Company B branch to Firestore
    console.log('Adding Taklaget Company B...');
    await setDoc(doc(db, 'branches', 'taklaget-company-b'), companyBBranch);
    console.log('✅ Successfully added Taklaget Company B!');
    console.log(`   Branch ID: taklaget-company-b`);
    console.log(`   Name: ${companyBBranch.name}`);
    console.log(`   Address: ${companyBBranch.address}`);
    console.log(`   Email: ${companyBBranch.email}`);
    console.log(`   Phone: ${companyBBranch.phone}\n`);

    console.log('🎯 Bengt and Magnus can now access their respective company branches as branch managers!');

  } catch (error) {
    console.error('❌ Error adding company branches:', error);
  }
}

// Run the script
addCompanyBranches();
