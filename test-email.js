import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load the service account key
const serviceAccountRaw = readFileSync('./agritectum-platform-firebase-adminsdk-fbsvc-da9cd456bf.json', 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email via MailerSend SMTP...\n');

    // Write directly to the 'mail' collection
    // The firestore-send-email extension will pick it up automatically
    const emailDoc = await db.collection('mail').add({
      to: ['test@example.com'], // Test email address
      subject: 'Test Email from Agritectum - MailerSend SMTP',
      text: 'This is a test email sent through the MailerSend SMTP relay configured in your Firebase project.',
      html: `
        <h2>Test Email - MailerSend Configuration</h2>
        <p>This is a test email sent through the MailerSend SMTP relay.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Server: smtp.mailersend.net</li>
          <li>Port: 587 (TLS)</li>
          <li>From: noreply@agritectum.com</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <p>If you receive this email, your MailerSend SMTP configuration is working correctly!</p>
      `,
      deliveryAttempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Test email enqueued successfully!');
    console.log(`📄 Document ID: ${emailDoc.id}\n`);
    console.log('The Firebase "firestore-send-email" extension will process this automatically.');
    console.log('Check your email inbox for: test@example.com\n');

    // Give a short delay and then check the status
    setTimeout(async () => {
      const doc = await emailDoc.get();
      const data = doc.data();
      console.log('📊 Email Document Status:');
      console.log(JSON.stringify(data, null, 2));
      
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

sendTestEmail();
