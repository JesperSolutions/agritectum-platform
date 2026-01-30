/**
 * Check Per Nielsen's access to customers under Flemming's branch
 */
const admin = require('firebase-admin');

const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkPerNielsenAccess() {
  console.log('🔍 Checking Per Nielsen access to customers\n');

  try {
    // 1. Find Per Nielsen user
    console.log('👤 Looking for Per Nielsen (per.nielsen@agritectum.dk)...');
    let perUser;
    try {
      perUser = await admin.auth().getUserByEmail('per.nielsen@agritectum.dk');
      console.log('✅ User found:', perUser.uid);
    } catch (error) {
      console.log('❌ User not found in Firebase Auth');
      return;
    }

    // 2. Get user's Firestore profile
    const userDoc = await db.collection('users').doc(perUser.uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      console.log('❌ No user profile in Firestore');
      return;
    }

    console.log('\n📋 Per Nielsen Profile:');
    console.log('   Email:', userData.email);
    console.log('   Role:', userData.role);
    console.log('   Branch ID:', userData.branchId);
    console.log('   Permission Level:', userData.permissionLevel);

    // 3. Get custom claims
    const tokenResult = await admin.auth().getUserByEmail('per.nielsen@agritectum.dk');
    console.log('\n🔐 Custom Claims:');
    console.log('   Role:', tokenResult.customClaims?.role);
    console.log('   Branch ID:', tokenResult.customClaims?.branchId);
    console.log('   Permission Level:', tokenResult.customClaims?.permissionLevel);

    // 4. Find Flemming's branch
    console.log('\n🏢 Looking for Flemming Adolfsen...');
    let flemmingUser;
    try {
      flemmingUser = await admin.auth().getUserByEmail('flemming.adolfsen@agritectum.dk');
      console.log('✅ Flemming found:', flemmingUser.uid);
    } catch (error) {
      console.log('❌ Flemming not found');
      return;
    }

    const flemmingDoc = await db.collection('users').doc(flemmingUser.uid).get();
    const flemmingData = flemmingDoc.data();
    
    console.log('\n📋 Flemming Profile:');
    console.log('   Email:', flemmingData.email);
    console.log('   Role:', flemmingData.role);
    console.log('   Branch ID:', flemmingData.branchId);
    console.log('   Permission Level:', flemmingData.permissionLevel);

    // 5. Check if they share the same branch
    console.log('\n🔄 Branch Comparison:');
    console.log('   Per Nielsen branch:', userData.branchId);
    console.log('   Flemming branch:', flemmingData.branchId);
    console.log('   Same branch?', userData.branchId === flemmingData.branchId ? '✅ YES' : '❌ NO');

    // 6. Get all customers in Flemming's branch
    console.log('\n👥 Customers in Flemming\'s branch (' + flemmingData.branchId + '):');
    const customersSnapshot = await db
      .collection('customers')
      .where('branchId', '==', flemmingData.branchId)
      .get();

    if (customersSnapshot.empty) {
      console.log('   ⚠️  No customers found');
    } else {
      console.log(`   Found ${customersSnapshot.size} customer(s):`);
      customersSnapshot.forEach(doc => {
        const customer = doc.data();
        console.log(`   - ${customer.name} (ID: ${doc.id})`);
        console.log(`     Created by: ${customer.createdBy || 'unknown'}`);
        console.log(`     Status: ${customer.status || 'unknown'}`);
      });
    }

    // 7. Check what customers Per Nielsen should see based on his permissions
    console.log('\n🔍 What Per Nielsen SHOULD see:');
    let shouldSeeQuery;
    
    if (userData.permissionLevel === 0) {
      // Inspector: Only sees customers in their branch
      console.log('   Role: Inspector (permissionLevel 0)');
      console.log('   Should see: All customers in branch ' + userData.branchId);
      shouldSeeQuery = db.collection('customers').where('branchId', '==', userData.branchId);
    } else if (userData.permissionLevel === 1) {
      // Branch Admin: Sees all customers in their branch
      console.log('   Role: Branch Admin (permissionLevel 1)');
      console.log('   Should see: All customers in branch ' + userData.branchId);
      shouldSeeQuery = db.collection('customers').where('branchId', '==', userData.branchId);
    } else if (userData.permissionLevel >= 2) {
      // Superadmin: Sees all customers
      console.log('   Role: Superadmin (permissionLevel 2)');
      console.log('   Should see: ALL customers across all branches');
      shouldSeeQuery = db.collection('customers');
    }

    if (shouldSeeQuery) {
      const perCustomersSnapshot = await shouldSeeQuery.get();
      console.log(`   Expected customer count: ${perCustomersSnapshot.size}`);
      
      if (perCustomersSnapshot.size > 0) {
        perCustomersSnapshot.forEach(doc => {
          const customer = doc.data();
          console.log(`   - ${customer.name} (${customer.branchId || 'no branch'})`);
        });
      }
    }

    // 8. Diagnose the issue
    console.log('\n🔧 DIAGNOSIS:');
    if (userData.branchId !== flemmingData.branchId) {
      console.log('   ❌ PROBLEM: Per Nielsen and Flemming are in DIFFERENT branches');
      console.log(`   ❌ Per is in: ${userData.branchId}`);
      console.log(`   ❌ Flemming is in: ${flemmingData.branchId}`);
      console.log('\n   💡 SOLUTION: Update Per Nielsen to same branch as Flemming');
    } else if (customersSnapshot.size === 0) {
      console.log('   ⚠️  PROBLEM: No customers exist in Flemming\'s branch');
      console.log('   💡 SOLUTION: Create customers or check customer branchId values');
    } else {
      console.log('   ✅ Per Nielsen SHOULD see all customers in the branch');
      console.log('   ⚠️  If he still can\'t see them, check:');
      console.log('      1. Frontend query logic');
      console.log('      2. Firestore security rules');
      console.log('      3. User needs to re-login to get fresh token claims');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPerNielsenAccess().then(() => process.exit(0));
