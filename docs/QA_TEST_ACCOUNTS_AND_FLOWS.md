# 🧪 QA Test Accounts & Testing Flows

**Last Updated:** January 13, 2026  
**Platform:** https://agritectum-platform.web.app  
**Environment:** Production

---

## 🔐 QA Test Accounts

### 1. 🔍 QA INSPECTOR
```
URL: https://agritectum-platform.web.app/login
Email: qa.inspector@agritectum.dk
Password: QAInspector2026!
Role: Inspector
Branch: QA Test Branch
```

**What to Test:**
- ✅ Create new inspection reports
- ✅ Edit existing reports
- ✅ Upload images to reports
- ✅ Generate PDF reports
- ✅ View branch reports
- ✅ Search for customers/buildings
- ❌ Cannot manage users
- ❌ Cannot access other branches

---

### 2. 👤 QA CUSTOMER (Portal User)
```
URL: https://agritectum-platform.web.app/portal/login
Email: qa.customer@agritectum.dk
Password: QACustomer2026!
Role: Customer
Company: QA Test Company ApS
```

**Pre-loaded Test Data:**
- 2 Buildings (Office + Warehouse)
- 1 Inspection Report with findings

**What to Test:**
- ✅ Login to customer portal
- ✅ View buildings list
- ✅ View building details
- ✅ View inspection reports
- ✅ View offers/recommendations
- ❌ Cannot see other customers' data
- ❌ Cannot access admin features

---

## 🎯 Critical Testing Flows

### Flow 1: Inspector - Create Report (10 min)

1. **Login** as QA Inspector
2. **Navigate** to Dashboard → Click "New Report"
3. **Customer Selection:**
   - Search for "QA Test Company ApS" OR
   - Create new test customer
4. **Building Selection:**
   - Select existing building OR
   - Create new building
5. **Report Details:**
   - Select roof type
   - Add condition notes
   - Add 2-3 issues with severity levels
   - Add recommended actions with costs
6. **Image Upload:**
   - Upload 2-3 test images
   - Verify thumbnails display
7. **Save as Draft** → Verify it appears in "My Reports"
8. **Complete Report** → Mark as completed
9. **Generate PDF** → Download and verify content
10. **Share with Customer** → Toggle "Share with customer"

---

### Flow 2: Customer - View Reports (5 min)

1. **Login** as QA Customer at `/portal/login`
2. **Dashboard:**
   - Verify building count displays
   - Verify welcome message shows
3. **Buildings:**
   - Click "Buildings" → See 2 buildings
   - Click on a building → View details
4. **Reports:**
   - View inspection report for building
   - Check all sections render correctly
5. **Offers:**
   - View any offers/recommendations
   - Check pricing displays correctly

---

### Flow 3: Data Isolation Test (5 min)

1. **Login** as QA Inspector
2. **Verify** only QA Test Branch data visible
3. **Try** to access other branches (should fail)
4. **Login** as QA Customer
5. **Verify** only "QA Test Company ApS" data visible
6. **Check** no other customers' buildings appear

---

## 🐛 Bug Reporting

When reporting bugs, please include:
- Account used (Inspector/Customer)
- Steps to reproduce
- Expected vs actual behavior
- Browser/device info
- Screenshots if applicable

---

## 📞 Support

For technical issues with test accounts, contact the development team.
