#!/usr/bin/env node

/**
 * Stripe Connection Test Script
 * Tests if Stripe is properly configured and can connect to the API
 * 
 * Usage:
 *   STRIPE_SECRET_KEY="sk_test_..." node testStripe.js
 */

const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;

console.log('🔍 Stripe Connection Test');
console.log('═'.repeat(50));

// Check if key is provided
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable not set');
  console.error('\nUsage:');
  console.error('  STRIPE_SECRET_KEY="sk_test_..." node testStripe.js');
  process.exit(1);
}

// Mask the key for display
const maskedKey = stripeKey.substring(0, 8) + '...' + stripeKey.substring(stripeKey.length - 4);
console.log(`✓ Key found: ${maskedKey}`);
console.log();

// Initialize Stripe
let stripe;
try {
  stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  });
  console.log('✓ Stripe client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error.message);
  process.exit(1);
}

console.log();

// Test 1: List customers (read operation)
async function testListCustomers() {
  try {
    console.log('🧪 Test 1: Fetching existing customers...');
    const customers = await stripe.customers.list({ limit: 1 });
    console.log('✓ Successfully connected to Stripe API');
    console.log(`  - Found ${customers.data.length} customer(s)`);
    return true;
  } catch (error) {
    console.error('❌ Failed to list customers:', error.message);
    return false;
  }
}

// Test 2: Retrieve account (API health check)
async function testAccount() {
  try {
    console.log('🧪 Test 2: Fetching account information...');
    const account = await stripe.account.retrieve();
    console.log('✓ Successfully retrieved account information');
    console.log(`  - Account ID: ${account.id}`);
    console.log(`  - Type: ${account.type}`);
    console.log(`  - Country: ${account.country}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to retrieve account:', error.message);
    return false;
  }
}

// Test 3: Create a test customer (write operation)
async function testCreateCustomer() {
  try {
    console.log('🧪 Test 3: Creating test customer...');
    const customer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      description: 'Stripe connection test',
      metadata: {
        test: 'true',
      },
    });
    console.log('✓ Successfully created test customer');
    console.log(`  - Customer ID: ${customer.id}`);
    console.log(`  - Email: ${customer.email}`);
    return customer.id;
  } catch (error) {
    console.error('❌ Failed to create customer:', error.message);
    return null;
  }
}

// Test 4: Retrieve the created customer
async function testRetrieveCustomer(customerId) {
  try {
    console.log('🧪 Test 4: Retrieving test customer...');
    const customer = await stripe.customers.retrieve(customerId);
    console.log('✓ Successfully retrieved test customer');
    console.log(`  - Customer ID: ${customer.id}`);
    console.log(`  - Email: ${customer.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to retrieve customer:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Running Stripe API tests...');
  console.log('═'.repeat(50));
  console.log();

  let passed = 0;
  let failed = 0;

  // Test 1
  if (await testListCustomers()) {
    passed++;
  } else {
    failed++;
  }
  console.log();

  // Test 2
  if (await testAccount()) {
    passed++;
  } else {
    failed++;
  }
  console.log();

  // Test 3 & 4
  const customerId = await testCreateCustomer();
  if (customerId) {
    passed++;
    console.log();
    if (await testRetrieveCustomer(customerId)) {
      passed++;
    } else {
      failed++;
    }
  } else {
    failed += 2;
  }

  console.log();
  console.log('═'.repeat(50));
  console.log('📊 Test Results');
  console.log(`✓ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log();

  if (failed === 0) {
    console.log('🎉 All tests passed! Stripe is properly configured.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check your Stripe configuration.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
