/**
 * Stripe Setup & Subscription Plans Seeding
 * Run this script to initialize subscription plans in Firestore
 * 
 * Usage: node scripts/setup-stripe-plans.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../config/credentials/agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'agritectum-platform',
});

const db = admin.firestore();

const SUBSCRIPTION_PLANS = [
  {
    name: 'Starter',
    tier: 'starter',
    description: 'Perfect for homeowners and small property managers',
    price: 29900, // 299 DKK in øre
    currency: 'DKK',
    billingCycle: 'monthly',
    buildingLimit: 5,
    stripePriceId: 'price_1SxUmeEO88msuT49fOqZ6cFs',
    features: [
      'Up to 5 buildings',
      'Basic property management',
      'Building information & photos',
      'Roof type and size tracking',
      'Basic reports',
      'Email notifications',
    ],
    isActive: true,
  },
  {
    name: 'Professional',
    tier: 'professional',
    description: 'Best for property managers and small companies',
    price: 79900, // 799 DKK in øre
    currency: 'DKK',
    billingCycle: 'monthly',
    buildingLimit: 20,
    stripePriceId: 'price_1SxUnQEO88msuT49sz1IdIRq',
    features: [
      'Up to 20 buildings',
      'Advanced property management',
      'ESG portfolio analytics',
      'Sustainability reporting',
      'Service agreements',
      'Scheduled visit management',
      'Inspection reports',
      'Document uploads',
      'Priority email support',
    ],
    isActive: true,
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'For large portfolios and organizations',
    price: 199900, // 1,999 DKK in øre
    currency: 'DKK',
    billingCycle: 'monthly',
    buildingLimit: 999, // Unlimited
    stripePriceId: 'price_1SxUnpEO88msuT49dt7NrnDW',
    features: [
      'Unlimited buildings',
      'All Professional features',
      'API access',
      'Custom integrations',
      'Advanced ESG reporting',
      'Predictive maintenance',
      'Dedicated account manager',
      'Priority support (phone)',
      'SSO/SAML authentication',
      'Custom reporting',
    ],
    isActive: true,
  },
];

async function setupSubscriptionPlans() {
  try {
    console.log('🔄 Setting up subscription plans...\n');

    for (const plan of SUBSCRIPTION_PLANS) {
      // Check if plan already exists
      const existing = await db
        .collection('subscriptionPlans')
        .where('name', '==', plan.name)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`⏩ Skipping ${plan.name} (already exists)`);
        await db.collection('subscriptionPlans').doc(existing.docs[0].id).update({
          ...plan,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await db.collection('subscriptionPlans').add({
          ...plan,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Created ${plan.name} plan`);
      }
    }

    console.log('\n✨ Subscription plans setup complete!');
    console.log('\n⚠️  IMPORTANT: Replace Stripe Price IDs!');
    console.log('   1. Go to Stripe Dashboard → Products');
    console.log('   2. Create prices for each plan (don\'t copy-paste IDs!)');
    console.log('   3. Update the stripePriceId in the database');
    console.log('   4. Run: firebase deploy --only firestore:rules\n');

  } catch (error) {
    console.error('❌ Error setting up plans:', error);
    process.exit(1);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// Run setup
setupSubscriptionPlans();
