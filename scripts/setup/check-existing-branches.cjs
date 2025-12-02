#!/usr/bin/env node

/**
 * Check Existing Branches Script
 * 
 * This script checks what branches currently exist in Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase config (using public config - safe for client-side)
const firebaseConfig = {
  apiKey: "AIzaSyB7t5LITs2cydGizXE5cJAlIY7Q3p9wR1k",
  authDomain: "agritectum-platform.firebaseapp.com",
  projectId: "agritectum-platform",
  storageBucket: "agritectum-platform.firebasestorage.app",
  messagingSenderId: "831129873464",
  appId: "1:831129873464:web:eda440c687b5e883c84acd"
};

async function checkExistingBranches() {
  try {
    console.log('🔍 Checking existing branches in Firestore...\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get all branches
    const branchesRef = collection(db, 'branches');
    const snapshot = await getDocs(branchesRef);
    
    console.log(`📊 Found ${snapshot.size} branches in the database:\n`);
    
    snapshot.forEach(doc => {
      const branch = doc.data();
      console.log(`✅ ${branch.name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Address: ${branch.address}`);
      console.log(`   Phone: ${branch.phone}`);
      console.log(`   Email: ${branch.email}`);
      console.log(`   Active: ${branch.isActive}`);
      console.log(`   Created: ${branch.createdAt}\n`);
    });

    if (snapshot.size === 0) {
      console.log('❌ No branches found in the database.');
    }

  } catch (error) {
    console.error('❌ Error checking branches:', error);
  }
}

// Run the script
checkExistingBranches();
