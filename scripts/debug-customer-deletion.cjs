#!/usr/bin/env node

/**
 * Debug Customer Deletion - Check why deletion is failing
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin from functions/node_modules first
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    process.exit(1);
  }
}

// Initialize Firebase Admin
try {
  const projectRoot = path.join(__dirname, '..');
  const files = fs.readdirSync(projectRoot);
  const serviceAccountFile = files.find(f => 
    (f.startsWith('taklaget-service-app-firebase-adminsdk-') || f.startsWith('taklaget-service-app-firebase-adminsdk-fbsvc-')) && 
    f.endsWith('.json')
  );
  
  if (!serviceAccountFile) {
    throw new Error('Service account key file not found.');
  }
  
  const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

const CUSTOMER_ID = 'RSivk7YwRyFdMWIjA8nG'; // Allan from the logs
const USER_UID = 'aviU8by12zP9JJrKpZTIL5Jsvi62'; // Linus

async function debugCustomerDeletion() {
  console.log('🔍 Debugging Customer Deletion...\n');
  
  try {
    // 1. Get customer
    const customerRef = admin.firestore().collection('customers').doc(CUSTOMER_ID);
    const customerDoc = await customerRef.get();
    
    if (!customerDoc.exists) {
      console.log('❌ Customer not found');
      return;
    }
    
    const customer = customerDoc.data();
    console.log('📄 Customer Data:');
    console.log('   ID:', CUSTOMER_ID);
    console.log('   Name:', customer.name);
    console.log('   BranchId:', customer.branchId);
    console.log('   BranchId Type:', typeof customer.branchId);
    console.log('   Has branchId field:', 'branchId' in customer);
    console.log('   All fields:', Object.keys(customer).join(', '));
    
    // 2. Get user
    const userRecord = await admin.auth().getUser(USER_UID);
    console.log('\n👤 User Data:');
    console.log('   UID:', USER_UID);
    console.log('   Email:', userRecord.email);
    console.log('   Claims:', JSON.stringify(userRecord.customClaims || {}, null, 2));
    
    // 3. Simulate rule evaluation
    console.log('\n🔍 Rule Evaluation Simulation:');
    const userBranchId = userRecord.customClaims?.branchId || "";
    const customerBranchId = customer.branchId;
    
    console.log('   getUserBranchId() would return:', userBranchId);
    console.log('   resource.data.branchId:', customerBranchId);
    console.log('   resource.data.branchId == getUserBranchId():', customerBranchId == userBranchId);
    console.log('   resource.data.branchId === getUserBranchId():', customerBranchId === userBranchId);
    console.log('   getUserBranchId() == "main":', userBranchId == "main");
    console.log('   !(\'branchId\' in resource.data):', !('branchId' in customer));
    console.log('   getUserBranchId() == "":', userBranchId == "");
    
    // 4. Check if customer has any reports
    const reportsSnapshot = await admin.firestore()
      .collection('reports')
      .where('customerName', '==', customer.name)
      .get();
    
    console.log('\n📊 Reports Check:');
    console.log('   Reports found:', reportsSnapshot.size);
    if (reportsSnapshot.size > 0) {
      reportsSnapshot.docs.forEach((doc, idx) => {
        const report = doc.data();
        console.log(`   Report ${idx + 1}:`, {
          id: doc.id,
          customerName: report.customerName,
          customerEmail: report.customerEmail,
          status: report.status,
        });
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

debugCustomerDeletion();

