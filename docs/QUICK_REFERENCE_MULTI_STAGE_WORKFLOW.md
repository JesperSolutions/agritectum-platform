# Multi-Stage Roof Report - Quick Reference Guide

## 🚀 Quick Start

### Access Report Library
```
URL: /reports/library
Accessible by: Inspector, Branch Admin
Purpose: View, manage, and resume draft reports
```

### Create a Report (Stage 1)
```
1. Navigate to: /report/new
2. Fill in customer and roof details
3. Click "Save" → Report created in Stage 1
4. Report appears in Report Library automatically
```

### Resume a Report (Continue Workflow)
```
1. Go to: /reports/library
2. Find your draft in "Active Drafts" section
3. Click "Continue" button
4. System loads report at current stage
5. Make changes and save
```

### Delete a Report (Soft Delete)
```
1. In Report Library, click trash icon
2. Confirm deletion in dialog
3. Report moved to "Recovery" section
4. Available to recover for 48 hours
5. After 48h, automatically hard-deleted
```

### Recover a Deleted Report
```
1. In Report Library, find "Recovery" section
2. See time remaining for recovery (max 48h)
3. Click "Recover" button
4. Report returns to "Active Drafts"
```

---

## 📊 Data Model Quick Reference

### New Report Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `reportStage` | `'stage1' \| 'stage2' \| 'stage3'` | Current workflow stage | `'stage1'` |
| `stage1CompletedAt` | `string (ISO)` | When Stage 1 finished | `'2026-02-04T10:30:00Z'` |
| `stage2CompletedAt` | `string (ISO)` | When Stage 2 finished | `'2026-02-04T15:45:00Z'` |
| `isDeleted` | `boolean` | Soft delete flag | `true` |
| `deletedAt` | `string (ISO)` | When marked deleted | `'2026-02-04T11:20:00Z'` |
| `expiresAt` | `string (ISO)` | Draft expiration date | `'2026-03-06T10:30:00Z'` |
| `expirationReason` | `string` | Why deleted/expired | `'Auto-expired after 30 days'` |
| `roofConditionChecklist` | `RoofConditionChecklistItem[]` | Stage 1 checklist | `[{ id, label, value, notes }]` |

---

## 🔄 Workflow Stages

### Stage 1: On-Site (33% Progress)
```
📍 Location: On the roof with mobile device
⏱️ Time: While on-site inspection
📋 Tasks:
  - Enter roof overview details
  - Check safety railings
  - Check skylights
  - Take photos of roof
  - Document issues found
💾 Save: "Save & Exit"
🔜 Next: Go home, open Report Library → Continue
```

### Stage 2: Annotation (66% Progress)
```
📍 Location: Office with computer
⏱️ Time: Next day or later
📋 Tasks:
  - Review all captured issues
  - Use roof map to place markers
  - Add detailed descriptions
  - Tie issues to specific locations
  - Update roof images with pins
💾 Save: "Mark Complete" or "Save Draft"
🔜 Next: Branch manager notified → Stage 3
```

### Stage 3: Complete (100% Progress)
```
📍 Location: Branch manager office
⏱️ Time: After Stage 2 complete
📋 Tasks:
  - Review complete documentation
  - Review all photos and markers
  - Perform pricing and estimation
  - Create offer if applicable
💾 Action: "Submit as Offer" or "Finalize Report"
✅ Status: Report ready for customer
```

---

## 🛠️ Developer API Reference

### useReportStage Hook

```typescript
import { useReportStage } from '../hooks/useReportStage';

// In component:
const {
  currentStage,      // 'stage1' | 'stage2' | 'stage3'
  stageInfo,         // { stage, label, progress, description, ... }
  advanceStage,      // () => Promise<void>
  setStage,          // (stage: ReportStage) => void
  canAdvance,        // boolean
  STAGE_CONFIG       // Full config for all stages
} = useReportStage({
  initialStage: 'stage1',
  onStageChange: (stage) => {
    console.log('Stage changed to:', stage);
  }
});
```

### Stage Progress Component

```typescript
import { StageProgress } from '../hooks/useReportStage';

// Full version (with description):
<StageProgress stage="stage1" />

// Compact version (just progress bar):
<StageProgress stage="stage1" compact={true} />
```

### Add Stage Metadata to Report

```typescript
import { addStageMetadata } from '../hooks/useReportStage';

const reportData = { ... };
const updatedReport = addStageMetadata(reportData, 'stage2');
// Adds: reportStage, stage2CompletedAt, lastEdited timestamps
```

### Check Field Visibility

```typescript
import { shouldShowField } from '../hooks/useReportStage';

if (shouldShowField('onsite', currentStage)) {
  // Show on-site fields
}

if (shouldShowField('annotation', currentStage)) {
  // Show annotation fields
}
```

---

## 🗑️ Cleanup & Expiration

### Automatic Cleanup (Cloud Function)
```
⏰ When: Daily at 2 AM UTC
🔧 What:
  - Hard-deletes reports deleted >48 hours ago
  - Soft-deletes (marks isDeleted) drafts >30 days old
📊 Batch size: 1000 reports max per run
📝 Logs: Firebase Console → Functions → cleanupExpiredReports
```

### Manual Cleanup (For Testing)

```typescript
// Call from browser console or Cloud Functions shell:
const triggerReportCleanup = firebase.functions().httpsCallable('triggerReportCleanup');

triggerReportCleanup()
  .then(result => {
    console.log('Cleanup result:', result.data);
    // { success: true, hardDeleted: 5, expired: 10, timestamp: ... }
  })
  .catch(error => {
    console.error('Cleanup failed:', error);
  });
```

### Timestamps & Recovery Windows

```
Time Format: ISO 8601 (e.g., '2026-02-04T10:30:00Z')

Recovery Window:
  - Soft-deleted report: deletedAt to deletedAt + 48 hours
  - Within window: User can click "Recover"
  - After window: Automatically hard-deleted

Expiration:
  - Draft created: createdAt = timestamp
  - Auto-expired: After 30 days, marked isDeleted = true
  - Second recovery: Can still recover for 48 hours
```

---

## 📁 File Structure

```
src/
├── components/
│   └── reports/
│       ├── ReportLibrary.tsx        ← New main component
│       ├── DraftReportsList.tsx     (unchanged)
│       └── ...
├── contexts/
│   └── ReportContextSimple.tsx      ← Updated with restore
├── hooks/
│   └── useReportStage.ts            ← New stage management
├── types/
│   └── index.ts                     ← Updated Report interface
└── locales/en/
    ├── navigation.json              ← Added reportLibrary key
    └── reports.json                 ← Added 17 library keys

functions/src/
├── reportCleanup.ts                 ← New cleanup functions
└── index.ts                         ← Exports cleanup

docs/
├── MULTI_STAGE_REPORT_WORKFLOW.md                 ← Full guide
└── IMPLEMENTATION_SUMMARY_MULTI_STAGE_WORKFLOW.md ← Summary
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Create report → appears in Report Library
- [ ] Continue from Stage 1 → loads Stage 1 form
- [ ] Continue from Stage 2 → loads Stage 2 form
- [ ] Delete draft → moves to Recovery
- [ ] Recover within 48h → returns to Active
- [ ] Max 5 drafts → 6th draft shows oldest in message
- [ ] Progress bar updates → shows correct %

### Data Tests
- [ ] `reportStage` set correctly on create
- [ ] Timestamps added when advancing stages
- [ ] `isDeleted` flag set on delete
- [ ] `deletedAt` recorded
- [ ] Recovery clears both flags

### Cleanup Tests
- [ ] Manual cleanup trigger works (HTTP callable)
- [ ] Hard-deletes reports >48h soft-deleted
- [ ] Soft-deletes reports >30 days old
- [ ] Batch processing succeeds
- [ ] Logs appear in Cloud Functions

### UI Tests
- [ ] Report Library responsive (mobile, tablet, desktop)
- [ ] Stage progress bars render correctly
- [ ] Recovery section appears when needed
- [ ] Translations load
- [ ] Buttons functional

---

## 🐛 Troubleshooting

### Report not appearing in Report Library
```
✓ Check: Is report status = 'draft'?
✓ Check: Is isDeleted = false?
✓ Check: Is createdBy = currentUser.uid?
✓ Check: Within 30-day expiration window?
```

### Can't recover deleted report
```
✓ Check: Is deletedAt within last 48 hours?
✓ Check: Did you try Manual Cleanup recently?
✓ Check: Is isDeleted still true in database?
```

### Cleanup function not running
```
✓ Check: Firebase Console → Functions → Logs
✓ Check: Time zone is UTC (2 AM UTC = your time?)
✓ Check: Adequate Firestore read quota
✓ Check: Cloud Function timeout not exceeded
```

### Stage data not saving
```
✓ Check: Using addStageMetadata before saving?
✓ Check: report.id set correctly?
✓ Check: Branch ID correct for permissions?
✓ Check: Firebase quota not exceeded?
```

---

## 📞 Contact & Support

### For Issues:
1. Check Cloud Functions logs: Firebase Console → Functions
2. Review browser console for errors
3. Try manual cleanup trigger to test setup
4. Check Firestore rules allow reads/writes

### For Questions:
- Full docs: `MULTI_STAGE_REPORT_WORKFLOW.md`
- Implementation: `IMPLEMENTATION_SUMMARY_MULTI_STAGE_WORKFLOW.md`
- API: This quick reference

### Configuration Changes:
Edit constants in:
- `ReportLibrary.tsx` (max drafts: 5)
- `reportCleanup.ts` (recovery: 48h, expiration: 30d)
- `useReportStage.ts` (stage labels & descriptions)

---

## 💡 Pro Tips

1. **Testing Stage Transitions**: Use `setStage()` to jump between stages
2. **Debug Progress**: Add `console.log(currentStage, stageInfo)` 
3. **Batch Cleanup**: Manual trigger useful for testing before auto-deploy
4. **Field Visibility**: Use `shouldShowField()` to conditionally render
5. **Timestamps**: All ISO 8601 for consistency across timezones

---

**Last Updated:** February 4, 2026
**Version:** 1.0
**Status:** Ready for QA Testing
