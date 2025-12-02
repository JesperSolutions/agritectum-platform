#!/usr/bin/env node

/**
 * Add New Users Script
 * 
 * This script adds new users to the users.json file for Firebase Auth emulator
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default password for all new users
const DEFAULT_PASSWORD = 'Inspector123!';

// Generate password hash and salt (same method as Firebase)
function generatePasswordHash(password, salt) {
  const crypto = require('crypto');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
  return hash.toString('base64');
}

function generateSalt() {
  return crypto.randomBytes(12).toString('base64');
}

function generateLocalId() {
  return crypto.randomBytes(28).toString('base64').replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
}

function addNewUsers() {
  try {
    console.log('👥 Adding new users to the system...\n');

    // Read existing users
    const usersPath = path.join(__dirname, '..', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    // New users to add
    const newUsers = [
      {
        displayName: 'Linus Hollberg',
        email: 'linus.hollberg@taklagetentreprenad.se',
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: 'smaland'
      },
      {
        displayName: 'Bengt Widstrand',
        email: 'Bengt.widstrand@binne.se',
        role: 'inspector',
        permissionLevel: 0,
        branchId: 'stockholm' // Using stockholm as default branch
      },
      {
        displayName: 'Magnus Eriksson',
        email: 'Magnus.eriksson@binne.se',
        role: 'inspector',
        permissionLevel: 0,
        branchId: 'stockholm' // Using stockholm as default branch
      }
    ];

    // Add new users
    newUsers.forEach(userData => {
      const salt = generateSalt();
      const passwordHash = generatePasswordHash(DEFAULT_PASSWORD, salt);
      const localId = generateLocalId();
      const createdAt = Date.now().toString();

      const newUser = {
        localId: localId,
        email: userData.email,
        emailVerified: true,
        passwordHash: passwordHash,
        salt: salt,
        displayName: userData.displayName,
        createdAt: createdAt,
        disabled: false,
        customAttributes: JSON.stringify({
          role: userData.role,
          permissionLevel: userData.permissionLevel,
          branchId: userData.branchId
        }),
        providerUserInfo: []
      };

      usersData.users.push(newUser);

      console.log(`✅ Added ${userData.displayName}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Branch: ${userData.branchId}`);
      console.log(`   Password: ${DEFAULT_PASSWORD}`);
      console.log(`   User ID: ${localId}\n`);
    });

    // Write updated users back to file
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

    console.log('🎉 All new users have been added successfully!\n');
    
    console.log('🔑 Login Credentials for New Users:');
    newUsers.forEach(user => {
      console.log(`   • ${user.email} / ${DEFAULT_PASSWORD} (${user.branchId} - ${user.role})`);
    });

    console.log('\n📝 Next Steps:');
    console.log('1. Restart Firebase emulators: npm run emulators');
    console.log('2. Users can now login with the credentials above');
    console.log('3. Linus Hollberg will have branch admin access for Småland');
    console.log('4. Bengt and Magnus are inspectors for testing');

  } catch (error) {
    console.error('❌ Error adding users:', error);
  }
}

// Run the script
addNewUsers();
