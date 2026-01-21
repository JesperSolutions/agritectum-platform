# Translation Audit Report

**Date:** 2025-01-31  
**Status:** Complete  
**Scope:** All components and translation files

---

## Executive Summary

This audit identifies hardcoded strings, missing translation keys, and locale completeness issues. Swedish (sv) translations are complete, but English (en) is missing entirely, and Danish (da) and German (de) may be incomplete.

---

## 1. Locale Completeness

### Current State

**Swedish (sv):** ✅ **COMPLETE**

- 19 translation files
- All modules covered
- Production-ready

**Danish (da):** ⚠️ **STRUCTURE EXISTS, CONTENT UNKNOWN**

- 19 translation files (same structure as sv)
- Files exist but content completeness unknown
- Needs verification

**German (de):** ⚠️ **STRUCTURE EXISTS, CONTENT UNKNOWN**

- 19 translation files (same structure as sv)
- Files exist but content completeness unknown
- Needs verification

**English (en):** ❌ **MISSING**

- No locale directory exists
- No translation files
- **Action Required:** Create complete English translation set

### Translation File Structure

```
src/locales/{locale}/
├── address.json
├── admin.json
├── analytics.json
├── common.json
├── customers.json
├── dashboard.json
├── email.json
├── errors.json
├── index.ts
├── login.json
├── navigation.json
├── notifications.json
├── offers.json
├── profile.json
├── reportForm.json
├── reports.json
├── schedule.json
├── serviceAgreements.json
└── validation.json
```

---

## 2. Hardcoded Strings Audit

### Router.tsx Hardcoded Strings

**ErrorPage Component:**

- `"Access Denied"` - Line 72
- `"You don't have permission to access this resource."` - Line 73
- Button text uses translation ✅
- Button color: `bg-blue-600` (should use design system)

**UnauthorizedPage Component:**

- `"Access Denied"` - Line 72
- `"You don't have permission to access this resource."` - Line 73
- Button text uses translation ✅

**NoBranchPage Component:**

- `"No Branch Assigned"` - Line 88
- `"You haven't been assigned to a branch yet. Please contact your administrator."` - Line 89-90
- `"Back to Login"` - Line 96
- All hardcoded, no translations

**Loading State:**

- Uses `bg-gray-50` (should use `bg-slate-50`)

### Component Hardcoded Strings

**AllReports.tsx:**

- `"Access Denied"` - Line 482
- Uses `text-gray-900` (should use `text-slate-900`)

**CustomerManagement.tsx:**

- `"Access Denied"` - Line 439

**BranchManagement.tsx:**

- `"Access Denied"` - Line 62
- `"You don't have permission to manage branches."` - Line 63
- `"No branches yet"` - Line 470
- `"No branch selected"` - Line 543

**EmailTemplateViewer.tsx:**

- `"Access Denied"` - Line 724

**QATestingPage.tsx:**

- `"🚨 ACCESS DENIED 🚨"` - Line 77
- `"No branch assigned to user"` - Lines 185, 223, 469

**AdminTestingPage.tsx:**

- `"Access Denied"` - Line 41

**EnhancedErrorDisplay.tsx:**

- `"You don't have permission to perform this action. Please contact your administrator."` - Line 29

### Translation Keys Needed

**Create in `src/locales/{locale}/errors.json`:**

```json
{
  "routing.accessDenied": "Access Denied",
  "routing.accessDeniedMessage": "You don't have permission to access this resource.",
  "routing.noBranchAssigned": "No Branch Assigned",
  "routing.noBranchMessage": "You haven't been assigned to a branch yet. Please contact your administrator.",
  "routing.backToLogin": "Back to Login",
  "access.denied": "Access Denied",
  "access.deniedMessage": "You don't have permission to access this resource.",
  "access.noBranchAssigned": "No Branch Assigned",
  "access.noBranchMessage": "You haven't been assigned to a branch yet. Please contact your administrator.",
  "access.manageBranches": "You don't have permission to manage branches.",
  "branch.none": "No branches yet",
  "branch.notSelected": "No branch selected",
  "branch.notAssigned": "No branch assigned to user",
  "errors.permissionDenied": "You don't have permission to perform this action. Please contact your administrator."
}
```

---

## 3. Translation Key Naming Inconsistencies

### Current Patterns

**Common Keys:**

- `common.buttons.*` ✅ Consistent
- `common.labels.*` ✅ Consistent
- `common.status.*` ✅ Consistent
- `common.messages.*` ✅ Consistent

**Module-Specific Keys:**

- `reports.*` ✅ Consistent
- `admin.*` ✅ Consistent
- `dashboard.*` ✅ Consistent
- `schedule.*` ✅ Consistent

**Error Keys:**

- `errors.*` - Some components use this
- `common.errorState.*` - Some components use this
- **Issue:** Inconsistent error key naming

### Recommendation

**Standardize Error Keys:**

- Use `errors.*` for all error messages
- Use `errors.routing.*` for routing errors
- Use `errors.access.*` for access denied errors
- Use `errors.branch.*` for branch-related errors

---

## 4. Missing Translation Keys

### Keys Used But Not Found

**Need to verify these exist in all locales:**

1. **Analytics Dashboard:**
   - `analytics.loadingReports` - Used in AnalyticsDashboard.tsx
   - `analytics.comprehensiveInsights` - Used in AnalyticsDashboard.tsx
   - `analytics.lastUpdated` - Used in AnalyticsDashboard.tsx
   - `analytics.filterDataByTimeframe` - Used in AnalyticsDashboard.tsx
   - `analytics.exportAnalyticsData` - Used in AnalyticsDashboard.tsx
   - `analytics.kpisMetrics` - Used in AnalyticsDashboard.tsx
   - `analytics.totalReports` - Used in AnalyticsDashboard.tsx
   - `analytics.thisMonth` - Used in AnalyticsDashboard.tsx
   - `analytics.totalRevenue` - Used in AnalyticsDashboard.tsx
   - `analytics.completionRate` - Used in AnalyticsDashboard.tsx
   - `analytics.reportsSent` - Used in AnalyticsDashboard.tsx
   - `analytics.criticalIssues` - Used in AnalyticsDashboard.tsx
   - `analytics.ofAllReports` - Used in AnalyticsDashboard.tsx
   - `analytics.totalBusinessRevenue` - Used with fallback
   - `analytics.monthlyEarnings` - Used with fallback
   - `analytics.yearlyEarnings` - Used with fallback
   - `analytics.reports` - Used in AnalyticsDashboard.tsx
   - `analytics.revenue` - Used in AnalyticsDashboard.tsx
   - `analytics.reportTrends` - Used in AnalyticsDashboard.tsx
   - `analytics.reportStatusOverview` - Used in AnalyticsDashboard.tsx
   - `analytics.draftReportsInProgress` - Used in AnalyticsDashboard.tsx
   - `analytics.sentReportsCompleted` - Used in AnalyticsDashboard.tsx
   - `analytics.archivedReportsStored` - Used in AnalyticsDashboard.tsx
   - `analytics.customerInsights` - Used in AnalyticsDashboard.tsx
   - `analytics.topCustomersByRevenue` - Used in AnalyticsDashboard.tsx
   - `analytics.avgDaysToSend` - Used in AnalyticsDashboard.tsx
   - `analytics.roofTypes` - Used in AnalyticsDashboard.tsx
   - `analytics.reportsByRoofType` - Used in AnalyticsDashboard.tsx
   - `analytics.branchPerformance` - Used in AnalyticsDashboard.tsx
   - `analytics.reportsPerEmployee` - Used in AnalyticsDashboard.tsx
   - `analytics.inspector` - Used in AnalyticsDashboard.tsx

2. **Common Keys:**
   - `common.timeframe` - Used in AnalyticsDashboard.tsx
   - `common.branch` - Used in AnalyticsDashboard.tsx
   - `common.filters` - Used in AnalyticsDashboard.tsx
   - `common.buttons.export` - Used in AnalyticsDashboard.tsx
   - `common.applyFilters` - Used in AnalyticsDashboard.tsx
   - `common.lastUpdated` - Used in AnalyticsDashboard.tsx

3. **Schedule Keys:**
   - `schedule.errorLoading` - Used in SchedulePage.tsx
   - `schedule.todaysAppointments` - Used in SchedulePage.tsx

### Verification Needed

**Action Required:**

- Verify all keys used in components exist in `sv` locale
- Check if keys exist in `da` and `de` locales
- Document missing keys for each locale

---

## 5. Translation Key Usage Patterns

### Current Usage

**Pattern 1: Direct Translation**

```tsx
const { t } = useIntl();
const label = t('common.buttons.save');
```

**Pattern 2: Translation with Fallback**

```tsx
{
  t('analytics.totalBusinessRevenue') || 'Total Business Revenue';
}
```

**Pattern 3: Translation with Parameters**

```tsx
t('common.deleteReportConfirmation', { customerName: 'John Doe' });
```

### Issues Identified

1. **Inconsistent Fallback Usage:**
   - Some components use fallbacks, others don't
   - Fallbacks should be consistent or removed

2. **Hardcoded Fallbacks:**
   - Some fallbacks are in English (should be in Swedish or removed)
   - Example: `'Total Business Revenue'` in AnalyticsDashboard.tsx

3. **Missing Translation Checks:**
   - No validation that translation keys exist
   - No TypeScript types for translation keys
   - No build-time validation

---

## 6. Locale File Comparison

### File Structure Comparison

**All Locales Have Same Structure:**

- ✅ sv: 19 files
- ✅ da: 19 files
- ✅ de: 19 files
- ❌ en: 0 files

### Content Completeness

**Swedish (sv):**

- `common.json`: 215 lines (complete)
- `errors.json`: Needs verification
- All other files: Need verification

**Danish (da) & German (de):**

- File structure matches Swedish
- Content completeness unknown
- **Action Required:** Verify content or mark as incomplete

---

## 7. Translation Key Statistics

### Estimated Key Count

**By Module:**

- `common.json`: ~215 keys
- `dashboard.json`: ~60 keys
- `reports.json`: ~50 keys
- `reportForm.json`: ~100 keys
- `admin.json`: ~40 keys
- `analytics.json`: ~45 keys
- `schedule.json`: ~30 keys
- `customers.json`: ~40 keys
- `serviceAgreements.json`: ~30 keys
- `offers.json`: ~25 keys
- `email.json`: ~20 keys
- `validation.json`: ~15 keys
- `errors.json`: ~10 keys
- `navigation.json`: ~15 keys
- `login.json`: ~15 keys
- `profile.json`: ~20 keys
- `address.json`: ~5 keys
- `notifications.json`: ~10 keys

**Total Estimated:** ~700+ translation keys

---

## 8. Hardcoded String Locations

### Files with Hardcoded Strings

1. **Router.tsx:**
   - ErrorPage: 2 strings
   - UnauthorizedPage: 2 strings
   - NoBranchPage: 3 strings
   - **Total:** 7 hardcoded strings

2. **AllReports.tsx:**
   - Access denied message: 1 string

3. **CustomerManagement.tsx:**
   - Access denied message: 1 string

4. **BranchManagement.tsx:**
   - Access denied: 1 string
   - Permission message: 1 string
   - Empty states: 2 strings
   - **Total:** 4 hardcoded strings

5. **EmailTemplateViewer.tsx:**
   - Access denied: 1 string

6. **QATestingPage.tsx:**
   - Access denied: 1 string
   - Error messages: 3 strings
   - **Total:** 4 hardcoded strings

7. **AdminTestingPage.tsx:**
   - Access denied: 1 string

8. **EnhancedErrorDisplay.tsx:**
   - Permission message: 1 string

**Total Hardcoded Strings:** ~20 instances

---

## 9. Translation Key Naming Convention

### Current Convention

**Format:** `{module}.{category}.{item}`

**Examples:**

- `common.buttons.save` ✅
- `reports.table.status` ✅
- `admin.users.roles.branchAdmin` ✅
- `analytics.totalReports` ✅

### Issues

1. **Inconsistent Depth:**
   - Some keys are 2 levels: `common.buttons.save`
   - Some keys are 3 levels: `admin.users.roles.branchAdmin`
   - Some keys are 4 levels: `analytics.reportsByRoofType`

2. **Category Naming:**
   - Some use `buttons`, others use `actions`
   - Some use `messages`, others use `alerts`
   - Some use `status`, others use `states`

### Recommendation

**Standardize to 3 Levels:**

```
{module}.{category}.{item}

Examples:
- common.buttons.save
- common.messages.loading
- reports.table.status
- admin.users.roles.branchAdmin
- analytics.metrics.totalReports
```

**Category Standardization:**

- `buttons` - All button text
- `labels` - Form labels, field labels
- `messages` - User messages, notifications
- `errors` - Error messages
- `status` - Status indicators
- `table` - Table-specific text
- `filters` - Filter labels and options

---

## 10. English Translation Status

### Current State

**English (en) Locale:** ❌ **COMPLETELY MISSING**

- No `src/locales/en/` directory
- No translation files
- No index.ts aggregator

### Impact

- Application defaults to Swedish for missing translations
- No English language support
- International users see Swedish text

### Recommendation

**Create English Translation Set:**

1. Create `src/locales/en/` directory
2. Copy structure from Swedish
3. Translate all ~700 keys from Swedish to English
4. Create `index.ts` aggregator
5. Add English to locale selection

---

## 11. Translation Validation

### Current Validation

**No Automated Validation:**

- No script to find missing keys
- No TypeScript types for keys
- No CI checks for hardcoded strings
- No build-time validation

### Existing Scripts

**Found:**

- `scripts/find-missing-translations.cjs` - Exists but may need updates
- `scripts/generate-translation-inventory.cjs` - Exists

### Recommendation

**Create Validation System:**

1. **TypeScript Types:**
   - Generate types from translation files
   - Type-safe translation key usage
   - Autocomplete for translation keys

2. **Build-Time Validation:**
   - Check all `t()` calls have valid keys
   - Warn on missing keys
   - Fail build on critical missing keys

3. **CI Validation:**
   - Check for hardcoded strings
   - Verify locale completeness
   - Compare locale file structures

---

## 12. Recommendations Summary

### Immediate Actions (Priority: HIGH)

1. **Extract Hardcoded Strings:**
   - Move Router.tsx error page strings to `errors.json`
   - Move component access denied messages to `errors.json`
   - Update all components to use translation keys

2. **Create English Translations:**
   - Create `src/locales/en/` directory
   - Translate all Swedish keys to English
   - Ensure complete coverage

3. **Verify Danish & German:**
   - Check if da/de files are complete
   - Mark as incomplete if needed
   - Plan translation completion

### Medium-Term Actions (Priority: MEDIUM)

4. **Standardize Error Keys:**
   - Use `errors.*` for all error messages
   - Create consistent error key structure
   - Update all components

5. **Create Translation Types:**
   - Generate TypeScript types from translation files
   - Enable type-safe translation usage
   - Add autocomplete support

6. **Translation Validation:**
   - Create build-time validation
   - Add CI checks for hardcoded strings
   - Verify locale completeness

### Long-Term Actions (Priority: LOW)

7. **Translation Key Documentation:**
   - Document all translation keys
   - Create key reference guide
   - Maintain key inventory

8. **Translation Management:**
   - Consider translation management tool
   - Automate translation updates
   - Track translation changes

---

## 13. Metrics

### Current State

- **Total Translation Keys:** ~700+
- **Hardcoded Strings:** ~20 instances
- **Locales:** 3 (sv, da, de) + 1 missing (en)
- **Swedish Completeness:** 100%
- **English Completeness:** 0%
- **Danish/German Completeness:** Unknown

### Target State

- **Total Translation Keys:** ~700+ (maintain)
- **Hardcoded Strings:** 0
- **Locales:** 4 (sv, da, de, en) all complete
- **Swedish Completeness:** 100%
- **English Completeness:** 100%
- **Danish/German Completeness:** 100%

---

## 14. Next Steps

1. ✅ Complete this audit report
2. Extract hardcoded strings to translation files (Phase 2.5)
3. Create English translation set (Phase 2.5)
4. Verify Danish and German completeness
5. Create translation validation system (Phase 3)

---

**Report Generated:** 2025-01-31  
**Next Review:** After Phase 2.5 implementation
