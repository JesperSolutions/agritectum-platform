#!/usr/bin/env node

/**
 * Fix Test Users Script
 * 
 * This script updates Bengt and Magnus to be branch managers for test companies
 */

const fs = require('fs');
const path = require('path');

function fixTestUsers() {
  try {
    console.log('🔧 Fixing test user roles...\n');

    // Read existing users
    const usersPath = path.join(__dirname, '..', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    // Find and update Bengt and Magnus
    let updatedCount = 0;

    usersData.users.forEach(user => {
      if (user.email === 'Bengt.widstrand@binne.se') {
        user.displayName = 'Bengt Widstrand';
        user.customAttributes = JSON.stringify({
          role: 'branchAdmin',
          permissionLevel: 1,
          branchId: 'taklaget-company-a'
        });
        console.log('✅ Updated Bengt Widstrand to Branch Manager for Taklaget Company A');
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: branchAdmin`);
        console.log(`   Branch: taklaget-company-a`);
        updatedCount++;
      }
      
      if (user.email === 'Magnus.eriksson@binne.se') {
        user.displayName = 'Magnus Eriksson';
        user.customAttributes = JSON.stringify({
          role: 'branchAdmin',
          permissionLevel: 1,
          branchId: 'taklaget-company-b'
        });
        console.log('✅ Updated Magnus Eriksson to Branch Manager for Taklaget Company B');
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: branchAdmin`);
        console.log(`   Branch: taklaget-company-b`);
        updatedCount++;
      }
    });

    // Write updated users back to file
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

    console.log(`\n🎉 Updated ${updatedCount} test users successfully!\n`);
    
    console.log('🔑 Updated Login Credentials:');
    console.log('   • linus.hollberg@taklagetentreprenad.se / Inspector123! (Småland - Branch Manager)');
    console.log('   • Bengt.widstrand@binne.se / Inspector123! (Taklaget Company A - Branch Manager)');
    console.log('   • Magnus.eriksson@binne.se / Inspector123! (Taklaget Company B - Branch Manager)');

    console.log('\n📝 Next Steps:');
    console.log('1. Restart Firebase emulators: npm run emulators');
    console.log('2. Create test branches: Taklaget Company A & Taklaget Company B');
    console.log('3. Bengt and Magnus can now test full branch management flow');

  } catch (error) {
    console.error('❌ Error updating users:', error);
  }
}

// Run the script
fixTestUsers();
