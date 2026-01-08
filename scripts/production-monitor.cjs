#!/usr/bin/env node

/**
 * Production Monitoring Script
 * Monitor Firebase usage and costs for production environment
 */

const admin = require('firebase-admin');
const serviceAccount = require('../taklaget-service-app-firebase-adminsdk-fbsvc-0fd3c304a5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://taklaget-service-app-default-rtdb.europe-west1.firebasedb.app'
});

const db = admin.firestore();

async function productionMonitor() {
  console.log('📊 PRODUCTION MONITORING');
  console.log('========================\n');
  
  try {
    // Check data volumes
    console.log('📈 DATA VOLUMES:');
    console.log('================');
    
    const collections = ['users', 'branches', 'reports', 'customers', 'notifications', 'emailLogs'];
    const stats = {};
    
    for (const collection of collections) {
      const snapshot = await db.collection(collection).get();
      stats[collection] = snapshot.size;
      console.log(`${collection}: ${snapshot.size} documents`);
    }
    
    const totalDocs = Object.values(stats).reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal Documents: ${totalDocs}`);
    
    // Cost estimation
    console.log('\n💰 COST ESTIMATION:');
    console.log('===================');
    const estimatedMonthlyCost = (totalDocs * 0.00006) + (totalDocs * 2 * 0.00018) + 0.026;
    console.log(`Estimated Monthly Cost: $${estimatedMonthlyCost.toFixed(4)}`);
    
    // Cleanup old notifications (older than 30 days)
    console.log('\n🧹 CLEANUP OLD NOTIFICATIONS:');
    console.log('==============================');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldNotifications = await db.collection('notifications')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();
    
    if (oldNotifications.size > 0) {
      console.log(`Found ${oldNotifications.size} old notifications to clean up`);
      
      const batch = db.batch();
      oldNotifications.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleaned up ${oldNotifications.size} old notifications`);
    } else {
      console.log('✅ No old notifications to clean up');
    }
    
    // Cleanup old email logs (older than 90 days)
    console.log('\n🧹 CLEANUP OLD EMAIL LOGS:');
    console.log('===========================');
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const oldEmailLogs = await db.collection('emailLogs')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
      .get();
    
    if (oldEmailLogs.size > 0) {
      console.log(`Found ${oldEmailLogs.size} old email logs to clean up`);
      
      const batch = db.batch();
      oldEmailLogs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleaned up ${oldEmailLogs.size} old email logs`);
    } else {
      console.log('✅ No old email logs to clean up');
    }
    
    // Final stats
    console.log('\n📊 FINAL STATS:');
    console.log('================');
    
    const finalStats = {};
    for (const collection of collections) {
      const snapshot = await db.collection(collection).get();
      finalStats[collection] = snapshot.size;
    }
    
    const finalTotalDocs = Object.values(finalStats).reduce((sum, count) => sum + count, 0);
    console.log(`Total Documents: ${finalTotalDocs}`);
    
    const finalEstimatedCost = (finalTotalDocs * 0.00006) + (finalTotalDocs * 2 * 0.00018) + 0.026;
    console.log(`Estimated Monthly Cost: $${finalEstimatedCost.toFixed(4)}`);
    
    console.log('\n✅ PRODUCTION MONITORING COMPLETE');
    console.log('==================================');
    console.log('✅ Data volumes monitored');
    console.log('✅ Old data cleaned up');
    console.log('✅ Costs estimated');
    console.log('✅ System optimized');
    
  } catch (error) {
    console.error('❌ Error in production monitoring:', error);
  }
}

// Run the monitoring
productionMonitor()
  .then(() => {
    console.log('\n✅ Production monitoring completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });

