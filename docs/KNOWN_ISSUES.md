# Known Issues - Taklaget Service App

**Last Updated:** October 28, 2025

## Overview

This document tracks known bugs, limitations, and issues that are acknowledged but not yet fixed. Items are prioritized by severity and impact on core workflows.

---

## Date & Timezone Issues

### Issue #01: Appointment Date Shifting by One Day

**Severity:** Medium  
**Status:** Documented - Not Fixed  
**Discovered:** October 28, 2025  
**Reported By:** QA Testing (Linus Holberg & New Roofer accounts)

#### Description

When a branch admin creates a booking for date X (e.g., 28 Oct 2025), the inspector sees date X-1 (e.g., 27 Oct 2025) in their schedule.

#### Impact

- Confuses scheduling for branch admins and inspectors
- May lead to missed appointments
- Creates discrepancy between admin view and inspector view

#### Root Cause Analysis

Likely timezone handling issue in one of these areas:

- `src/components/schedule/AppointmentForm.tsx` (lines 1-100) - Date input handling
- `src/components/schedule/SchedulePage.tsx` - Date parsing/display
- `src/services/appointmentService.ts` - Date storage/retrieval

#### Files to Investigate

```
src/components/schedule/AppointmentForm.tsx
src/components/schedule/SchedulePage.tsx
src/services/appointmentService.ts
src/types/index.ts (Appointment interface)
```

#### Temporary Workaround

Branch admins should book appointments **one day ahead** of the intended date.

#### Reproduction Steps

1. Login as branch admin (linus.hollberg@taklagetentreprenad.se)
2. Create new booking for October 28, 2025
3. Login as inspector (new.roofer@example.com)
4. Navigate to Schema
5. Observe date shows as October 27, 2025

#### Next Steps

- [ ] Review date input handling in AppointmentForm
- [ ] Check timezone conversion in appointmentService
- [ ] Verify ISO date formatting/storage in Firestore
- [ ] Test with different timezones
- [ ] Fix date parsing to maintain correct date across views

---

## User Management Limitations

### Issue #02: Branch Admins Cannot Edit/Delete Users

**Severity:** Low-Medium  
**Status:** Documented - Known Limitation  
**Reported:** QA Testing, October 28, 2025

#### Description

Branch admins can create users but cannot edit or delete existing users from the User Management interface.

#### Impact

- Prevents proper user lifecycle management
- Leaves orphaned or incorrect user accounts
- Requires superadmin intervention for basic user changes

#### Workaround

Contact superadmin to manage user accounts.

#### Notes

This appears to be an intentional design limitation. Review if branch admins should have full CRUD permissions for users in their branch.

---

### Issue #03: Branch Admins Cannot Edit/Delete Customers

**Severity:** Low-Medium  
**Status:** Documented - Known Limitation  
**Reported:** QA Testing, October 28, 2025

#### Description

Branch admins can create customers but cannot edit or delete existing customer records.

#### Impact

- Prevents customer data correction
- No way to remove duplicate or incorrect customer entries
- Database bloat with inactive customers

#### Workaround

Contact superadmin for customer data management.

#### Notes

Review permission model for customer management. Consider allowing edits but restricting deletes to prevent accidental data loss.

---

### Issue #04: Old Appointments Remain Visible

**Severity:** Low  
**Status:** Documented - May Be Expected Behavior  
**Reported:** QA Testing, October 28, 2025

#### Description

Inspector sees appointment from October 22, 2025 marked as "Inställd" (cancelled) even though it wasn't cancelled during current testing session.

#### Possible Explanations

1. Expected behavior - historical appointments are preserved for records
2. Previous test session created this appointment
3. Appointments don't auto-hide after cancellation

#### Recommendation

Clarify business requirements:

- Should cancelled appointments be hidden from inspector view?
- Are historical appointments needed for reporting?
- Implement filter to hide old cancelled appointments?

---

## Feature Requests / Enhancements

### FR-01: Search and Filter for Customers

**Priority:** Medium  
**Status:** Enhancement Request

Branch admins report difficulty finding customers as dataset grows. No search/filter bar currently exists in Customer Management.

**Recommendation:** Implement search and filter functionality similar to AllReports page.

---

### FR-02: Branch Admin Cannot Edit Branch Info

**Priority:** Low  
**Status:** Design Decision / Enhancement

Branch admins are restricted from editing their own branch information (logo, address, etc.).

**Recommendation:** Review if branch admins should have limited editing rights for their branch details.

---

### FR-03: Improved Password Policy Enforcement

**Priority:** Low  
**Status:** Enhancement

Current password policy accepts weak passwords. Minimal enforcement exists.

**Recommendation:** Strengthen password validation on both frontend and backend.

---

## Architecture Considerations

### AC-01: Notification System Not Connected

**Severity:** High (Feature Gap)  
**Status:** Documented - Implementation Required

The notification infrastructure exists but is not wired up. Branch managers do NOT receive notifications when employees create reports.

**See:** `docs/NOTIFICATION_SYSTEM.md` for detailed analysis and implementation plan.

**Estimated Fix Time:** 2-4 hours

---

## Testing Notes

### Test Accounts

- **Branch Admin**: linus.hollberg@taklagetentreprenad.se / Taklaget2025!
- **Inspector**: new.roofer@example.com / Roofer2025!

---

## Update History

- **October 28, 2025**: Initial documentation of issues from QA testing
  - Date timezone bug
  - User/Customer management limitations
  - Old appointments visibility
  - Various enhancement requests

---

## How to Use This Document

1. **For New Issues**: Add to this document with severity, status, and reproduction steps
2. **For Fixes**: Update status to "Fixed" and add fix date
3. **For Enhancements**: Add to Feature Requests section
4. **Priority Setting**:
   - **Critical**: Blocks core workflows, needs immediate attention
   - **High**: Significantly impacts user experience
   - **Medium**: Causes confusion or minor workflow disruption
   - **Low**: Nice-to-have improvement or cosmetic issue
