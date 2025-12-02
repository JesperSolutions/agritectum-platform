#!/usr/bin/env node

/**
 * Add Branches using Firebase CLI
 * 
 * This script uses Firebase CLI to add branches to Firestore
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function addBranchesWithFirebaseCLI() {
  try {
    console.log('🔥 Adding branches using Firebase CLI...\n');

    // Company A branch data
    const companyAData = {
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
    const companyBData = {
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

    // Add Company A
    console.log('Adding Taklaget Company A...');
    const companyAJson = JSON.stringify(companyAData);
    const companyACmd = `firebase firestore:set branches/taklaget-company-a '${companyAJson}'`;
    
    try {
      await execAsync(companyACmd);
      console.log('✅ Successfully added Taklaget Company A!');
    } catch (error) {
      console.log('❌ Failed to add Company A:', error.message);
    }

    // Add Company B
    console.log('\nAdding Taklaget Company B...');
    const companyBJson = JSON.stringify(companyBData);
    const companyBCmd = `firebase firestore:set branches/taklaget-company-b '${companyBJson}'`;
    
    try {
      await execAsync(companyBCmd);
      console.log('✅ Successfully added Taklaget Company B!');
    } catch (error) {
      console.log('❌ Failed to add Company B:', error.message);
    }

    console.log('\n🎯 Branches added! Bengt and Magnus can now access their company branches.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addBranchesWithFirebaseCLI();
