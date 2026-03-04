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
    console.log('📧 Sending test email with MailerSend verified domain...\n');

    const emailDoc = await db.collection('mail').add({
      to: ['fake-customer-2025@mailinator.com'],
      subject: 'Test Email - MailerSend Verified',
      text: 'Testing MailerSend SMTP integration.',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>✅ MailerSend SMTP Test</h2>
            <p>This email was sent using MailerSend's SMTP relay.</p>
            <p><strong>System:</strong> Agritectum Platform</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `,
      from: 'test-yxj6lj9qdz74do2r.mlsender.net', // MailerSend's verified domain
      deliveryAttempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Test email enqueued!');
    console.log(`📄 Document: ${emailId}`);
    console.log(`📬 To: fake-customer-2025@mailinator.com`);
    console.log(`👤 From: MailerSend verified domain\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

sendTestEmail();
