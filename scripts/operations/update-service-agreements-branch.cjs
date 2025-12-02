#!/usr/bin/env node

/**
 * Update Service Agreements Branch ID
 * 
 * Updates existing service agreements to use the correct branchId
 * Usage: node scripts/operations/update-service-agreements-branch.cjs [--project PROJECT_ID] [--branch BRANCH_ID]
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let projectId = 'agritectum-platform';
let targetBranchId = null;

const projectIndex = args.indexOf('--project');
if (projectIndex !== -1 && args[projectIndex + 1]) {
  projectId = args[projectIndex + 1];
}

const branchIndex = args.indexOf('--branch');
if (branchIndex !== -1 && args[branchIndex + 1]) {
  targetBranchId = args[branchIndex + 1];
}

// Initialize Firebase Admin
async function initializeFirebase() {
  try {
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    const serviceAccountFile = files.find(f => 
      f.startsWith(`${projectId}-firebase-adminsdk-`) && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      console.error('❌ Service account key not found!');
      process.exit(1);
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    return admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

async function updateAgreementsBranch() {
  try {
    console.log(`\n🔧 Updating service agreements branch in project: ${projectId}\n`);
    
    const db = await initializeFirebase();
    
    // Find target branch
    let branchId = targetBranchId;
    
    if (!branchId) {
      // Try to find Stockholm branch
      try {
        const stockholmBranchSnapshot = await db.collection('branches')
          .where('name', '>=', 'Stockholm')
          .where('name', '<=', 'Stockholm\uf8ff')
          .limit(1)
          .get();
        
        if (!stockholmBranchSnapshot.empty) {
          branchId = stockholmBranchSnapshot.docs[0].id;
          console.log(`✅ Found Stockholm branch: ${branchId}`);
        } else {
          // Try to find user with sthlm email
          const usersSnapshot = await db.collection('users')
            .where('email', '>=', 'sthlm')
            .where('email', '<=', 'sthlm\uf8ff')
            .limit(1)
            .get();
          
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            branchId = userData.branchId;
            console.log(`✅ Found user branch: ${branchId}`);
          } else {
            // List all branches
            const allBranches = await db.collection('branches').get();
            console.log('\n📋 Available branches:');
            allBranches.docs.forEach(doc => {
              console.log(`   - ${doc.id}: ${doc.data().name || 'Unnamed'}`);
            });
            
            if (allBranches.empty) {
              console.log('   (No branches found)');
              branchId = 'main';
            } else {
              branchId = allBranches.docs[0].id;
              console.log(`\n⚠️  Using first branch: ${branchId}`);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️  Error finding branch:', error.message);
        branchId = 'main';
      }
    }
    
    console.log(`📌 Updating agreements to branch: ${branchId}\n`);
    
    // Get all service agreements
    const agreementsSnapshot = await db.collection('serviceAgreements').get();
    
    if (agreementsSnapshot.empty) {
      console.log('⚠️  No service agreements found');
      return;
    }
    
    console.log(`Found ${agreementsSnapshot.size} service agreements\n`);
    
    let updated = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    agreementsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.branchId !== branchId) {
        batch.update(doc.ref, { branchId: branchId });
        console.log(`   Updating: ${data.title} (${doc.id})`);
        console.log(`     Old branchId: ${data.branchId} → New branchId: ${branchId}`);
        updated++;
        batchCount++;
        
        // Firestore batches are limited to 500 operations
        if (batchCount >= 500) {
          console.log('   Committing batch...');
          batch.commit();
          batchCount = 0;
        }
      }
    });
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`\n✅ Updated ${updated} service agreements to branch: ${branchId}\n`);
    
  } catch (error) {
    console.error('\n❌ Error updating service agreements:', error);
    process.exit(1);
  }
}

updateAgreementsBranch()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


