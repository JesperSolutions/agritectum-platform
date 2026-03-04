import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email via MailerSend...\n');

    const emailDoc = await db.collection('mail').add({
      to: ['fake-customer-2025@mailinator.com'], // Fake customer email
      subject: 'Your Report is Ready - Agritectum',
      text: 'Your inspection report is ready for download.',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Hello,</h2>
            <p>Your building inspection report is now ready for review.</p>
            <p><strong>From:</strong> Flemming Adolfsen (Branch Admin)</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>Please log in to your account to view the complete report.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              This is an automated message from Agritectum ApS.<br>
              Do not reply to this email.
            </p>
          </body>
        </html>
      `,
      deliveryAttempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Test email enqueued!');
    console.log(`📄 Document ID: ${emailDoc.id}`);
    console.log(`📬 To: fake-customer-2025@mailinator.com`);
    console.log(`👤 From: Flemming Adolfsen (Branch Admin)\n`);
    console.log('🔄 The firestore-send-email extension is processing...\n');

    // Check status after delay
    setTimeout(async () => {
      const doc = await emailDoc.get();
      const data = doc.data();
      
      console.log('📊 Email Status:');
      if (data.delivery) {
        console.log(`✅ Delivery State: ${data.delivery.state}`);
        if (data.delivery.error) {
          console.log(`⚠️  Error: ${data.delivery.error}`);
        }
      } else if (data.error) {
        console.log(`❌ Error: ${data.error}`);
      } else {
        console.log('⏳ Still processing...');
      }
      
      console.log('\n📧 You can check the email at: https://mailinator.com/');
      console.log('   (Search for: fake-customer-2025)');
      
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendTestEmail();
