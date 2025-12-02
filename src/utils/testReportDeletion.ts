// Test script for report deletion flow
import { auth, db } from '../config/firebase';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';

export const testReportDeletion = async () => {
  console.log('🧪 Starting Report Deletion Test...');
  
  try {
    // Step 1: Check authentication
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Step 2: Get user token and claims
    const tokenResult = await user.getIdTokenResult();
    console.log('🔑 Token claims:', tokenResult.claims);
    
    const permissionLevel = tokenResult.claims.permissionLevel || 0;
    const branchId = tokenResult.claims.branchId;
    
    console.log('📊 Permission Analysis:');
    console.log('  - Permission Level:', permissionLevel);
    console.log('  - Branch ID:', branchId);
    console.log('  - Can delete reports:', permissionLevel >= 1 ? '✅ Yes' : '❌ No');
    
    // Step 3: Find a test report
    console.log('\n🔍 Looking for test reports...');
    
    // Get reports from user's branch
    const reportsRef = collection(db, 'reports');
    const branchQuery = query(
      reportsRef, 
      where('branchId', '==', branchId),
      limit(5)
    );
    
    const reportsSnapshot = await getDocs(branchQuery);
    const reports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 Found ${reports.length} reports in branch ${branchId}:`);
    reports.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.id} - ${report.title || 'No title'} (${report.status || 'No status'})`);
    });
    
    if (reports.length === 0) {
      console.log('❌ No reports found to test deletion');
      return;
    }
    
    // Step 4: Test deletion on first report (skip temp reports)
    const testReport = reports.find(r => !r.id.startsWith('temp_'));
    
    if (!testReport) {
      console.log('⚠️ All reports are temporary reports that don\'t exist in Firestore');
      console.log('🧪 Creating a test report to verify deletion works...');
      
      // Create a test report
      const testReportData = {
        title: 'Test Report for Deletion',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '123456789',
        customerAddress: 'Test Address 123',
        branchId: branchId,
        createdBy: user.uid,
        createdByName: user.displayName || 'Test User',
        status: 'draft',
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        inspectionDate: new Date().toISOString(),
        roofType: 'tile',
        roofAge: 10,
        estimatedCost: 1000,
        issues: [],
        images: [],
        isPublic: false
      };
      
      const testReportRef = await addDoc(collection(db, 'reports'), testReportData);
      console.log('✅ Test report created:', testReportRef.id);
      
      // Now test deletion on this real report
      const reportRef = doc(db, 'reports', testReportRef.id);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        console.error('❌ Test report not found after creation');
        return;
      }
      
      console.log('✅ Test report exists and can be read');
      console.log('📄 Test report data:', {
        id: testReportRef.id,
        branchId: testReportData.branchId,
        createdBy: testReportData.createdBy,
        title: testReportData.title
      });
      
      // Attempt deletion
      console.log('\n🗑️ Attempting to delete test report...');
      try {
        await deleteDoc(reportRef);
        console.log('✅ Test report deleted successfully!');
        
        // Verify deletion
        const verifyDoc = await getDoc(reportRef);
        if (!verifyDoc.exists()) {
          console.log('✅ Deletion verified - test report no longer exists');
          console.log('🎉 REPORT DELETION IS WORKING CORRECTLY!');
          console.log('💡 The issue was that you were trying to delete temporary reports that don\'t exist in Firestore');
        } else {
          console.log('⚠️ Warning: Test report still exists after deletion');
        }
        
      } catch (deleteError) {
        console.error('❌ Test report deletion failed:', deleteError);
        
        // Analyze the error
        if (deleteError instanceof Error) {
          console.log('🔍 Error details:');
          console.log('  - Message:', deleteError.message);
          console.log('  - Code:', (deleteError as any).code);
          console.log('  - Details:', (deleteError as any).details);
        }
      }
      
      return;
    }
    
    console.log(`\n🗑️ Testing deletion of report: ${testReport.id}`);
    
    // First, verify we can read the report
    const reportRef = doc(db, 'reports', testReport.id);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      console.error('❌ Report not found in Firestore');
      console.log('🔍 This suggests the report ID exists in the query but not in the actual document');
      console.log('🔍 Report ID:', testReport.id);
      console.log('🔍 Report data from query:', testReport);
      return;
    }
    
    console.log('✅ Report exists and can be read');
    console.log('📄 Report data:', {
      id: testReport.id,
      branchId: testReport.branchId,
      createdBy: testReport.createdBy,
      title: testReport.title,
      status: testReport.status
    });
    
    // Step 5: Attempt deletion
    console.log('\n🗑️ Attempting to delete report...');
    
    try {
      await deleteDoc(reportRef);
      console.log('✅ Report deleted successfully!');
      
      // Verify deletion
      const verifyDoc = await getDoc(reportRef);
      if (!verifyDoc.exists()) {
        console.log('✅ Deletion verified - report no longer exists');
      } else {
        console.log('⚠️ Warning: Report still exists after deletion');
      }
      
    } catch (deleteError) {
      console.error('❌ Deletion failed:', deleteError);
      
      // Analyze the error
      if (deleteError instanceof Error) {
        console.log('🔍 Error details:');
        console.log('  - Message:', deleteError.message);
        console.log('  - Code:', (deleteError as any).code);
        console.log('  - Details:', (deleteError as any).details);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Test with specific report ID
export const testSpecificReportDeletion = async (reportId: string) => {
  console.log(`🧪 Testing deletion of specific report: ${reportId}`);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }
    
    // Get user info
    const tokenResult = await user.getIdTokenResult();
    const permissionLevel = tokenResult.claims.permissionLevel || 0;
    const branchId = tokenResult.claims.branchId;
    
    console.log('👤 User:', user.email);
    console.log('🔑 Permission Level:', permissionLevel);
    console.log('🏢 Branch ID:', branchId);
    
    // Get the specific report
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      console.error('❌ Report not found');
      return;
    }
    
    const reportData = reportDoc.data();
    console.log('📄 Report data:', {
      id: reportId,
      branchId: reportData.branchId,
      createdBy: reportData.createdBy,
      title: reportData.title,
      status: reportData.status
    });
    
    // Check if user has permission to delete this report
    const canDelete = permissionLevel >= 1 && (
      permissionLevel >= 2 || // Superadmin
      (reportData.branchId === branchId || branchId === 'main') // Branch admin in same branch
    );
    
    console.log('🔐 Permission check:');
    console.log('  - User permission level:', permissionLevel);
    console.log('  - Report branch ID:', reportData.branchId);
    console.log('  - User branch ID:', branchId);
    console.log('  - Can delete:', canDelete ? '✅ Yes' : '❌ No');
    
    if (!canDelete) {
      console.log('❌ User does not have permission to delete this report');
      return;
    }
    
    // Attempt deletion
    console.log('\n🗑️ Attempting deletion...');
    await deleteDoc(reportRef);
    console.log('✅ Report deleted successfully!');
    
  } catch (error) {
    console.error('❌ Deletion failed:', error);
    console.log('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      details: (error as any).details
    });
  }
};

// Add to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testReportDeletion = testReportDeletion;
  (window as any).testSpecificReportDeletion = testSpecificReportDeletion;
}
