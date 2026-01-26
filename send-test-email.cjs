// Test email sender
const admin = require('firebase-admin');
const serviceAccount = require('./agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function sendTestEmail() {
  try {
    console.log('Sending test email to jespertinusaggerholm@gmail.com...');
    
    const mailRef = await db.collection('mail').add({
      to: 'jespertinusaggerholm@gmail.com',
      template: {
        name: 'offer-sent',
        data: {
          customerName: 'Jesper Tinusager Holm',
          offerTitle: 'Test Offer - Roof Repair Quote',
          offerDescription: 'This is a test email from the Agritectum Platform to verify the email sending functionality is working correctly. This test includes all the offer details that would normally be sent to customers.',
          totalAmount: '12500',
          currency: 'DKK',
          validUntil: '2026-02-26',
          publicLink: 'https://agritectum-platform.web.app/offer/public/test-123',
          branchName: 'Agritectum Danmark',
          branchPhone: '+45 12 34 56 78',
          branchEmail: 'support@agritectum.dk',
          branchAddress: 'Copenhagen, Denmark'
        }
      },
      metadata: {
        test: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: 'test-script'
      }
    });

    console.log('✅ Test email document created with ID:', mailRef.id);
    console.log('📧 Email will be processed by Trigger Email extension');
    console.log('📬 Check jespertinusaggerholm@gmail.com inbox in a few moments');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

sendTestEmail();
