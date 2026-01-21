// Debug utility to check user authentication and permissions
import { auth } from '../config/firebase';

export const debugUserAuth = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ No authenticated user');
    return;
  }

  try {
    const tokenResult = await user.getIdTokenResult();
    console.log('🔍 User Authentication Debug:');
    console.log('  - UID:', user.uid);
    console.log('  - Email:', user.email);
    console.log('  - Claims:', tokenResult.claims);
    console.log('  - Permission Level:', tokenResult.claims.permissionLevel);
    console.log('  - Role:', tokenResult.claims.role);
    console.log('  - Branch ID:', tokenResult.claims.branchId);

    const permissionLevel = tokenResult.claims.permissionLevel || 0;
    const role = tokenResult.claims.role || 'inspector';

    console.log('\n📋 Permission Analysis:');
    console.log('  - Can delete reports:', permissionLevel >= 1 ? '✅ Yes' : '❌ No');
    console.log('  - Permission level needed: >= 1 (branchAdmin)');
    console.log('  - Current level:', permissionLevel);
    console.log('  - Role:', role);

    if (permissionLevel < 1) {
      console.log('\n⚠️ ISSUE FOUND: User permission level too low for deletion');
      console.log('  - Need to update user permissions in Firebase Auth');
      console.log('  - Or assign proper custom claims');
    }
  } catch (error) {
    console.error('❌ Error checking auth:', error);
  }
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugUserAuth;
}
