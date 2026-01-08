#!/usr/bin/env node

/**
 * Create Sales Users via Cloud Function API
 * 
 * This script calls the createUserWithAuth Cloud Function to create user accounts
 */

const https = require('https');

// Cloud Function URL
const FUNCTION_URL = 'https://createuserwithauth-yitis2ljlq-uc.a.run.app';

// Read credentials
const fs = require('fs');
const path = require('path');
const credentialsPath = path.join(__dirname, '..', '..', 'sales-user-credentials.json');

function callCloudFunction(userData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(userData);
    
    const url = new URL(FUNCTION_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(result.error || `HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function createUsers() {
  try {
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ sales-user-credentials.json not found. Please run create-sales-users.cjs first.');
      process.exit(1);
    }

    const credentialsData = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const users = credentialsData.users;

    console.log('👥 Creating sales user accounts via Cloud Function...\n');
    console.log(`📋 Found ${users.length} users to create\n`);

    const results = [];

    for (const user of users) {
      try {
        console.log(`Creating: ${user.displayName} (${user.email})...`);
        
        const userData = {
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          role: user.role || 'branchAdmin',
          branchId: user.branchId,
          isActive: true,
          invitedBy: 'Script'
        };

        const result = await callCloudFunction(userData);
        
        console.log(`   ✅ User created successfully!`);
        console.log(`   User ID: ${result.userId}`);
        console.log(`   Firebase UID: ${result.firebaseUid}\n`);

        results.push({
          ...user,
          success: true,
          userId: result.userId,
          firebaseUid: result.firebaseUid
        });

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        results.push({
          ...user,
          success: false,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 CREATION SUMMARY');
    console.log('='.repeat(80) + '\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successfully created: ${successful.length} user(s)`);
    successful.forEach(user => {
      console.log(`   • ${user.displayName} (${user.email})`);
    });

    if (failed.length > 0) {
      console.log(`\n❌ Failed to create: ${failed.length} user(s)`);
      failed.forEach(user => {
        console.log(`   • ${user.displayName} (${user.email})`);
        console.log(`     Error: ${user.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Users can now log in with their credentials!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsers();

