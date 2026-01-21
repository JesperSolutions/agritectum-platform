# Design Alignment Audit Report

**Date:** 2025-01-27  
**Reference:** Scheduled Visits Page Design  
**Status:** In Progress

## Executive Summary

This audit aligns the entire codebase with the reference design from the Scheduled Visits page, which demonstrates key design principles:

- Clear, bold section titles and subtitles
- Tabbed filters with active state styling (`bg-slate-700`)
- Card-based layouts with consistent padding, shadows, and rounded corners
- Consistent icon + label patterns for metadata
- Standardized date/time formatting (`MM/DD/YYYY at HH:mm`)
- Clear content hierarchy within cards
- Uniform typography and spacing
- Tag-style status indicators (blue badge for scheduled)

## Completed Work

### 1. Shared Components Created

#### `FilterTabs.tsx`

- Standardized filter button component
- Active state: `bg-slate-700 text-white`
- Inactive state: `bg-slate-100 text-slate-700 hover:bg-slate-200`
- Location: `src/components/shared/filters/FilterTabs.tsx`

#### `StatusBadge.tsx`

- Standardized status badge component
- Supports multiple status variants (scheduled, completed, cancelled, etc.)
- Consistent color mapping
- Location: `src/components/shared/badges/StatusBadge.tsx`

#### `IconLabel.tsx`

- Icon + label pattern for card metadata
- Consistent spacing and typography
- Location: `src/components/shared/layouts/IconLabel.tsx`

#### `ListCard.tsx`

- Standardized card component
- Styling: `bg-white rounded-lg shadow p-6 border border-slate-200`
- Hover effect: `hover:shadow-lg transition-shadow`
- Location: `src/components/shared/cards/ListCard.tsx`

#### `PageHeader.tsx`

- Standardized page headers
- Title: `text-3xl font-bold text-gray-900`
- Subtitle: `mt-2 text-gray-600`
- Location: `src/components/shared/layouts/PageHeader.tsx`

### 2. Date Formatter Utility

#### `formatDateTime()`

- Format: `MM/DD/YYYY at HH:mm` (e.g., "1/7/2026 at 09:00")
- Handles Firestore Timestamps, ISO strings, and Date objects
- Location: `src/utils/dateFormatter.ts`

#### `formatDate()`

- Format: `MM/DD/YYYY` (e.g., "1/7/2026")
- Location: `src/utils/dateFormatter.ts`

### 3. Components Aligned

#### ✅ ScheduledVisitsList

- Uses shared components (`FilterTabs`, `StatusBadge`, `IconLabel`, `ListCard`, `PageHeader`)
- Standardized filter buttons
- Consistent card layout
- MM/DD/YYYY at HH:mm date format
- Status badges standardized
- Icon + label pattern for metadata

#### ✅ ServiceAgreementsList

- Uses shared components
- Standardized filter tabs
- Consistent card layout
- Standardized date formatting
- Status badges standardized

#### ✅ BuildingsList

- Uses shared components (`ListCard`, `PageHeader`, `IconLabel`)
- Standardized card styling
- Consistent button colors (`bg-slate-700`)
- Icon + label pattern

#### ✅ OffersList

- Uses shared components (`StatusBadge`, `ListCard`)
- Standardized filter buttons (`bg-slate-700` for active)
- Consistent card layout
- Status badges standardized

## Remaining Work

### Components Needing Alignment

#### ⏳ AllReports (`src/components/reports/AllReports.tsx`)

- **Issues:**
  - Filter buttons use custom styling (`bg-slate-200` for active, should be `bg-slate-700`)
  - Status badges use inline styles
  - Date formatting inconsistent
  - Card layouts need standardization
- **Action:** Replace filter buttons with `FilterTabs`, use `StatusBadge`, standardize cards

#### ⏳ SchedulePage (`src/components/schedule/SchedulePage.tsx`)

- **Issues:**
  - Complex filter system needs standardization
  - Status badges need standardization
  - Date formatting inconsistent
- **Action:** Standardize filters, use `StatusBadge`, standardize date formatting

#### ⏳ ReportView (`src/components/ReportView.tsx`)

- **Issues:**
  - Status badges use inline `getStatusColor()` function
  - Should use `StatusBadge` component
- **Action:** Replace inline status badges with `StatusBadge`

#### ⏳ OfferList (`src/components/offers/OfferList.tsx`)

- **Issues:**
  - Filter buttons use `bg-blue-600` (should be `bg-slate-700`)
  - Uses table layout instead of cards
- **Action:** Standardize filter buttons, consider card layout

### Standardization Tasks

#### ⏳ Filter Button Standardization

- Replace all instances of:
  - `bg-green-600` → `bg-slate-700`
  - `bg-blue-600` → `bg-slate-700`
  - Custom filter button implementations → `FilterTabs` component
- **Files to update:**
  - `src/components/reports/AllReports.tsx`
  - `src/components/schedule/SchedulePage.tsx`
  - `src/components/offers/OfferList.tsx`

#### ⏳ Status Badge Standardization

- Replace all inline status badge implementations with `StatusBadge` component
- **Files to update:**
  - `src/components/ReportView.tsx`
  - `src/components/reports/AllReports.tsx`
  - `src/components/schedule/SchedulePage.tsx`
  - `src/components/admin/CustomerManagement.tsx`
  - `src/components/admin/ServiceAgreements.tsx`

#### ⏳ Date Formatting Standardization

- Replace all `toLocaleDateString()` calls with `formatDateTime()` or `formatDate()`
- **Files to update:**
  - `src/components/reports/AllReports.tsx`
  - `src/components/schedule/SchedulePage.tsx`
  - `src/components/portal/PortalDashboard.tsx`
  - All other components using date formatting

#### ⏳ Card Layout Standardization

- Replace all custom card implementations with `ListCard` component
- Ensure consistent:
  - Padding: `p-6`
  - Border: `border border-slate-200`
  - Shadow: `shadow` with `hover:shadow-lg`
  - Border radius: `rounded-lg`

## Inconsistencies Found

### 1. Filter Button Styling

- **Issue:** Multiple active state colors used
- **Found in:**
  - `bg-green-600` (ScheduledVisitsList, ServiceAgreementsList) - ✅ Fixed
  - `bg-blue-600` (OfferList, OffersList) - ⏳ Partially fixed
  - `bg-slate-200` (AllReports) - ⏳ Needs fixing
- **Standard:** `bg-slate-700 text-white` for active state

### 2. Status Badge Styling

- **Issue:** Multiple implementations with different styles
- **Found in:**
  - Inline styles with varying padding (`px-2 py-1` vs `px-3 py-1`)
  - Inconsistent colors
  - Different border radius (`rounded` vs `rounded-full`)
- **Standard:** Use `StatusBadge` component

### 3. Card Styling

- **Issue:** Inconsistent card implementations
- **Found in:**
  - Mixed `rounded-lg` vs `rounded-xl` vs `rounded-2xl`
  - Mixed `border-gray-200` vs `border-slate-200`
  - Inconsistent padding (`p-5` vs `p-6`)
  - Inconsistent shadows
- **Standard:** Use `ListCard` component

### 4. Date Formatting

- **Issue:** Multiple date formatting approaches
- **Found in:**
  - `toLocaleDateString()` (locale-dependent)
  - Swedish format utilities (`formatSwedishDate`)
  - Inconsistent time formatting
- **Standard:** Use `formatDateTime()` for MM/DD/YYYY at HH:mm

### 5. Typography Hierarchy

- **Issue:** Inconsistent title/subtitle sizes
- **Found in:**
  - Mixed `text-2xl` vs `text-3xl` for titles
  - Inconsistent label/value styling
- **Standard:** Use `PageHeader` component

## Translation Keys Added

### Common

- `common.filters.all` - "All" / "Alla"
- `common.filters.upcoming` - "Upcoming" / "Kommande"
- `common.filters.past` - "Past" / "Tidigare"

### Schedule

- `schedule.visits.subtitle` - "View scheduled roofer visits for your buildings"
- `schedule.visits.noVisits` - "No scheduled visits found"
- `schedule.visits.dateTime` - "Date & Time"
- `schedule.visits.location` - "Location"
- `schedule.visits.inspector` - "Inspector"

## Metrics

- **Shared Components Created:** 5
- **Components Aligned:** 4
- **Components Remaining:** 4+
- **Translation Keys Added:** 8
- **Date Formatter Functions:** 2

## Next Steps

1. **Priority 1:** Standardize AllReports component (high visibility)
2. **Priority 2:** Standardize SchedulePage filters
3. **Priority 3:** Replace all inline status badges with `StatusBadge`
4. **Priority 4:** Standardize all date formatting
5. **Priority 5:** Replace all custom cards with `ListCard`

## Notes

- All shared components are fully typed with TypeScript
- Components follow the design system tokens where applicable
- Translation keys follow the hierarchical pattern (`feature.section.element`)
- Date formatter handles Firestore Timestamps, ISO strings, and Date objects
- All changes maintain backward compatibility where possible
