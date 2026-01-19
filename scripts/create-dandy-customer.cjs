/**
 * Create DANDY Business Park as a customer
 * and generate a signup link for them
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
const serviceAccount = require('../agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Customer details
const CUSTOMER_DATA = {
  name: 'DANDY Business Park',
  company: 'DANDY Business Park',
  email: 'kontakt@dandybusinesspark.dk',
  phone: '+45 21 44 04 30',
  address: 'Lysholt Allé 10, 7100 Vejle',
  cvr: '36199512',
  notes: 'Familieejet erhvervspark med 9 huse og 35.000 m² i Vejle Nord. DGNB guldcertifikat.',
  customerType: 'company',
  branchId: 'test-agritectum-zh0q0b', // Flemming Adolfsen's branch
  createdBy: 'script-admin',
  totalReports: 0,
  totalRevenue: 0,
};

// Flemming's user ID (branch admin who will "create" the invitation)
const FLEMMING_USER_ID = 'flemming-adolfsen-admin';

async function createDandyCustomer() {
  try {
    console.log('🏢 Creating DANDY Business Park customer...\n');

    // Step 1: Create the customer document
    const customerRef = db.collection('customers').doc();
    const customerId = customerRef.id;

    const customerDoc = {
      ...CUSTOMER_DATA,
      id: customerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await customerRef.set(customerDoc);
    console.log('✅ Customer created with ID:', customerId);
    console.log('   Name:', CUSTOMER_DATA.name);
    console.log('   Address:', CUSTOMER_DATA.address);
    console.log('   Phone:', CUSTOMER_DATA.phone);
    console.log('   CVR:', CUSTOMER_DATA.cvr);

    // Step 2: Create an invitation token
    const token = uuidv4().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days from now

    const invitationRef = db.collection('customerInvitations').doc();
    const invitationDoc = {
      id: invitationRef.id,
      token: token,
      customerId: customerId,
      customerName: CUSTOMER_DATA.name,
      branchId: CUSTOMER_DATA.branchId,
      email: CUSTOMER_DATA.email,
      status: 'pending',
      createdBy: FLEMMING_USER_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
    };

    await invitationRef.set(invitationDoc);
    console.log('\n✅ Invitation created');
    console.log('   Expires:', expiresAt.toLocaleDateString('da-DK'));

    // Generate the signup URL
    const signupUrl = `https://agritectum-platform.web.app/portal/signup/${token}`;

    console.log('\n' + '='.repeat(60));
    console.log('📋 DANDY BUSINESS PARK - SIGNUP DETAILS');
    console.log('='.repeat(60));
    console.log('\n🔗 Signup Link (valid for 14 days):');
    console.log(`   ${signupUrl}`);
    console.log('\n📧 Suggested Email: kontakt@dandybusinesspark.dk');
    console.log('🏢 Company: DANDY Business Park');
    console.log('📍 Address: Lysholt Allé 10, 7100 Vejle');
    console.log('📞 Phone: +45 21 44 04 30');
    console.log('🔢 CVR: 36199512');
    console.log('\n📝 Instructions:');
    console.log('   1. Send the signup link to the customer');
    console.log('   2. They click the link and create their own password');
    console.log('   3. After signup, they can log in at /portal/login');
    console.log('='.repeat(60));

    return {
      customerId,
      signupUrl,
      token,
      expiresAt,
    };
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
}

createDandyCustomer()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
