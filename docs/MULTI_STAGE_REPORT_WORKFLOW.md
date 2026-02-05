# Multi-Stage Roof Report Workflow - Implementation Guide

**Date:** February 4, 2026
**Status:** Implementation Complete
**Phase:** Phase 2 Enhancement

## Overview

This implementation introduces a realistic, multi-stage roof inspection workflow that mirrors how roofers actually work on-site. Instead of completing the entire report in one session, inspectors can now:

1. **Stage 1 (On-Site)**: Collect initial roof data, take photos, and document conditions while on the roof
2. **Stage 2 (Office)**: Annotate findings, map issues to specific roof locations, and add detailed descriptions
3. **Stage 3 (Review)**: Complete the report for branch manager review, pricing, and estimation

## Architecture & Implementation

### 1. Data Model Updates (`src/types/index.ts`)

New Report fields added:

```typescript
// Stage-based workflow
reportStage?: 'stage1' | 'stage2' | 'stage3';
stage1CompletedAt?: string;
stage2CompletedAt?: string;

// Soft delete with recovery (48 hours)
isDeleted?: boolean;
deletedAt?: string;
expirationReason?: string;

// Draft expiration (30 days)
expiresAt?: string;

// Initial roof condition checklist for Stage 1
roofConditionChecklist?: RoofConditionChecklistItem[];
```

New interface:

```typescript
interface RoofConditionChecklistItem {
  id: string;
  label: string; // e.g., "Safety railings intact"
  value: boolean | null;
  notes?: string;
}
```

### 2. Report Library Component (`src/components/reports/ReportLibrary.tsx`)

A new page accessible at `/reports/library` that displays:

- **Active Drafts** (Max 5 per user): Shows stage progression with visual indicators
  - Stage 1: On-Site Data Collection (33%)
  - Stage 2: Annotation & Mapping (66%)
  - Stage 3: Completed (100%)
  
- **Recovery Section**: Shows soft-deleted reports available for recovery within 48 hours

Features:
- Resume/continue reports at any stage
- Visual progress indicators
- Soft delete with 48-hour recovery option
- Quick resume buttons
- Customer and roof info displayed
- Issue count indicators

### 3. Workflow: ReportContextSimple Updates

**Soft Delete Implementation:**

```typescript
// DELETE (soft):
deleteReport(id) {
  - Sets isDeleted = true
  - Records deletedAt timestamp
  - Report remains in Firestore for 48 hours
  - User can recover within this window
}

// RESTORE:
restoreReport(id) {
  - Sets isDeleted = false
  - Clears deletedAt timestamp
  - Report returns to active drafts
}
```

### 4. Automatic Cleanup (Cloud Functions)

**File:** `functions/src/reportCleanup.ts`

Two cleanup operations:

1. **Scheduled Daily Cleanup** (2 AM UTC):
   - Hard-deletes reports soft-deleted >48 hours ago
   - Soft-deletes draft reports older than 30 days
   - Processes up to 1000 reports per run (batched for performance)

2. **Manual Cleanup** (HTTP Callable):
   - Superadmin only endpoint: `triggerReportCleanup`
   - Useful for testing and manual intervention
   - Returns count of cleaned/expired reports

### 5. Navigation Integration

**In `src/components/layout/Layout.tsx`:**

Added "Report Library" menu item in Reports section:
- Inspector: `My Roof Reports` → `Report Library`
- Branch Admin: `All Roof Reports` → `Report Library`

### 6. Translations

**Added keys in `src/locales/en/navigation.json`:**
```
"navigation.reportLibrary": "Report Library"
```

**Added keys in `src/locales/en/reports.json`:**
- `reports.library.title`
- `reports.library.subtitle`
- `reports.library.stage1OnSite`
- `reports.library.stage2Annotation`
- `reports.library.stage3Complete`
- `reports.library.activeDrafts`
- `reports.library.recovery`
- `reports.library.deleteTooltip`
- Plus recovery and action messages

### 7. Routes

**New Route:** `/reports/library`
- Protected: `inspector`, `branchAdmin` roles only
- Path: `src/routing/routes/main.tsx`
- Component: Lazy-loaded `LazyReportLibrary`

## Usage Workflow

### Typical Roofer Flow:

1. **Create New Report** (`/report/new`)
   - Select/assign customer
   - System creates report in Stage 1 state
   - Roofer navigates to roof with mobile device

2. **Stage 1 - On-Site Work** (On the roof)
   - Fill in roof overview details
   - Check safety conditions (railings, skylights, etc.)
   - Take photos and document issues
   - Click "Save & Exit" or "Save & Continue"
   - Report saved as draft with `reportStage: 'stage1'`
   - Roofer goes down from roof

3. **Stage 2 - Office Work** (Next day, in office)
   - Opens **Report Library** → `/reports/library`
   - Clicks "Continue" on Stage 1 draft
   - System resumes from Stage 2 workflow
   - Reviews all captured issues
   - Uses roof map to place markers on locations
   - Adds detailed descriptions and ties issues to markers
   - Clicks "Mark Complete" → `reportStage: 'stage2'`

4. **Stage 3 - Branch Manager Review** (Automatic)
   - Report shows as completed (100%)
   - Branch manager receives notification
   - Manager reviews photos, marked locations, and descriptions
   - Manager performs pricing and estimation
   - Manager submits as offer or final report

### Report Library Interaction:

```
Report Library Dashboard
├── Active Drafts (5 max)
│  ├── Customer Name & Address
│  ├── Roof Type & Size
│  ├── Issue Count
│  ├── Last Edited Time
│  ├── Progress Bar (Stage %)
│  └── Actions: Continue | Delete
│
└── Recovery (Deleted Reports)
   ├── Time remaining (max 48hrs)
   └── Action: Recover
```

## Data Integrity & Safety

### Soft Delete Features:

1. **48-Hour Recovery Window**
   - Report marked as `isDeleted: true` but remains in database
   - User can recover without data loss
   - After 48 hours, hard deletion occurs automatically

2. **30-Day Draft Expiration**
   - Inactive draft reports auto-expire after 30 days
   - Moved to soft-delete state (48-hour recovery window)
   - Prevents database bloat

3. **Automatic Cleanup**
   - Cloud Function runs daily at 2 AM UTC
   - Batch processes deletions for performance
   - Audit trail preserved via timestamps and reasons

### Limits & Constraints:

- **Max 5 Active Drafts** per roofer: Encourages completion
- **Max 5 Recoverable Drafts** per roofer: Shows recovery options
- **30-Day Expiration**: Forces periodic action on old drafts
- **48-Hour Recovery**: Safety net against accidental deletion

## File Structure

```
src/
├── components/
│   └── reports/
│       ├── ReportLibrary.tsx          (NEW)
│       └── ...existing files
├── contexts/
│   └── ReportContextSimple.tsx        (UPDATED)
├── types/
│   └── index.ts                       (UPDATED)
├── locales/
│   └── en/
│       ├── navigation.json            (UPDATED)
│       └── reports.json               (UPDATED)
└── routing/
    └── routes/
        └── main.tsx                   (UPDATED)

functions/
└── src/
    ├── reportCleanup.ts               (NEW)
    └── index.ts                       (UPDATED)
```

## Configuration & Customization

### Adjust Limits:

**Draft Count Limit** (Report Library component):
```typescript
.slice(0, 5)  // Change 5 to desired limit
```

**Recovery Window** (ReportLibrary.tsx):
```typescript
const recoveryWindow = 48 * 60 * 60 * 1000;  // Change 48 to hours needed
```

**Expiration Window** (reportCleanup.ts):
```typescript
const expirationWindowMs = 30 * 24 * 60 * 60 * 1000;  // Change 30 to days
```

**Cleanup Schedule** (reportCleanup.ts):
```typescript
.schedule('0 2 * * *')  // Change '0 2 * * *' to desired cron
```

## Testing Checklist

- [ ] Create new report and verify Stage 1 initial state
- [ ] Save draft and verify it appears in Report Library
- [ ] Resume draft and verify stage progression
- [ ] Delete draft and verify soft-delete behavior
- [ ] Verify recovery option appears within 48 hours
- [ ] Recover deleted report and verify restoration
- [ ] Test max 5 draft limit
- [ ] Verify progress bars update correctly
- [ ] Test cleanup function manually via `triggerReportCleanup`
- [ ] Verify translations display correctly
- [ ] Test on mobile device (responsive design)

## Future Enhancements

1. **Stage-Specific Form Fields**
   - Stage 1: Basic roof info, checklist, photo capture
   - Stage 2: Annotation tools, issue mapping, descriptions
   - Stage 3: Pricing, recommendations, final review

2. **Offline Support**
   - Save Stage 1 data offline
   - Sync when back online

3. **Batch Operations**
   - Bulk delete/recover from Report Library
   - Export multiple reports as PDF

4. **Advanced Analytics**
   - Track average time per stage
   - Identify bottlenecks
   - Roofer productivity metrics

5. **Notifications**
   - Branch manager notified when Stage 2 complete
   - Roofer reminder for drafts nearing 30-day expiration
   - System notifications for recovery window expiring

## References

- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Soft Delete Pattern](https://firebase.google.com/docs/firestore/best-practices)
- Original request: Multi-stage roof report workflow for on-site and office work

## Related Components

- `ReportForm.tsx` - Create/edit reports
- `ReportView.tsx` - View report details
- `AllReports.tsx` - List all reports
- `ReportContextSimple.tsx` - Report state management
- `reportService.ts` - Firebase operations

## Support & Maintenance

- Monitor cleanup function logs for errors
- Check Firestore indexes for queries in `reportCleanup.ts`
- Review recovery metrics monthly
- Update expiration/recovery windows based on user feedback

---

**Implementation Date:** February 4, 2026
**Developer:** GitHub Copilot
**Review Status:** Pending QA Testing
