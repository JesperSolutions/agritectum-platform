/**
 * Browser-based Firebase seeding utility
 * Add this to window for easy access in browser console
 */

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { logger } from './logger';
import {
  testUserDK,
  testCustomerDK,
  testBuildingDK1,
  testBuildingDK2,
  testReportDK1,
  testReportDK2,
} from '../data/testSeedData';

export async function seedTestDataBrowser() {
  try {
    logger.log('🌱 Starting Firebase seeding in browser...\n');

    const auth = getAuth();
    const db = getFirestore();

    // Create test user
    logger.log('👤 Creating test user account...');
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        testUserDK.email,
        testUserDK.password
      );
      logger.log('✅ User created:', testUserDK.email);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        logger.log('⚠️  User already exists:', testUserDK.email);
        logger.log('   Proceeding to update data...\n');
        // Try to get the user ID from the test data
        userCredential = { user: { uid: testUserDK.uid } };
      } else {
        throw error;
      }
    }

    const userId = userCredential.user.uid;
    const batch = writeBatch(db);

    // Store user profile
    logger.log('📝 Storing user profile...');
    batch.set(doc(db, 'users', userId), {
      ...testUserDK,
      uid: userId,
      createdAt: new Date(testUserDK.createdAt),
    });

    // Store customer
    logger.log('🏢 Creating test customer...');
    batch.set(doc(db, 'customers', testCustomerDK.id), {
      ...testCustomerDK,
      createdAt: new Date(testCustomerDK.createdAt),
    });

    // Store buildings
    logger.log('🏭 Creating test buildings...');
    batch.set(doc(db, 'buildings', testBuildingDK1.id), {
      ...testBuildingDK1,
      createdAt: testBuildingDK1.createdAt,
    });

    batch.set(doc(db, 'buildings', testBuildingDK2.id), {
      ...testBuildingDK2,
      createdAt: testBuildingDK2.createdAt,
    });

    // Store reports
    logger.log('📊 Creating test reports...');
    batch.set(doc(db, 'reports', testReportDK1.id), {
      ...testReportDK1,
      inspectionDate: testReportDK1.inspectionDate,
      createdAt: testReportDK1.createdAt,
      lastEdited: testReportDK1.lastEdited,
      offerValidUntil: testReportDK1.offerValidUntil,
    });

    batch.set(doc(db, 'reports', testReportDK2.id), {
      ...testReportDK2,
      inspectionDate: testReportDK2.inspectionDate,
      createdAt: testReportDK2.createdAt,
      lastEdited: testReportDK2.lastEdited,
      offerValidUntil: testReportDK2.offerValidUntil,
    });

    // Commit batch
    logger.log('💾 Committing to Firebase...');
    await batch.commit();

    logger.log('\n✅ Seeding completed successfully!\n');
    logger.log('📋 Test Account Details:');
    logger.log('   Email: test@agritectum.dk');
    logger.log('   Password: TestUser123!');
    logger.log('   Branch: Agritectum Danmark');
    logger.log('   Role: Inspector\n');
    logger.log('📚 Data created:');
    logger.log('   ✓ 1 User account');
    logger.log('   ✓ 1 Customer (Test Kunde A/S)');
    logger.log('   ✓ 2 Buildings (Kontorhotel + Lager)');
    logger.log('   ✓ 2 Reports (with findings & recommendations)\n');

    return true;
  } catch (error) {
    logger.error('❌ Error seeding data:', error);
    return false;
  }
}

// NOTE: seedTestData() is intentionally NOT exposed to window in production
// This prevents users from creating unauthorized test accounts
// For development seeding, use Firebase Admin SDK or the QA Testing Page

