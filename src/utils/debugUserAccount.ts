// Debug utility to investigate user accounts and their associated reports
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export const debugUserAccount = async (userEmail?: string) => {
  console.log('🔍 Starting User Account Investigation...');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }

    console.log('👤 Current authenticated user:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });

    // Get user token claims
    const tokenResult = await user.getIdTokenResult();
    console.log('🔑 Token claims:', {
      name: tokenResult.claims.name,
      role: tokenResult.claims.role,
      permissionLevel: tokenResult.claims.permissionLevel,
      branchId: tokenResult.claims.branchId,
      email: tokenResult.claims.email
    });

    // Search for Linus Hollberg specifically if requested
    if (userEmail) {
      console.log(`\n🔍 Searching for user with email: ${userEmail}`);
      
      // Search in users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', userEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        console.log('❌ User not found in users collection');
      } else {
        console.log('✅ Found user in users collection:');
        userSnapshot.forEach(doc => {
          console.log('  📄 User document:', {
            id: doc.id,
            ...doc.data()
          });
        });
      }

      // Also search by display name
      const nameQuery = query(usersRef, where('displayName', '==', 'Linus Hollberg'));
      const nameSnapshot = await getDocs(nameQuery);
      
      if (!nameSnapshot.empty) {
        console.log('✅ Found user by display name:');
        nameSnapshot.forEach(doc => {
          console.log('  📄 User document:', {
            id: doc.id,
            ...doc.data()
          });
        });
      }
    }

    // Get all reports for current user
    console.log('\n📊 Investigating reports for current user...');
    
    // Get reports created by current user
    const reportsRef = collection(db, 'reports');
    const userReportsQuery = query(reportsRef, where('createdBy', '==', user.uid));
    const userReportsSnapshot = await getDocs(userReportsQuery);
    
    console.log(`📋 Found ${userReportsSnapshot.size} reports created by current user:`);
    userReportsSnapshot.forEach(doc => {
      const reportData = doc.data();
      console.log(`  📄 Report: ${doc.id}`, {
        title: reportData.title || 'No title',
        customerName: reportData.customerName || 'No customer',
        status: reportData.status || 'No status',
        createdAt: reportData.createdAt,
        branchId: reportData.branchId || 'No branch',
        isTemp: doc.id.startsWith('temp_')
      });
    });

    // Get reports in user's branch
    if (tokenResult.claims.branchId) {
      console.log(`\n🏢 Investigating reports in branch: ${tokenResult.claims.branchId}`);
      
      const branchReportsQuery = query(reportsRef, where('branchId', '==', tokenResult.claims.branchId));
      const branchReportsSnapshot = await getDocs(branchReportsQuery);
      
      console.log(`📋 Found ${branchReportsSnapshot.size} reports in branch:`);
      
      // Group by creator
      const reportsByCreator = new Map();
      branchReportsSnapshot.forEach(doc => {
        const reportData = doc.data();
        const creator = reportData.createdBy || 'unknown';
        if (!reportsByCreator.has(creator)) {
          reportsByCreator.set(creator, []);
        }
        reportsByCreator.get(creator).push({
          id: doc.id,
          title: reportData.title || 'No title',
          customerName: reportData.customerName || 'No customer',
          status: reportData.status || 'No status',
          createdAt: reportData.createdAt,
          isTemp: doc.id.startsWith('temp_')
        });
      });

      // Display reports grouped by creator
      for (const [creatorId, reports] of reportsByCreator) {
        console.log(`\n  👤 Reports by creator ${creatorId}:`);
        reports.forEach((report: any, index: number) => {
          console.log(`    ${index + 1}. ${report.id} - ${report.title} (${report.status}) ${report.isTemp ? '🚨TEMP' : ''}`);
        });
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  👤 Current user: ${user.displayName || user.email}`);
    console.log(`  🔑 Role: ${tokenResult.claims.role} (Level: ${tokenResult.claims.permissionLevel})`);
    console.log(`  🏢 Branch: ${tokenResult.claims.branchId}`);
    console.log(`  📄 Reports created: ${userReportsSnapshot.size}`);
    console.log(`  📄 Reports in branch: ${tokenResult.claims.branchId ? branchReportsSnapshot.size : 'N/A'}`);
    
    const tempReports = userReportsSnapshot.docs.filter(doc => doc.id.startsWith('temp_'));
    if (tempReports.length > 0) {
      console.log(`  🚨 Temporary reports: ${tempReports.length}`);
    }

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
};

// Search specifically for Linus Hollberg
export const findLinusHollberg = async () => {
  console.log('🔍 Searching specifically for Linus Hollberg...');
  await debugUserAccount('linus.hollberg@taklagetentreprenad.se');
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).debugUserAccount = debugUserAccount;
  (window as any).findLinusHollberg = findLinusHollberg;
}
