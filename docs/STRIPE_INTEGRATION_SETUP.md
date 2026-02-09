# Stripe Integration Setup Guide

**Date:** February 5, 2026  
**Status:** Initial Setup Complete  
**Last Updated:** February 5, 2026

## 📋 Overview

This guide walks through implementing Stripe payments for the Agritectum Portal subscription system.

### What's Implemented

✅ **Backend Payment Service** (`src/services/paymentService.ts`)
- Subscription CRUD operations
- Invoice tracking
- Payment method management
- Billing contact management

✅ **Stripe Cloud Functions** (`functions/src/stripe/payments.ts`)
- Checkout session creation
- Subscription management
- Webhook handling
- Invoice tracking

✅ **Frontend Components**
- `BillingDashboard.tsx` - Customer billing interface
- `PricingTable.tsx` - Subscription plans display
- `StripeContext.tsx` - Global payment state management

✅ **Type Definitions** (`src/types/index.ts`)
- Subscription, Invoice, PaymentMethod interfaces
- All payment-related types
- Nordic currency support (DKK, EUR, SEK)

✅ **Environment Configuration**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Frontend (safe to expose)
- `STRIPE_SECRET_KEY` - Backend only (keep secret!)

---

## 🚀 Step-by-Step Setup

### 1. **Create Stripe Account** (if not done)
- Go to [stripe.com](https://stripe.com)
- Create free account
- Enable test mode (top-right toggle)

### 2. **Verify Environment Variables**

Check `.env` file:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[your_publishable_key]
STRIPE_SECRET_KEY=sk_test_[your_secret_key]
```

✅ Already configured in `.env`

⚠️ **NOTE:** Use your actual Stripe API keys from your Stripe Dashboard. Never commit real secret keys to version control.

### 3. **Create Stripe Products & Prices**

**Stripe Dashboard → Products:**

#### **Starter Plan**
- Name: `Starter`
- Price: 299 DKK/month
- Billing: Recurring (monthly)
- Copy the **Price ID** (starts with `price_`)

#### **Professional Plan**
- Name: `Professional`
- Price: 799 DKK/month
- Billing: Recurring (monthly)
- Copy the **Price ID**

#### **Enterprise Plan**
- Name: `Enterprise`
- Price: 1,999 DKK/month
- Billing: Recurring (monthly)
- Copy the **Price ID**

### 4. **Update Subscription Plans in Firestore**

Edit `scripts/setup-stripe-plans.cjs`:

```javascript
const SUBSCRIPTION_PLANS = [
  {
    name: 'Starter',
    stripePriceId: 'price_XXXXX',  // ← Insert Starter Price ID here
    // ...
  },
  {
    name: 'Professional',
    stripePriceId: 'price_YYYYY',  // ← Insert Professional Price ID here
    // ...
  },
  {
    name: 'Enterprise',
    stripePriceId: 'price_ZZZZZ',  // ← Insert Enterprise Price ID here
    // ...
  },
];
```

### 5. **Run Setup Script**

```bash
npm run setup-firebase  # Initialize Firebase admin
node scripts/setup-stripe-plans.cjs
```

This creates the subscription plans in Firestore:
- Collection: `subscriptionPlans/`
- Documents: Starter, Professional, Enterprise

### 6. **Deploy Cloud Functions**

```bash
# Deploy Stripe webhook handler and payment functions
firebase deploy --only functions:createSubscriptionCheckout
firebase deploy --only functions:updateSubscription
firebase deploy --only functions:cancelSubscription
firebase deploy --only functions:stripeWebhook
```

### 7. **Add StripeProvider to App**

In `src/main.tsx`:

```typescript
import { StripeProvider } from './contexts/StripeContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <StripeProvider>
        <App />
      </StripeProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

### 8. **Add Billing Routes**

In your routing configuration:

```typescript
import BillingDashboard from './components/portal/BillingDashboard';
import PricingTable from './components/portal/PricingTable';

// Routes
<Route path="/portal/billing" element={<BillingDashboard />} />
<Route path="/pricing" element={<PricingTable />} />
```

---

## 🔌 Webhook Configuration (Optional but Recommended)

Webhooks handle events like successful payments, failed renewals, cancellations.

### Enable Webhooks:

1. **Stripe Dashboard → Developers → Webhooks**
2. **Add endpoint:**
   - URL: `https://your-deployed-app.cloudfunctions.net/stripeWebhook`
   - Events to receive:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Copy Webhook Signing Secret** (starts with `whsec_`)
4. **Add to `.env`:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

5. **Deploy webhook handler:**
   ```bash
   firebase deploy --only functions:stripeWebhook
   ```

---

## 📱 Frontend Integration

### Using Billing Dashboard

In your portal nav:
```tsx
import BillingDashboard from './components/portal/BillingDashboard';

// In portal layout:
<BillingDashboard />
```

### Using Pricing Page

```tsx
import PricingTable from './components/portal/PricingTable';

// In pricing route:
<PricingTable />
```

### Accessing Payment State

```typescript
import { useStripe } from './contexts/StripeContext';

function MyComponent() {
  const {
    currentSubscription,     // Current active subscription
    paymentMethods,          // Saved cards
    invoices,                // Payment history
    plans,                   // Available plans
    formatPrice,             // DKK formatting helper
    selectPlan,              // Start checkout
    upgradePlan,             // Upgrade to higher tier
    downgradePlan,           // Downgrade
    cancelCurrentSubscription, // Cancel
  } = useStripe();

  // Use any of these in your component
}
```

---

## 🧪 Testing Checklist

### Test Cards (Stripe Test Mode)

| Scenario | Card Number | Exp | CVC |
|----------|----------------|-----|-----|
| Success | 4242 4242 4242 4242 | 12/25 | 123 |
| Declined | 4000 0000 0000 0002 | 12/25 | 123 |
| 3D Secure | 4000 0025 0000 3155 | 12/25 | 123 |

### Manual Testing

1. **Create subscription:**
   - Go to `/pricing`
   - Click "Subscribe Now" on a plan
   - Use test card `4242 4242 4242 4242`
   - Should redirect to `/portal/billing/success`

2. **View subscription:**
   - Go to `/portal/billing`
   - Should see active subscription details
   - Should show renewal date

3. **Upgrade plan:**
   - In `/portal/billing`, select higher tier
   - Should update immediately
   - Firestore should reflect new plan

4. **View invoices:**
   - Scroll to Invoices section
   - Should see payment history
   - Can download PDF

### Firestore Collections to Inspect

```
firestore/
├── subscriptionPlans/         # Plan definitions
├── subscriptions/             # Active subscriptions
├── invoices/                  # Payment history
├── paymentMethods/            # Saved cards
├── billingContacts/           # Billing addresses
└── customers/                 # Stripe customer mapping
```

---

## 🔐 Security Considerations

### ✅ Implemented
- Firestore rules check `customerId` against `auth.uid`
- Secret keys in backend (Cloud Functions) only
- Publishable key exposed in frontend (safe)
- No cc numbers stored (Stripe handles this)

### 🔄 Next Steps
- [ ] Add PCI compliance documentation
- [ ] Implement email notifications for billing
- [ ] Set up dunning (retry failed payments)
- [ ] Add tax calculation (VAT for EU)
- [ ] Implement usage-based billing alerts

---

## 💾 Firestore Schema

### subscriptionPlans/{planId}
```typescriptinterface SubscriptionPlan {
  id: string;
  name: string;                    // 'Starter', 'Professional', 'Enterprise'
  tier: 'starter' | 'professional' | 'enterprise';
  description: string;
  price: number;                   // Amount in øre (29900 = 299 DKK)
  currency: 'DKK' | 'EUR' | 'SEK';
  billingCycle: 'monthly' | 'annual' | 'semi-annual';
  buildingLimit: number;           // Max buildings allowed
  features: string[];              // List of features
  stripePriceId: string;           // Stripe Price ID from dashboard
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### subscriptions/{subscriptionId}
```typescript
interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'paused' | 'canceled' | 'past_due' | 'trial';
  amount: number;                  // In øre
  currency: 'DKK' | 'EUR' | 'SEK';
  currentPeriodStart: string;      // ISO date
  currentPeriodEnd: string;        // ISO date
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### invoices/{invoiceId}
```typescript
interface Invoice {
  id: string;
  customerId: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: number;
  status: 'draft' | 'open' | 'paid' | 'void';
  invoiceNumber: string;
  pdfUrl?: string;
  hostedUrl?: string;
  createdAt: string;
}
```

---

## 📊 Pricing Strategy

### Current Tier Breakdown

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|-----------|
| **Price/Month** | 299 DKK | 799 DKK | 1,999 DKK |
| **Buildings** | 5 | 20 | Unlimited |
| **ESG Analytics** | ❌ | ✅ | ✅ |
| **Service Agreements** | ❌ | ✅ | ✅ |
| **Scheduling** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **Custom Reports** | ❌ | ❌ | ✅ |

### Upgrade Path

- **Starter** → Customers with 1-5 properties
- **Professional** → Small/medium businesses (5-20 buildings)
- **Enterprise** → Large portfolios & integrations

---

## 🐛 Troubleshooting

### Problem: "Failed to create checkout session"

**Solution:**
- Check `stripePriceId` is correct in Firestore
- Verify Stripe keys in `.env`
- Check Cloud Functions deployed

### Problem: "Webhook signature verification failed"

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook using raw request body (not JSON parsed)
- Check webhook endpoint URL is reachable

### Problem: "Customer not found in Stripe"

**Solution:**
- First subscription required to create Stripe customer
- After first payment, customer mapping saved in Firestore

---

## 📚 References

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Pricing Models](https://stripe.com/docs/billing/variable-plans)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## ✅ Deployment Checklist

- [ ] Stripe account created and test mode enabled
- [ ] Products & prices created in Stripe Dashboard
- [ ] Price IDs added to `scripts/setup-stripe-plans.cjs`
- [ ] Setup script run: `node scripts/setup-stripe-plans.cjs`
- [ ] Environment variables in `.env` (both keys)
- [ ] Cloud Functions deployed
- [ ] StripeProvider added to React app
- [ ] Billing routes added to router
- [ ] Tested with Stripe test card
- [ ] Webhook configured (optional)
- [ ] `.env` added to `.gitignore` (already done)

---

**Questions?** Check Cloud Functions logs or Stripe Dashboard for errors.
