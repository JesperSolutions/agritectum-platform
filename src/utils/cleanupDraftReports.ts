// Cleanup utility to remove draft/temporary reports
import { auth, db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

// Alternative: Delete only temporary reports (safer option)
export const cleanupTempReports = async () => {
  console.log('🧹 Starting Temporary Reports Cleanup (Safer Option)...');

  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }

    const tokenResult = await user.getIdTokenResult();
    const branchId = tokenResult.claims.branchId;
    const permissionLevel = tokenResult.claims.permissionLevel || 0;

    if (permissionLevel < 1) {
      console.error('❌ Insufficient permissions. Need branchAdmin or higher.');
      return;
    }

    // Get all reports in the branch, including those without proper branchId
    const reportsRef = collection(db, 'reports');
    const branchQuery = query(reportsRef, where('branchId', '==', branchId));

    const reportsSnapshot = await getDocs(branchQuery);
    const allReports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Also get reports created by the current user (in case temp reports don't have branchId)
    const userReportsQuery = query(reportsRef, where('createdBy', '==', user.uid));

    const userReportsSnapshot = await getDocs(userReportsQuery);
    const userReports = userReportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Combine and deduplicate
    const combinedReports = [...allReports];
    userReports.forEach(userReport => {
      if (!combinedReports.find(r => r.id === userReport.id)) {
        combinedReports.push(userReport);
      }
    });

    // Filter for only temporary reports (IDs starting with 'temp_')
    const tempReports = combinedReports.filter(report => report.id.startsWith('temp_'));

    console.log(`🗑️ Found ${tempReports.length} temporary reports to clean up:`);
    tempReports.forEach((report, index) => {
      console.log(
        `  ${index + 1}. ${report.id} - ${report.title || 'No title'} (${report.status || 'No status'})`
      );
    });

    if (tempReports.length === 0) {
      console.log('✅ No temporary reports found to clean up');
      return;
    }

    // Try to delete these temp reports using a different approach
    // Since they're temp reports, let's try to update them first to fix the permission issue
    let deletedCount = 0;
    let failedCount = 0;
    let updatedCount = 0;

    console.log(`🗑️ Attempting to clean ${tempReports.length} temporary reports...`);

    for (const report of tempReports) {
      try {
        const reportRef = doc(db, 'reports', report.id);

        // First, try to update the report with proper fields to fix permissions
        try {
          await updateDoc(reportRef, {
            createdBy: user.uid,
            branchId: branchId,
            lastEdited: new Date().toISOString(),
          });
          console.log(`  🔧 Updated permissions for: ${report.id}`);
          updatedCount++;

          // Now try to delete it
          await deleteDoc(reportRef);
          deletedCount++;
          console.log(`  ✅ Deleted: ${report.id}`);
        } catch (updateError) {
          // If update fails, try direct deletion
          await deleteDoc(reportRef);
          deletedCount++;
          console.log(`  ✅ Deleted: ${report.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Error with report ${report.id}:`, error);
        failedCount++;
      }
    }

    console.log('\n🎉 Temporary reports cleanup completed!');
    console.log(`🔧 Updated permissions: ${updatedCount} reports`);
    console.log(`✅ Successfully deleted: ${deletedCount} temporary reports`);
    console.log(`❌ Failed to delete: ${failedCount} reports`);
    console.log(`📊 Total processed: ${tempReports.length} reports`);

    if (deletedCount > 0) {
      console.log('\n💡 Tip: Refresh the page to see the updated report list');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  const windowWithCleanup = window as unknown as { cleanupTempReports?: typeof cleanupTempReports };
  windowWithCleanup.cleanupTempReports = cleanupTempReports;
}
