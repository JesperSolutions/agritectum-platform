import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function generatePasswordForMarcus() {
  try {
    const uid = 'AQfaZgI4Dsh4xqtJacQzCxrWsXw1';
    
    // Generate a secure random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.log('🔐 Generating new password for Marcus...\n');
    
    // Update Firebase Auth password
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });
    
    // Store in Firestore
    await db.collection('users').doc(uid).update({
      temporaryPassword: newPassword,
      passwordLastReset: admin.firestore.FieldValue.serverTimestamp(),
      passwordResetBy: 'admin',
      passwordResetByName: 'System Admin',
    });
    
    console.log('✅ Password generated and set!\n');
    console.log('='.repeat(60));
    console.log('👤 USER: Marcus (Branch Admin)');
    console.log('📧 EMAIL: marcusleitz@me.com');
    console.log('🔑 PASSWORD:', newPassword);
    console.log('🔗 LOGIN: https://agritectum-platform.web.app/login');
    console.log('='.repeat(60));
    console.log('\n📋 Copy this complete package to send to Marcus!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generatePasswordForMarcus();
