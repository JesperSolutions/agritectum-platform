#!/usr/bin/env node

/**
 * Fix Branch Admin Claims Script
 * 
 * This script fixes missing custom claims for branch admin users
 * - Adds Linus Hollberg with proper custom claims
 * - Adds Bengt Widstrand and Magnus Eriksson as branch admins
 */

const fs = require('fs');
const path = require('path');

function fixBranchAdminClaims() {
  try {
    console.log('🔧 Fixing branch admin custom claims...\n');

    // Read existing users
    const usersPath = path.join(__dirname, '..', 'users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    // Check if Linus exists and fix his claims
    const linusIndex = usersData.users.findIndex(
      user => user.email === 'linus.hollberg@taklagetentreprenad.se'
    );

    if (linusIndex !== -1) {
      // Update Linus with proper custom claims
      usersData.users[linusIndex].customAttributes = JSON.stringify({
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: 'jYPEEhrb7iNGqumvV80L' // From console logs
      });
      console.log('✅ Updated Linus Hollberg with custom claims');
      console.log('   Email: linus.hollberg@taklagetentreprenad.se');
      console.log('   Role: branchAdmin');
      console.log('   Permission Level: 1');
      console.log('   Branch ID: jYPEEhrb7iNGqumvV80L\n');
    } else {
      console.log('❌ Linus Hollberg not found in users.json');
    }

    // Check if Bengt exists
    const bengtIndex = usersData.users.findIndex(
      user => user.email === 'Bengt.widstrand@binne.se'
    );

    if (bengtIndex === -1) {
      // Add Bengt as branch admin
      const bengtUser = {
        localId: generateLocalId(),
        email: 'Bengt.widstrand@binne.se',
        emailVerified: true,
        passwordHash: 'dP0slV+uu5DryFkRQCGaBnPlof40ei0uqAvzG/YWG4YbsXkyhSgqL2HrE7ysPwd0rjXs/IpRBhOmnA/7nWYhCA==',
        salt: '1SkJ6WHXAPVlcw==',
        displayName: 'Bengt Widstrand',
        createdAt: Date.now().toString(),
        disabled: false,
        customAttributes: JSON.stringify({
          role: 'branchAdmin',
          permissionLevel: 1,
          branchId: 'bengt-branch-id' // Will need to be updated with actual branch ID
        }),
        providerUserInfo: []
      };
      usersData.users.push(bengtUser);
      console.log('✅ Added Bengt Widstrand as branch admin');
      console.log('   Email: Bengt.widstrand@binne.se');
      console.log('   Role: branchAdmin');
      console.log('   Permission Level: 1');
      console.log('   Password: Taklaget2025!\n');
    } else {
      console.log('⚠️  Bengt Widstrand already exists, updating claims...');
      usersData.users[bengtIndex].customAttributes = JSON.stringify({
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: 'bengt-branch-id' // Will need to be updated with actual branch ID
      });
      console.log('✅ Updated Bengt Widstrand with custom claims\n');
    }

    // Check if Magnus exists
    const magnusIndex = usersData.users.findIndex(
      user => user.email === 'Magnus.eriksson@binne.se'
    );

    if (magnusIndex === -1) {
      // Add Magnus as branch admin
      const magnusUser = {
        localId: generateLocalId(),
        email: 'Magnus.eriksson@binne.se',
        emailVerified: true,
        passwordHash: 'j3BtqgbnoADqxkMNG+8u4jpYmioZ7OF/pkNkK5ZdKND+pcvoaz+0h9aEsHvkxQuv0A4sOIsM+3WAe/mIl9d63A==',
        salt: 'CUohcuaU8qSzGA==',
        displayName: 'Magnus Eriksson',
        createdAt: Date.now().toString(),
        disabled: false,
        customAttributes: JSON.stringify({
          role: 'branchAdmin',
          permissionLevel: 1,
          branchId: 'jYPEEhrb7iNGqumvV80L' // From console logs - same as Linus
        }),
        providerUserInfo: []
      };
      usersData.users.push(magnusUser);
      console.log('✅ Added Magnus Eriksson as branch admin');
      console.log('   Email: Magnus.eriksson@binne.se');
      console.log('   Role: branchAdmin');
      console.log('   Permission Level: 1');
      console.log('   Password: Taklaget2025!\n');
    } else {
      console.log('⚠️  Magnus Eriksson already exists, updating claims...');
      usersData.users[magnusIndex].customAttributes = JSON.stringify({
        role: 'branchAdmin',
        permissionLevel: 1,
        branchId: 'jYPEEhrb7iNGqumvV80L' // From console logs - same as Linus
      });
      console.log('✅ Updated Magnus Eriksson with custom claims\n');
    }

    // Write updated users back to file
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

    console.log('🎉 Branch admin custom claims fixed successfully!\n');
    
    console.log('🔑 Updated Login Credentials:');
    console.log('   • linus.hollberg@taklagetentreprenad.se / Taklaget2025! (Branch Admin)');
    console.log('   • Bengt.widstrand@binne.se / Taklaget2025! (Branch Admin)');
    console.log('   • Magnus.eriksson@binne.se / Taklaget2025! (Branch Admin)');

    console.log('\n📝 Next Steps:');
    console.log('1. Restart Firebase emulators: npm run emulators');
    console.log('2. Test login with the credentials above');
    console.log('3. Verify that branch admins can now access all data');

  } catch (error) {
    console.error('❌ Error fixing branch admin claims:', error);
  }
}

// Helper function to generate local ID
function generateLocalId() {
  const crypto = require('crypto');
  return crypto.randomBytes(28).toString('base64').replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
}

// Run the script
fixBranchAdminClaims();

