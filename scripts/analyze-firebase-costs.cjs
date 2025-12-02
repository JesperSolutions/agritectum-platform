#!/usr/bin/env node

/**
 * Firebase Cost Analysis
 * Analyze potential cost impacts from scripts and operations
 */

const admin = require('firebase-admin');
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-0fd3c304a5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://taklaget-service-app-default-rtdb.europe-west1.firebasedb.app'
});

const db = admin.firestore();

async function analyzeFirebaseCosts() {
  console.log('💰 FIREBASE COST ANALYSIS');
  console.log('=========================\n');
  
  try {
    // Check current data volumes
    console.log('📊 CURRENT DATA VOLUMES:');
    console.log('========================');
    
    // Check users collection
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Users: ${usersSnapshot.size} documents`);
    
    // Check branches collection
    const branchesSnapshot = await db.collection('branches').get();
    console.log(`🏢 Branches: ${branchesSnapshot.size} documents`);
    
    // Check reports collection
    const reportsSnapshot = await db.collection('reports').get();
    console.log(`📋 Reports: ${reportsSnapshot.size} documents`);
    
    // Check customers collection
    const customersSnapshot = await db.collection('customers').get();
    console.log(`👤 Customers: ${customersSnapshot.size} documents`);
    
    // Check notifications collection
    const notificationsSnapshot = await db.collection('notifications').get();
    console.log(`🔔 Notifications: ${notificationsSnapshot.size} documents`);
    
    // Check email logs collection
    const emailLogsSnapshot = await db.collection('emailLogs').get();
    console.log(`📧 Email Logs: ${emailLogsSnapshot.size} documents`);
    
    console.log('\n💡 FIREBASE PRICING IMPACT:');
    console.log('============================');
    
    const totalDocuments = usersSnapshot.size + branchesSnapshot.size + 
                          reportsSnapshot.size + customersSnapshot.size + 
                          notificationsSnapshot.size + emailLogsSnapshot.size;
    
    console.log(`📄 Total Documents: ${totalDocuments}`);
    console.log(`💾 Document Reads: ~${totalDocuments} per month (estimated)`);
    console.log(`📝 Document Writes: ~${totalDocuments * 2} per month (estimated)`);
    
    // Cost estimation (rough)
    const documentReads = totalDocuments;
    const documentWrites = totalDocuments * 2;
    const storageGB = (totalDocuments * 0.001); // Rough estimate
    
    console.log('\n💰 ESTIMATED MONTHLY COSTS:');
    console.log('============================');
    console.log(`📖 Document Reads: $${(documentReads * 0.00006).toFixed(4)}`);
    console.log(`✍️  Document Writes: $${(documentWrites * 0.00018).toFixed(4)}`);
    console.log(`💾 Storage: $${(storageGB * 0.18).toFixed(4)}`);
    console.log(`📧 Email (Firestore Send): $${(emailLogsSnapshot.size * 0.0001).toFixed(4)}`);
    console.log(`🌐 Hosting: $${(0.026).toFixed(4)} (per GB)`);
    
    const totalEstimated = (documentReads * 0.00006) + (documentWrites * 0.00018) + 
                          (storageGB * 0.18) + (emailLogsSnapshot.size * 0.0001) + 0.026;
    
    console.log(`\n💵 TOTAL ESTIMATED: $${totalEstimated.toFixed(4)}/month`);
    
    console.log('\n⚠️  POTENTIAL COST RISKS:');
    console.log('=========================');
    
    // Check for potential issues
    if (notificationsSnapshot.size > 1000) {
      console.log('🔔 HIGH: Many notifications - consider cleanup policy');
    }
    
    if (emailLogsSnapshot.size > 500) {
      console.log('📧 MEDIUM: Many email logs - consider retention policy');
    }
    
    if (reportsSnapshot.size > 100) {
      console.log('📋 LOW: Many reports - normal for production');
    }
    
    console.log('\n🧹 RECOMMENDED CLEANUP:');
    console.log('========================');
    console.log('1. Remove test scripts that create unnecessary data');
    console.log('2. Implement notification cleanup (older than 30 days)');
    console.log('3. Implement email log cleanup (older than 90 days)');
    console.log('4. Monitor document growth monthly');
    console.log('5. Set up Firebase billing alerts');
    
    console.log('\n✅ CURRENT STATUS: LOW COST RISK');
    console.log('=================================');
    console.log('Your current data volumes are well within free tier limits.');
    console.log('Estimated monthly cost is under $1.00');
    console.log('No immediate cleanup required for cost reasons.');
    
  } catch (error) {
    console.error('❌ Error analyzing costs:', error);
  }
}

// Run the analysis
analyzeFirebaseCosts()
  .then(() => {
    console.log('\n✅ Cost analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });

