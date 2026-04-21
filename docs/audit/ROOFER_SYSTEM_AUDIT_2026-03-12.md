# Roofer (Inspector) System Audit

**Date:** March 12, 2026  
**Scope:** All roofer/inspector-facing functionality across frontend, backend, Firestore rules, and storage rules  
**Auditor:** System Audit Agent

---

## Executive Summary

The roofer experience in Agritectum is functionally comprehensive — covering report creation, scheduling, notifications, offers, and offline capability. However, the audit identified **5 critical**, **7 high**, and **9 medium** severity findings primarily in **authorization enforcement**, **cross-branch data isolation**, **input validation**, and **production security hygiene**.

The system relies heavily on Firestore security rules as the last line of defense, which is architecturally sound, but client-side services frequently omit authorization checks entirely, creating a fragile dependency. Several services accept optional user context parameters, meaning a bug or code change could bypass all access control.

### Finding Summary

| Severity | Count | Categories |
|----------|-------|------------|
| 🔴 Critical | 5 | Auth fallback, cross-branch access, offer creation, appointment assignment, test credentials |
| 🟠 High | 7 | Claims race condition, client-side filtering fallback, file upload limits, notification injection, coordinate validation, user update bypass, appointment date leak |
| 🟡 Medium | 9 | Permission consistency, branch guard loophole, draft localStorage, missing audit logs, pagination, report deletion rules, notification dedup, isPublic/isShared confusion, form validation |

---

## 1. Authentication & Role Resolution

### 🔴 CRITICAL: Inspector as Default Fallback Role

**File:** `src/contexts/AuthContext.tsx` (~line 95)

When custom claims fail to propagate AND the Firestore user document is missing the `role` field, the system defaults any internal user to `inspector`. This is a silent privilege *loss* for admins, but the inverse is also possible: if a user document is created without a role but with `permissionLevel: 2`, they get `inspector` as role but superadmin-level permission — which passes some guards but not others.

```typescript
role: (resolvedRole || 'inspector') as UserRole,
```

**Risk:** Role-permission inconsistency, unpredictable authorization behavior.  
**Recommendation:** Throw an error if role cannot be resolved from both claims and Firestore. Add a role-permission consistency check.

---

### 🟠 HIGH: Claims Propagation Race Condition

**File:** `src/contexts/AuthContext.tsx` (~lines 217-249)

`waitForClaims()` retries up to 5 times with exponential backoff (total ~3.1s), then silently falls back to Firestore. In high-latency or congested regions, this means:

- Inspectors may intermittently get permissions from a stale Firestore document
- No audit trail of which data source was used (claims vs Firestore)
- User experience varies by network conditions, not actual authorization state

**Recommendation:** Log which data source was used for each session. Increase max wait or fail closed instead of falling back silently.

---

### 🟡 MEDIUM: No Role-Permission Cross-Validation

**File:** `src/contexts/AuthContext.tsx` (~lines 68-82)

If claims arrive as `{role: 'inspector', permissionLevel: 2}`, this is accepted without question. There's no consistency validation between role name and numeric permission level.

**Recommendation:** Add assertion that `role === 'superadmin'` requires `permissionLevel >= 2`, etc.

---

## 2. Route Guards & Access Control

### ProtectedRoute Superadmin Bypass

**Files:** `src/routing/guards/ProtectedRoute.tsx`, `src/hocs/withRoleGuard.tsx`

The route guard allows superadmins to bypass ALL role-specific route checks via permission level. While intended, there are edge cases:

- A superadmin without `branchId` can navigate to routes requiring a branch, then fail on Firestore writes (guard allows, rules reject)
- If claims are corrupted to show `role: 'superadmin', permissionLevel: 2`, client-side guards pass entirely

**Risk:** UX confusion (navigate allowed, actions rejected) and potential privilege escalation if claims are manipulated.  
**Recommendation:** Ensure client-side guards mirror server-side Firestore rules precisely.

---

## 3. Report System

### 🔴 CRITICAL: `getReport()` Has No Client-Side Access Validation

**File:** `src/services/reportService.ts` (~lines 81-92)

`getReport(reportId)` fetches any report by ID without checking the requesting user's branch or ownership. The `branchId` parameter is accepted but never used.

```typescript
export const getReport = async (reportId: string, branchId?: string): Promise<Report | null> => {
  const reportRef = doc(db, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);
  // No user/branch validation
  return migrateReport({ id: reportSnap.id, ...reportSnap.data() }) as Report;
};
```

**Mitigation:** Firestore rules DO enforce branch-scoped reads. However, if an inspector guesses or discovers a report ID from another branch, the Firestore rule is the only barrier. Defense-in-depth requires client-side validation too.

**Recommendation:** Add `currentUser` as a required parameter and validate branch membership before returning data.

---

### 🟠 HIGH: Inspectors See ALL Reports in Their Branch

**File:** `src/services/reportService.ts` (~lines 49-71)

Intentionally designed so inspectors can "relate new reports to existing ones," but this gives every inspector access to all customer PII (names, addresses, phones, emails) for every report in the branch.

**Real-world risk:** If roofers compete for customers or leave the company, they have visibility into the entire branch's customer base.  
**Recommendation:** Consider limiting inspector visibility to their own reports + reports they're assigned to. Provide a separate "customer lookup" endpoint for relating reports.

---

### 🟠 HIGH: Client-Side Filtering Fallback Fetches All Reports

**File:** `src/services/reportService.ts` (~lines 109-168)

When a Firestore composite index is missing, `getReportsByCustomerId()` falls back to fetching ALL reports and filtering in memory. If `branchId` is not provided, it fetches every report in the entire system.

**Risk:** Memory exhaustion, Firestore quota abuse, potential data leakage on partial filter failure.  
**Recommendation:** Require `branchId` for fallback queries. Add pagination. Ensure all required indexes are deployed.

---

### 🟡 MEDIUM: Building Snapshot Race Condition

**File:** `src/services/reportService.ts` (~lines 319-344)

Report creation snapshots building data in a non-transactional read, then writes the report. If building data is updated between read and write, the snapshot is stale.

**Recommendation:** Use a Firestore transaction to atomically snapshot building data during report creation.

---

### 🟡 MEDIUM: Draft Data in localStorage

**File:** `src/components/ReportForm.tsx` (~lines 433-457)

Report drafts containing customer PII are stored in cleartext in `localStorage`. This data persists after logout and is accessible to XSS attacks or other users on shared computers.

**Recommendation:** Move draft storage to server-side (Firestore `reportDrafts` collection) or encrypt before storing locally. Clear drafts on logout.

---

### 🟡 MEDIUM: Limited Form Field Validation

**File:** `src/components/ReportForm.tsx`

Validation utilities exist (`formDataValidation.ts`) but not all form fields use them. Phone numbers, email addresses, and roof sizes are not validated against format or reasonable ranges before submission.

**Recommendation:** Apply existing validation utilities to all user-input fields before save/submit.

---

## 4. Appointment System

### 🔴 CRITICAL: `createAppointment()` Lacks Inspector Assignment Validation

**File:** `src/services/appointmentService.ts` (~lines 198-276)

Any authenticated user can create an appointment and assign it to any `assignedInspectorId` without validating:
- Whether the inspector exists
- Whether the inspector belongs to the same branch
- Whether the caller has permission to assign work

```typescript
export const createAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  // No validation of assignedInspectorId
  const docRef = await addDoc(appointmentsRef, cleanData);
```

**Mitigation:** Firestore rules restrict appointment creation to branch admins and superadmins. However, if an inspector somehow triggers this code path, they could assign work to colleagues.

**Recommendation:** Validate `assignedInspectorId` exists and belongs to the same branch. Require `currentUser` with permission level check.

---

### 🟠 HIGH: `getAppointmentsByDate()` Allows Branch-Wide Queries Without Role Check

**File:** `src/services/appointmentService.ts` (~lines 103-144)

When called with `branchId` but without `inspectorId`, returns all appointments for the branch regardless of the caller's role. An inspector could call this directly to see all colleagues' schedules and customer details.

**Mitigation:** Firestore rules restrict inspector reads to `assignedInspectorId == request.auth.uid`, so server-side protection exists. But the client function doesn't enforce this.

**Recommendation:** Add role-based filtering in the service function to match Firestore rules.

---

### 🟡 MEDIUM: Appointment Reminder Skips Non-Accepted Visits

**File:** `functions/src/appointmentReminders.ts` (~line 57)

The cloud function only sends reminders for appointments where `customerResponse === 'accepted'`. Appointments created by admins that haven't been explicitly accepted by customers are silently skipped.

**Risk:** Roofers may not receive reminders for valid appointments if the customer hasn't responded.  
**Recommendation:** Clarify business logic — should reminders also fire for `pending` appointments?

---

## 5. Offer System

### 🔴 CRITICAL: Cross-Branch Offer Creation Only Logs Warning

**File:** `src/services/offerService.ts` (~lines 11-46)

When an inspector creates an offer for a report from a different branch, the system logs a warning but **does not throw an error** — the offer is created successfully.

```typescript
if (userBranchId && userBranchId !== 'main' && report.branchId && report.branchId !== userBranchId) {
  logger.warn(`Warning: Attempting to create offer for report in different branch...`);
  // NO THROW - continues anyway
}
```

**Risk:** Cross-branch financial data manipulation. Inspector from Branch A creates offers for Branch B's customers.  
**Recommendation:** Change `logger.warn` to `throw new Error`. Add explicit branch validation.

---

### 🟡 MEDIUM: Offer Email Sent Without Email Validation

**File:** `src/services/offerService.ts` (~lines 112-143)

`sendOfferToCustomer()` sends via the email queue without validating `offer.customerEmail` format.

**Recommendation:** Validate email format before enqueueing.

---

## 6. User Management

### 🟠 HIGH: `updateUser()` Has Optional User Context

**File:** `src/services/userService.ts` (~lines 82-109)

The `currentUser` parameter is optional. If omitted or null, **no permission validation occurs** — the update goes directly to Firestore.

```typescript
export const updateUser = async (
  userId: string,
  updates: Partial<Employee>,
  currentUser?: User  // Optional!
): Promise<void> => {
  if (currentUser && currentUser.role === 'branchAdmin') {
    // Validation only happens if currentUser is provided
  }
  await updateDoc(userRef, updates);
};
```

**Mitigation:** Firestore rules enforce that only branch admins/superadmins can update users in their branch, and users can update their own document.  
**Recommendation:** Make `currentUser` required. Add role-permission escalation checks.

---

### 🟡 MEDIUM: No Audit Log for User Modifications

No user modification events (role changes, permission updates, deletions) are logged to an audit collection.

**Risk:** Cannot trace privilege escalations or unauthorized modifications. GDPR compliance concern.  
**Recommendation:** Add an `auditLog` collection entry for every user modification.

---

## 7. Notification System

### 🟠 HIGH: Unsanitized User Input in Notifications

**File:** `src/services/appointmentNotificationService.ts` (~lines 70-90)

Customer-provided rejection reasons and names are interpolated directly into notification messages and email templates without sanitization.

```typescript
message: `${appointment.customerName} has rejected...${reason ? ` Reason: ${reason}` : ''}`,
```

**Risk:** If a customer enters malicious content (HTML/JS) in the rejection reason, it could be rendered unsafely in the roofer's notification UI or email.  
**Recommendation:** Sanitize all user-input fields before including in notifications and email templates.

---

### 🟡 MEDIUM: No Duplicate Notification Prevention

Notification creation functions have no idempotency checks. If called multiple times for the same event, they create duplicate notifications for the roofer.

**Recommendation:** Check for existing notifications with the same `appointmentId` and `type` before creating.

---

## 8. Storage Security

### 🟠 HIGH: No File Size or Type Limits in Storage Rules

**File:** `storage.rules`

Storage rules validate report/building access correctly but do not enforce:
- Maximum file size (no `request.resource.size` check)
- Allowed file types (no content type or extension validation)

```firestore
match /reports/{reportId}/{allPaths=**} {
  allow write: if canWriteReport(reportId);
  // No size or type checks
}
```

**Risk:** A roofer could upload arbitrarily large files (storage quota exhaustion/cost), or upload non-image file types.  
**Recommendation:** Add size limits (e.g., 10MB) and content type restrictions:

```firestore
allow write: if canWriteReport(reportId) &&
  request.resource.size < 10 * 1024 * 1024 &&
  request.resource.contentType.matches('image/.*|application/pdf');
```

---

### 🟡 MEDIUM: `isPublic` vs `isShared` Semantics Unclear

**File:** `storage.rules` (line 10)

Both flags grant public read access to report storage files:

```firestore
let isPublic = report.data != null && (report.data.isPublic == true || report.data.isShared == true);
```

The distinction between `isPublic` (anyone with link) and `isShared` (specific customer access) is not enforced. If `isShared` is meant for authenticated customer access only, it should not grant unauthenticated reads.

**Recommendation:** Separate the logic — `isPublic` for unauthenticated access, `isShared` for customer-authenticated access only.

---

## 9. Production Security Hygiene

### 🔴 CRITICAL: Hardcoded Test Firebase Credentials in Source

**File:** `src/config/firebase.ts` (~lines 26-45)

Test Firebase project credentials are hardcoded as fallback values:

```typescript
const testConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY_TEST || 'AIzaSyDONTxBtz3LRvDgoGJAEhTG_iK61GX30-0',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_TEST || 'agritectum-platform-test',
  // ...
};
```

**Risk:** Credentials visible in production JavaScript bundles. Test project may have weaker security rules.  
**Recommendation:** Remove all hardcoded credentials. Use environment variables exclusively.

---

### Seed Data Accessible in Production

**File:** `src/utils/seedFirebase.ts` imported in `src/App.tsx`

The `seedTestData()` function is accessible from the browser console in production builds. Combined with the hardcoded test credentials, an attacker could inject test data.

**Recommendation:** Conditionally import only in development:

```typescript
if (import.meta.env.DEV) {
  import('./utils/seedFirebase');
}
```

---

## 10. Roofer UX & Workflow Assessment

### What Works Well

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-stage report form | ✅ Solid | 3-stage workflow with auto-save |
| Roof image annotation | ✅ Good | Pin-based issue marking on images |
| Satellite map integration | ✅ Good | OpenStreetMap geocoding + markers |
| Offline capability | ✅ Functional | IndexedDB + Service Worker caching |
| Schedule/calendar view | ✅ Complete | Date filtering, status tracking |
| In-app notifications | ✅ Working | Real-time Firestore subscriptions |
| Offer creation from reports | ✅ Working | Full pricing breakdown |
| iCal export | ✅ Available | Calendar export for appointments |

### UX Gaps for Roofers

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **No route optimization** | Roofers with multiple daily appointments get no route guidance | Add map view showing all day's appointments with directions |
| **No bulk report status view** | Hard to see which drafts need completion | Add a "My Drafts" count on dashboard with deadline warnings |
| **Dashboard loads all reports** | Slow for active roofers with many reports | Implement pagination (limit 50 per page) |
| **No offline appointment sync** | Appointments require connectivity | Extend offlineService to cache appointments in IndexedDB |
| **Calendar integration is export-only** | No bidirectional sync with Google/Outlook | Consider CalDAV or Google Calendar API integration |
| **No photo compression** | Large photos from phone cameras slow uploads | Add client-side image compression before upload |

---

## Prioritized Remediation Plan

### Immediate (Week 1)
1. **Remove hardcoded test credentials** from `firebase.ts`
2. **Conditional-import seedFirebase** for dev-only
3. **Add storage rules size/type limits** (10MB, images+PDF only)
4. **Fix cross-branch offer creation** — change `logger.warn` to `throw new Error`
5. **Sanitize notification inputs** — escape HTML in all user-provided fields

### Short-Term (Weeks 2-3)
6. **Make `currentUser` required** in `updateUser()`, `createOffer()`, `createAppointment()`
7. **Add client-side branch validation** in `getReport()`, `getAppointmentsByDate()`
8. **Add role-permission consistency check** in AuthContext
9. **Add audit logging** for user modifications
10. **Separate `isPublic`/`isShared` logic** in storage rules

### Medium-Term (Weeks 4-6)
11. **Implement report pagination** in SmartDashboard and ReportLibrary
12. **Move drafts from localStorage** to server-side collection
13. **Add duplicate notification prevention** with idempotency checks
14. **Expand form field validation** using existing utilities
15. **Add offline appointment caching** for field workers

### Long-Term (Backlog)
16. Route optimization for multi-appointment days
17. Client-side image compression before upload
18. Bidirectional calendar sync (Google/Outlook)
19. Inspector-scoped report visibility (own reports only + assigned)
20. Rate limiting on notification creation

---

## Conclusion

The roofer system is feature-rich and covers the core workflow well. The most critical gaps are in **authorization enforcement at the service layer** (currently relying almost entirely on Firestore rules) and **production security hygiene** (hardcoded credentials, accessible seed data). The Firestore rules themselves are well-structured and provide a solid last line of defense, but defense-in-depth requires matching client-side checks.

The roofer UX is functional for daily field work with offline support, but would benefit from performance improvements (pagination), better data isolation (inspector-scoped visibility), and field-worker quality-of-life features (route optimization, photo compression).
