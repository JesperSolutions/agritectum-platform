# Stripe Products Setup - Step-by-Step Guide

**Date:** February 5, 2026  
**Status:** Ready to Configure  
**Estimated Time:** 10 minutes

---

## 🎯 What You're Creating

3 subscription products for your Building Owner Portal:

| Product | Price | Target Customer |
|---------|-------|-----------------|
| **Starter** | 299 DKK/month | Homeowners, 1-5 buildings |
| **Professional** | 799 DKK/month | Property managers, 6-20 buildings |
| **Enterprise** | 1,999 DKK/month | Large portfolios, unlimited |

---

## 📋 Step 1: Access Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/products
2. Make sure **"Test mode"** toggle is ON (top-right corner)
3. Click **"+ Create product"** button

---

## 🏗️ Step 2: Create Starter Plan

### Product Information
- **Name:** `Starter`
- **Description:** `Perfect for homeowners and small property managers with up to 5 buildings`

### Pricing
- **Type:** Select **"Recurring"**
- **Price:** `299`
- **Currency:** `DKK` (Danish Krone)
- **Billing period:** `Monthly`

### Additional Settings
- **Statement descriptor:** `AGRITECTUM STARTER` (appears on card statements)
- Leave other fields as default

### Click "Save product"

### ✅ Copy the Price ID
After saving, you'll see the product page. Look for:
- **Price ID:** Starts with `price_` (e.g., `price_1abc123xyz...`)
- **Copy this ID** - you'll need it in Step 5

---

## 🏢 Step 3: Create Professional Plan

Click "+ Create product" again:

### Product Information
- **Name:** `Professional`
- **Description:** `Best for property managers with 6-20 buildings. Includes ESG analytics, service agreements, and scheduling.`

### Pricing
- **Type:** `Recurring`
- **Price:** `799`
- **Currency:** `DKK`
- **Billing period:** `Monthly`

### Additional Settings
- **Statement descriptor:** `AGRITECTUM PRO`

### Click "Save product"

### ✅ Copy the Price ID
- Find and copy the **Price ID** (starts with `price_`)

---

## 🏆 Step 4: Create Enterprise Plan

Click "+ Create product" one more time:

### Product Information
- **Name:** `Enterprise`
- **Description:** `For large portfolios with unlimited buildings. Includes API access, custom reports, and dedicated support.`

### Pricing
- **Type:** `Recurring`
- **Price:** `1999`
- **Currency:** `DKK`
- **Billing period:** `Monthly`

### Additional Settings
- **Statement descriptor:** `AGRITECTUM ENT`

### Click "Save product"

### ✅ Copy the Price ID
- Copy the **Price ID** (starts with `price_`)

---

## 📝 Step 5: Update Setup Script with Price IDs

Now open: `scripts/setup-stripe-plans.cjs`

Find these lines (around line 13):

```javascript
const SUBSCRIPTION_PLANS = [
  {
    name: 'Starter',
    tier: 'starter',
    description: 'Perfect for homeowners and small property managers',
    price: 29900, // 299 DKK in øre
    currency: 'DKK',
    billingCycle: 'monthly',
    buildingLimit: 5,
    stripePriceId: 'price_1SdUOAEO88msuT49your_starter_price_id', // ⬅️ REPLACE THIS
    features: [
      'Up to 5 buildings',
      'Basic property management',
      // ...
    ],
```

**Replace the 3 `stripePriceId` values** with your actual Price IDs:

```javascript
stripePriceId: 'price_1abc123xyz...',  // ← Paste Starter Price ID here
```

Do this for all 3 plans (Starter, Professional, Enterprise).

---

## 🚀 Step 6: Run Setup Script

Open PowerShell and run:

```bash
cd f:\GitHub\agritectum-platform
node scripts/setup-stripe-plans.cjs
```

**Expected Output:**
```
🔄 Setting up subscription plans...

✅ Created Starter plan
✅ Created Professional plan
✅ Created Enterprise plan

✨ Subscription plans setup complete!
```

This creates the plans in your Firestore database.

---

## ✅ Step 7: Verify in Firebase Console

1. Go to: https://console.firebase.google.com/project/agritectum-platform
2. Click **Firestore Database**
3. Look for collection: `subscriptionPlans`
4. You should see 3 documents: `Starter`, `Professional`, `Enterprise`
5. Each document should have:
   - `stripePriceId` matching your Stripe Dashboard
   - `price` (in øre: 29900, 79900, 199900)
   - `currency: "DKK"`
   - `features` array
   - `isActive: true`

---

## 🎨 Step 8: Test Payment Flow (After Functions Deploy)

Once Firebase deployment succeeds, test with Stripe test cards:

### Test Card Numbers:
| Card | Scenario | Exp | CVC |
|------|----------|-----|-----|
| `4242 4242 4242 4242` | ✅ Success | 12/30 | 123 |
| `4000 0000 0000 0002` | ❌ Declined | 12/30 | 123 |
| `4000 0025 0000 3155` | 🔐 3D Secure | 12/30 | 123 |

### Test Steps:
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/pricing`
3. Click **"Subscribe Now"** on Starter plan
4. Fill form with test card `4242 4242 4242 4242`
5. Complete checkout
6. Should redirect to billing dashboard
7. Verify subscription shows as "Active"

---

## 🔍 Troubleshooting

### Problem: "Price ID not found"
**Solution:** 
- Double-check you copied the **Price ID** (not Product ID)
- Price ID starts with `price_`, Product ID starts with `prod_`
- Make sure you're in **Test mode** in Stripe Dashboard

### Problem: "Currency mismatch"
**Solution:**
- Ensure all products use `DKK` currency
- Check `scripts/setup-stripe-plans.cjs` has `currency: 'DKK'`

### Problem: "Setup script fails"
**Solution:**
```bash
# Make sure Firebase Admin SDK credentials are correct:
node scripts/setup-firebase
# Then retry:
node scripts/setup-stripe-plans.cjs
```

### Problem: "Can't find plans in frontend"
**Solution:**
- Check Firestore rules allow reading `subscriptionPlans` collection
- Verify `isActive: true` on all plans
- Check browser console for errors

---

## 📊 Monitoring & Analytics

### View in Stripe Dashboard

**Customers:** https://dashboard.stripe.com/test/customers  
**Subscriptions:** https://dashboard.stripe.com/test/subscriptions  
**Payments:** https://dashboard.stripe.com/test/payments

### Key Metrics to Watch:
- **MRR (Monthly Recurring Revenue)** - Total subscription value
- **Churn Rate** - Cancellation percentage
- **Conversion Rate** - Free visitors → paid subscribers
- **ARPU (Average Revenue Per User)** - Revenue per customer

---

## 🎯 Going Live (Production Mode)

When ready to accept real payments:

1. **Switch to Live mode** in Stripe Dashboard (toggle top-right)
2. **Create 3 new products** (same as above, but in Live mode)
3. **Get Live API keys:**
   - Publishable: `pk_live_...`
   - Secret: `sk_live_...`
4. **Update `.env`:**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
5. **Update `setup-stripe-plans.cjs`** with Live Price IDs
6. **Run script again** to populate Live Firestore
7. **Deploy to production:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## 🔒 Security Checklist

- ✅ Stripe webhook secret configured
- ✅ Firebase credentials in `.gitignore`
- ✅ Test mode for development
- ✅ HTTPS only for production
- ✅ Firestore security rules active
- ✅ Customer data encrypted at rest

---

## 📚 Quick Reference

### Important Files:
- **Setup script:** `scripts/setup-stripe-plans.cjs`
- **Environment:** `.env`
- **Payment service:** `src/services/paymentService.ts`
- **Cloud Functions:** `functions/src/stripe/payments.ts`
- **UI Components:** 
  - `src/components/portal/BillingDashboard.tsx`
  - `src/components/portal/PricingTable.tsx`

### Important URLs:
- **Stripe Dashboard:** https://dashboard.stripe.com/test
- **Firebase Console:** https://console.firebase.google.com
- **Webhook endpoint:** `https://europe-west1-agritectum-platform.cloudfunctions.net/stripeWebhook`

---

## 💡 Pro Tips

1. **Test failed payments** early - use card `4000 0000 0000 0002` to see dunning flow
2. **Set up email templates** for subscription confirmations, renewals, cancellations
3. **Monitor webhook delivery** in Stripe Dashboard → Developers → Webhooks
4. **Add tax rates** for VAT compliance (if selling in EU)
5. **Enable customer portal** in Stripe for self-service billing
6. **Set up Radar** (Stripe's fraud detection) before going live

---

## ✅ Completion Checklist

- [ ] Created 3 products in Stripe Dashboard (Test mode)
- [ ] Copied all 3 Price IDs
- [ ] Updated `setup-stripe-plans.cjs` with Price IDs
- [ ] Ran setup script successfully
- [ ] Verified plans in Firestore
- [ ] Waited for Firebase Functions deployment to complete
- [ ] Tested subscription flow with test card
- [ ] Checked webhook is receiving events
- [ ] Reviewed billing dashboard UI
- [ ] Ready for beta testing! 🎉

---

**Next:** Once Firebase deployment succeeds, retry:
```bash
firebase deploy --only functions
```

Then test the complete payment flow!
