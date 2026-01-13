/**
 * Browser-based Firebase seeding utility
 * Add this to window for easy access in browser console
 */

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, writeBatch } from 'firebase/firestore';
import { 
  testUserDK, 
  testCustomerDK, 
  testBuildingDK1, 
  testBuildingDK2, 
  testReportDK1, 
  testReportDK2 
} from '../data/testSeedData';

export async function seedTestDataBrowser() {
  try {
    console.log('🌱 Starting Firebase seeding in browser...\n');

    const auth = getAuth();
    const db = getFirestore();

    // Create test user
    console.log('👤 Creating test user account...');
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        testUserDK.email,
        testUserDK.password
      );
      console.log('✅ User created:', testUserDK.email);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  User already exists:', testUserDK.email);
        console.log('   Proceeding to update data...\n');
        // Try to get the user ID from the test data
        userCredential = { user: { uid: testUserDK.uid } };
      } else {
        throw error;
      }
    }

    const userId = userCredential.user.uid;
    const batch = writeBatch(db);

    // Store user profile
    console.log('📝 Storing user profile...');
    batch.set(doc(db, 'users', userId), {
      ...testUserDK,
      uid: userId,
      createdAt: new Date(testUserDK.createdAt),
    });

    // Store customer
    console.log('🏢 Creating test customer...');
    batch.set(doc(db, 'customers', testCustomerDK.id), {
      ...testCustomerDK,
      createdAt: new Date(testCustomerDK.createdAt),
    });

    // Store buildings
    console.log('🏭 Creating test buildings...');
    batch.set(doc(db, 'buildings', testBuildingDK1.id), {
      ...testBuildingDK1,
      createdAt: new Date(testBuildingDK1.createdAt),
      lastInspection: new Date(testBuildingDK1.lastInspection),
    });

    batch.set(doc(db, 'buildings', testBuildingDK2.id), {
      ...testBuildingDK2,
      createdAt: new Date(testBuildingDK2.createdAt),
      lastInspection: new Date(testBuildingDK2.lastInspection),
    });

    // Store reports
    console.log('📊 Creating test reports...');
    batch.set(doc(db, 'reports', testReportDK1.id), {
      ...testReportDK1,
      inspectionDate: new Date(testReportDK1.inspectionDate),
      createdAt: new Date(testReportDK1.createdAt),
      updatedAt: new Date(testReportDK1.updatedAt),
      offerValidUntil: new Date(testReportDK1.offerValidUntil),
    });

    batch.set(doc(db, 'reports', testReportDK2.id), {
      ...testReportDK2,
      inspectionDate: new Date(testReportDK2.inspectionDate),
      createdAt: new Date(testReportDK2.createdAt),
      updatedAt: new Date(testReportDK2.updatedAt),
      offerValidUntil: new Date(testReportDK2.offerValidUntil),
    });

    // Commit batch
    console.log('💾 Committing to Firebase...');
    await batch.commit();

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📋 Test Account Details:');
    console.log('   Email: test@agritectum.dk');
    console.log('   Password: TestUser123!');
    console.log('   Branch: Agritectum Danmark');
    console.log('   Role: Inspector\n');
    console.log('📚 Data created:');
    console.log('   ✓ 1 User account');
    console.log('   ✓ 1 Customer (Test Kunde A/S)');
    console.log('   ✓ 2 Buildings (Kontorhotel + Lager)');
    console.log('   ✓ 2 Reports (with findings & recommendations)\n');

    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).seedTestData = seedTestDataBrowser;
  console.log('💡 Tip: Type seedTestData() in console to create test user');
}
