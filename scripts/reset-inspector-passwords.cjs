#!/usr/bin/env node

/**
 * Inspector Password Reset Guide
 * 
 * This script provides instructions for resetting inspector passwords
 * using Firebase Emulator UI (since we don't have service account locally).
 */

const fs = require('fs');
const path = require('path');

const NEW_PASSWORD = 'Inspector123!';

function showInspectorInfo() {
  try {
    console.log('🔐 Inspector Password Reset Guide\n');

    // Read users from users.json
    const usersPath = path.join(__dirname, '..', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    const inspectorUsers = usersData.users.filter(user => {
      const customAttributes = JSON.parse(user.customAttributes || '{}');
      return customAttributes.role === 'inspector';
    });

    console.log(`Found ${inspectorUsers.length} inspector accounts:\n`);

    inspectorUsers.forEach(user => {
      const customAttributes = JSON.parse(user.customAttributes || '{}');
      console.log(`📧 ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Branch: ${customAttributes.branchId}`);
      console.log(`   User ID: ${user.localId}`);
      console.log('');
    });

    console.log('🔧 How to Reset Passwords:\n');
    console.log('1. Make sure Firebase Emulators are running:');
    console.log('   npm run emulators\n');
    console.log('2. Open Firebase Emulator UI:');
    console.log('   http://localhost:4000\n');
    console.log('3. Click "Authentication" tab');
    console.log('4. For each inspector above:');
    console.log('   - Click on their email');
    console.log('   - Click "Edit" button');
    console.log('   - Change password to:', NEW_PASSWORD);
    console.log('   - Click "Save"\n');
    console.log('5. Or use the quick method below:\n');

    console.log('⚡ Quick Method - Copy/Paste Commands:\n');
    inspectorUsers.forEach(user => {
      console.log(`# Reset ${user.displayName} (${user.email})`);
      console.log(`curl -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:update" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"localId":"${user.localId}","password":"${NEW_PASSWORD}"}'`);
      console.log('');
    });

    console.log('🎯 After reset, all inspectors can login with:');
    console.log(`   Password: ${NEW_PASSWORD}\n`);
    
    console.log('🔑 Inspector Login Credentials:');
    inspectorUsers.forEach(user => {
      const customAttributes = JSON.parse(user.customAttributes || '{}');
      console.log(`   • ${user.email} / ${NEW_PASSWORD} (${customAttributes.branchId})`);
    });

  } catch (error) {
    console.error('❌ Error reading user data:', error);
  }
}

// Run the script
showInspectorInfo();
