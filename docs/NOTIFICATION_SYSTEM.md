# Notification System - Current Implementation

**Last Updated:** October 28, 2025

## Overview

The Taklaget Service App has a **notification infrastructure in place** but it's **NOT actively being used** for branch manager notifications when employees create reports.

## Current Status

### ✅ What Exists

1. **Notification Service** (`src/services/notificationService.ts`)
   - Complete CRUD operations for notifications
   - Functions like `createNotification()`, `createReportNotification()`, etc.
   - Supports notification types: `info`, `warning`, `success`, `error`, `urgent`
   - Categories: `report`, `user`, `system`, `email`, `security`

2. **Notification Hooks** (`src/hooks/useNotificationEvents.ts`)
   - `useReportNotifications()` - Hook for report-related notifications
   - `notifyReportCreated()`, `notifyReportUpdated()`, `notifyReportCompleted()`, etc.
   - Functions ready to be called when events occur

3. **Notification Context** (`src/contexts/NotificationContext.tsx`)
   - Global notification state management
   - Real-time updates via Firestore listeners
   - Methods: `markAsRead()`, `deleteNotification()`, etc.

4. **Notification UI** (`src/components/NotificationCenter.tsx`)
   - Visual notification panel (now translated!)
   - Shows unread count
   - Displays notification list with actions

5. **Database Structure**
   - Firestore collection: `notifications`
   - Indexed by `userId` for efficient queries
   - Includes metadata (reportId, branchId, etc.)

### ❌ What's Missing

**Critical Gap:** The notification hooks are **never called** when reports are created.

**Current Behavior:**

- When an inspector creates a report → No notification is generated
- Branch managers do **NOT** receive notifications about new reports from their employees
- The notification infrastructure is "dormant" - built but not wired up

## How It Should Work

### Recommended Implementation

**When an employee creates a report, notifications should be sent to:**

1. **Branch Manager** (automatic)
   - Notification: "En ny rapport har skapats: [Customer Name]"
   - Link to view the report
   - Medium priority

2. **Inspector who created it** (optional self-notification)
   - Confirmation: "Din rapport har skapats"

3. **Any assigned reviewer** (if implemented)
   - Notification for report needing review

### Technical Implementation

**Step 1: Create notification helper function**

```typescript
// In src/services/reportService.ts or new file
export const notifyBranchManagerOfNewReport = async (
  report: Report,
  reporter: Employee
): Promise<void> => {
  try {
    // 1. Find all branch managers for this branch
    const branchManagers = await getUserListByRole(report.branchId, 'branchAdmin');

    // 2. Create notifications for each manager
    const notifications = branchManagers.map(manager => ({
      userId: manager.uid,
      notification: {
        type: 'info' as const,
        title: 'Ny rapport skapad',
        message: `${reporter.displayName} har skapat en ny rapport: ${report.customerName}`,
        action: {
          label: 'Visa rapport',
          onClick: `/report/view/${report.id}`,
          type: 'navigate' as const,
        },
        metadata: {
          reportId: report.id,
          branchId: report.branchId,
          category: 'report' as const,
          priority: 'medium' as const,
        },
      },
    }));

    // 3. Batch create notifications
    await createBatchNotifications(notifications);

    console.log(`✅ Notifications sent to ${branchManagers.length} managers`);
  } catch (error) {
    console.error('❌ Error notifying branch managers:', error);
  }
};
```

**Step 2: Call notification in ReportForm after report creation**

```typescript
// In src/components/ReportForm.tsx
const handleSubmit = async (e: React.FormEvent, status?: ReportStatus) => {
  // ... existing report creation logic ...

  if (mode === 'create') {
    const newReportId = await createReport(reportData);

    // ✅ ADD THIS: Notify branch managers
    await notifyBranchManagerOfNewReport({ ...reportData, id: newReportId }, currentUser);

    showSuccess(t('messages.success.saved'));
    // ...
  }
};
```

## Testing the Current System

### Manual Test

1. **As Inspector:** Create a new report
2. **As Branch Admin:** Check notification panel
3. **Expected Result:** ❌ No notification appears

### Why It's Not Working

Looking at the code flow:

- `ReportForm.tsx` creates a report via `reportService.createReport()`
- `reportService` just saves to Firestore
- **No call to notification hooks**
- Notification infrastructure sits idle

## Translation Status

✅ **Fixed October 28, 2025**

- Created `src/locales/sv/notifications.json` with 17 translation keys
- All notification UI elements now properly translated

## Database Query to Check Notifications

```javascript
// In Firebase Console → Firestore
db.collection('notifications')
  .where('userId', '==', 'BRANCH_ADMIN_USER_ID')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();
```

## Recommended Next Steps

### Immediate (This Week)

1. **Implement branch manager notifications**
   - Add helper function to find branch managers
   - Call notification when report created
   - Test end-to-end

### Short-term (Next Sprint)

2. **Add notification preferences**
   - Allow users to disable certain notification types
   - Branch managers can choose which events to be notified about

3. **Email notifications** (optional)
   - Send email summary to branch managers
   - Daily/weekly digest of new reports

### Long-term (Future Release)

4. **Real-time notifications**
   - Push notifications via browser notifications API
   - Desktop/mobile push notifications

5. **Notification center enhancement**
   - Filter by type (report, user, system)
   - Group by date
   - Bulk actions (mark all read, delete all)

## Code References

- Notification Service: `src/services/notificationService.ts` (lines 448-487)
- Notification Hook: `src/hooks/useNotificationEvents.ts` (lines 34-48)
- Report Creation: `src/components/ReportForm.tsx` (lines 554-623)
- Notification UI: `src/components/NotificationCenter.tsx`

## Conclusion

**Answer to Your Question:**

> "As the branch manager, when a new report is created by one of my employees... do I get a notification?"

**Current Answer:** ❌ **No**, you do NOT receive notifications. The infrastructure exists but isn't connected.

**After Recommended Implementation:** ✅ **Yes**, branch managers would automatically receive notifications when employees create reports.

---

**Priority:** High - This is a significant missing feature that affects workflow efficiency.

**Estimated Implementation Time:** 2-4 hours (including testing)
