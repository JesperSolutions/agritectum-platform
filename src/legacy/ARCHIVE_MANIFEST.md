# Legacy Code Archive Manifest

Generated: 2025-01-11  
Purpose: Track all code moved to legacy directories  
Status: Active inventory

## Overview

This manifest documents all code moved to the `src/legacy/` directory for reference and historical context. Code in legacy directories should not be used in new implementations but is kept for:
- Reference and historical context
- Potential rollback if needed
- Migration documentation
- Understanding code evolution

## Components

### OriginalDashboard.tsx
- **Moved from:** `src/components/Dashboard.tsx` (lines 41-611)
- **Moved date:** 2025-01-11
- **Reason:** Unused OriginalDashboard implementation replaced by SmartDashboard
- **Status:** Not exported, kept in Dashboard.tsx but not used
- **Migration:** Use SmartDashboard from `src/components/dashboards/SmartDashboard.tsx`
- **Location:** `src/legacy/components/OriginalDashboard.tsx`

### OptimizedDashboard.tsx
- **Moved from:** `src/components/OptimizedDashboard.tsx`
- **Moved date:** 2025-01-11
- **Reason:** Not imported or used anywhere in the codebase
- **Status:** Unused alternate implementation
- **Migration:** Use SmartDashboard from `src/components/dashboards/SmartDashboard.tsx`
- **Location:** `src/legacy/components/OptimizedDashboard.tsx`

### AddressWithMap.tsx
- **Moved from:** `src/components/AddressWithMap.tsx`
- **Moved date:** 2025-01-11
- **Reason:** Replaced by AddressWithMapV2.tsx using Leaflet.js instead of Google Maps
- **Status:** Not imported anywhere, marked as deprecated in code comments
- **Migration:** Use AddressWithMapV2 from `src/components/AddressWithMapV2.tsx`
- **Location:** `src/legacy/components/AddressWithMap.tsx`

### AddressMapPreview.tsx
- **Moved from:** `src/components/AddressMapPreview.tsx`
- **Moved date:** 2025-01-11
- **Reason:** Not currently used in the application, marked as deprecated
- **Status:** Unused component
- **Migration:** Use AddressWithMapV2 from `src/components/AddressWithMapV2.tsx`
- **Location:** `src/legacy/components/AddressMapPreview.tsx`

## Services

### emailService.ts (Marked as Legacy Wrapper)
- **Location:** `src/services/emailService.ts` (kept in place for backward compatibility)
- **Marked date:** 2025-01-11
- **Reason:** Legacy wrapper that exports to triggerEmailService.ts
- **Status:** Kept for backward compatibility, re-exports from triggerEmailService
- **Migration:** Import directly from `./triggerEmailService` instead of `./emailService`

### generateEnhancedReportPDF (Deprecated Function)
- **Location:** `src/services/simplePdfService.ts` (function marked as deprecated)
- **Marked date:** 2025-01-11
- **Reason:** Legacy compatibility function, replaced by generateReportPDF
- **Status:** Deprecated but kept for backward compatibility
- **Migration:** Use `generateReportPDF(reportId, options)` instead

## Legacy Patterns

### Router.tsx (Re-export Wrapper)
- **Location:** `src/Router.tsx`
- **Status:** Minimal wrapper that re-exports from `./routing`
- **Reason:** Legacy pattern from before modular router migration
- **Note:** Still used, but considered a legacy wrapper pattern. Actual router in `src/routing/index.tsx`

## Design System

### utilities.ts vs utilities/
- **Status:** Both currently used
- **utilities.ts:** Contains utility functions (getStatusBadgeClass, etc.)
- **utilities/:** Contains modular utilities (accessibility, responsive, theme)
- **Note:** Not moved - both serve different purposes. Monitor for future consolidation.

### tokens.ts vs tokens/
- **Status:** Both currently used
- **tokens.ts:** Contains flat token definitions
- **tokens/:** Contains modular token exports
- **Note:** Not moved - both serve different purposes. Monitor for future consolidation.

## Import Reference

If you need to reference legacy code:

```typescript
// DO NOT USE in new code - for reference only
import OriginalDashboard from '../legacy/components/OriginalDashboard';
import OptimizedDashboard from '../legacy/components/OptimizedDashboard';
import AddressWithMap from '../legacy/components/AddressWithMap';
```

## Migration Guidelines

1. **Check this manifest** before referencing legacy code
2. **Use the migration path** listed for each item
3. **Do not import from legacy/** in new code
4. **Update imports** if you find references to legacy code
5. **Document new migrations** in this manifest when archiving new code

## Statistics

- **Components archived:** 4
- **Services marked as legacy:** 2
- **Legacy patterns identified:** 1
- **Total files moved:** 4

## Last Updated

2025-01-11 - Initial manifest creation
