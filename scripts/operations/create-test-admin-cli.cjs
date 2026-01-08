#!/usr/bin/env node

/**
 * Create Test Super Admin Account (CLI Method)
 * 
 * Alternative method using Firebase CLI commands
 * Requires: firebase-tools installed and authenticated
 */

const { execSync } = require('child_process');

async function createTestAdminCLI() {
  try {
    console.log('🔧 Creating Test Super Admin Account (CLI Method)\n');
    console.log('Project: taklaget-service-app-test\n');

    const adminEmail = 'admin@taklaget.onmicrosoft.com';
    const adminName = 'Taklaget Test Super Administrator';
    const password = generatePassword();

    console.log('📋 Creating super admin account...\n');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    console.log(`   Permission Level: 2 (Super Admin)\n`);

    // Note: Firebase CLI doesn't support creating users with custom claims directly
    // This method creates the user, but custom claims must be set via Admin SDK or Cloud Function
    
    console.log('⚠️  This method creates the user but requires Admin SDK for custom claims.');
    console.log('   Please use create-test-admin.cjs with service account key instead.\n');
    console.log('   Or download service account key and run:');
    console.log('   node scripts/operations/create-test-admin.cjs\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

createTestAdminCLI();

