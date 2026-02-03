# Guide: Creating Test Data Properly

After cleaning up Flemming's data, follow this guide to recreate test data with **proper customer linking**.

---

## Step 1: Create a Customer (for Dandy Park)

1. **Open the app** as a Branch Administrator
2. **Navigate to**: Customers or CRM section
3. **Create New Customer**:

   ```
   Name: Dandy Business Park
   Email: kontakt@dandybusinesspark.dk
   Phone: +4521440430
   Address: Lysholt Allé 10, 7100 Vejle
   Company Type: Company
   ```

4. **Important**: Note the Customer ID that gets created
   - You'll need this for buildings

---

## Step 2: Create Buildings **Linked to Customer**

1. **Navigate to**: Buildings or Properties section
2. **Create New Building**:

   ```
   Address: Lysholt Allé 10, 7100 Vejle
   Building Type: Commercial
   Roof Type: Flat
   Roof Size: 1060 m²
   ```

3. **Link to Customer**:
   - Select: "Dandy Business Park" from customer dropdown
   - This sets `customerId` in the database
   - ✅ Now Dandy Park can see this building

4. **Create Building**

---

## Step 3: Create Reports **Linked to Building**

1. **Navigate to**: Create Report
2. **Select Customer**:
   - Choose "Dandy Business Park"
   - This automatically links to their buildings

3. **Select Building**:
   - The building you just created should appear
   - Select it

4. **Fill in Report Details**:
   - Inspection Date: 2026-01-20
   - Roof Type: Flat
   - Roof Age: 7 years
   - Condition: Good
   - Add issues and recommendations as needed

5. **Save/Submit Report**

---

## Step 4: Test Access

1. **Log in as Dandy Park** (customer account)
2. **Check PortalDashboard**:
   - ✅ Buildings should appear
   - ✅ Reports should appear
   - ✅ Scheduled visits should be visible

3. **Check for permission errors**:
   - Should show data, not "Missing or insufficient permissions"

---

## Key Differences from Flemming's Setup

### ❌ What Flemming Did Wrong:

```
Building created by: flemming.adolfsen@agritectum.dk
- createdBy: flemming.adolfsen@agritectum.dk
- customerId: (empty) ← ❌ No customer linked!
- branchId: agritectum-denmark
```

### ✅ Correct Way:

```
Building created by: flemming.adolfsen@agritectum.dk
- createdBy: flemming.adolfsen@agritectum.dk
- customerId: "dandy-park" ← ✅ Customer linked!
- branchId: agritectum-denmark
```

---

## Automating with Test Data Script

You can also create test data programmatically:

```bash
# If you have a test data seed script:
npm run seed:testdata

# Or manually in console:
seedTestData()
```

---

## Firestore Rules Explained

The rules check:

1. Is the user authenticated? ✓
2. What's their permission level? (customer = -1)
3. Do they own this building/report?
   - Either via `customerId` match
   - Or via `companyId` match
   - Or they're an inspector/branch admin

**That's why Dandy Park couldn't see Flemming's buildings** - they weren't linked with `customerId`.

---

## Checklist for Success

- [ ] Cleanup completed (Flemming's data deleted)
- [ ] Created Dandy Park customer
- [ ] Created building **linked to customer**
- [ ] Created report **linked to building and customer**
- [ ] Logged in as Dandy Park customer
- [ ] Verified: Can see buildings ✓
- [ ] Verified: Can see reports ✓
- [ ] Verified: No permission errors ✓

---

## Troubleshooting

### Still seeing "Missing or insufficient permissions"?

- Check that building has `customerId` set
- Check that customer has correct `companyId` if using company linking
- Try clearing browser cache and relogging in

### Building not appearing in customer view?

- Verify `customerId` field in Firestore is set correctly
- Check customer ID matches exactly (case-sensitive)
- Make sure you're logged in as the correct customer

### Can't find customer dropdown when creating building?

- Go to Customers section first
- Create customer there
- Then create building with customer already in system

---

## Questions?

Refer to:

- [Firestore Rules](../../firestore.rules)
- [Building Service](../../src/services/buildingService.ts)
- [Report Service](../../src/services/reportService.ts)
