# Dashboard Architecture Audit - January 31, 2026
**Solutions Architect Assessment**

---

## Executive Summary

The Portal Dashboard is functionally complete but has **3 critical issues**, **5 short-term optimization opportunities**, and **4 strategic long-term architectural improvements** that should be prioritized.

**Risk Level**: 🔴 **HIGH** for large portfolios (200+ buildings), 🟡 **MEDIUM** for 50-200 buildings, 🟢 **LOW** for <50 buildings

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. **Uncontrolled Data Fetching - Multiple API Calls Per Load**
**Location**: `PortalDashboard.tsx:82-195` (`loadDashboardData` function)

**Problem**:
- Dashboard calls **4 separate API queries** sequentially:
  1. `getBuildingsByCustomer()`
  2. `getReportsByCustomerId()` (blocker for calculations)
  3. `getServiceAgreementsByCustomer()`
  4. `getScheduledVisitsByCustomer()`
- Plus `getDashboardPreferences()` in parallel
- **Every page load triggers all 5 Firestore reads** regardless of widget visibility
- For 200+ buildings with 1000+ reports: **Heavy Firestore read costs**

**Impact**:
- ⚠️ **Cost**: Each dashboard visit = 5 Firestore reads minimum (~$0.0006 per user per load)
- ⚠️ **Performance**: Sequential loading means page can't render until ALL data loads
- ⚠️ **Scalability**: With 1000 users/month = 5000 unnecessary reads

**Recommendation**: 
- [ ] Implement query-on-demand: Load preferences first, then fetch only enabled widget data
- [ ] Add aggressive caching (IndexedDB or React Query)
- [ ] Consider single aggregated Cloud Function endpoint instead of 4 separate queries

---

### 2. **Buildings Map Re-initializes on Every Parent Re-render**
**Location**: `BuildingsMapOverview.tsx:82-260` (useEffect + setTimeout logic)

**Problem**:
- Leaflet map has complex initialization (15 setTimeout/event handlers, tile layer loading)
- **No dependency array safeguard** - hook checks `mapInstanceRef.current` but doesn't prevent re-init
- Console shows **map initializing MULTIPLE times per interaction** (seen in your logs: 8+ initializations)
- Each re-init destroys previous map instance and recreates from scratch
- Compound issue: **Dragging map in customizer triggers parent re-render** → map re-initializes

**Impact**:
- 🔥 **Memory leak potential**: Old Leaflet instances not properly cleaned up
- 🔥 **Browser stalls**: User sees janky interactions on slower devices
- 🔥 **Battery drain**: Mobile users experience rapid performance degradation

**Recommendation**:
```typescript
// Add dependency tracking
useEffect(() => {
  if (mapInstanceRef.current) return; // Explicit guard
  // ... initialization code
}, [buildings.length]); // Only reinit if building count changes

// Add cleanup
return () => {
  if (mapInstanceRef.current) {
    mapInstanceRef.current.remove();
  }
};
```

---

### 3. **Computed Statistics Run on Every Component Render**
**Location**: `PortalDashboard.tsx:198-250` (calculations)

**Problem**:
- **11 separate calculations** run synchronously on every render:
  - `statusCounts` (3x filter ops)
  - `gradeCounts` (5x filter ops)
  - `avgHealthScore` (reduce)
  - `totalCosts` (reduce over all reports)
  - `avgCostPerBuilding` (division)
  - `buildingsNeedingAttention` (filter + sort)
- **PortfolioHealthReport** does additional:
  - 5x filter for grade distribution
  - 6-month trend calculation with date parsing
  - 10-building comparison sort
  - Smart recommendations filter
- **With 1000 reports + 200 buildings** = potentially 50,000+ operations per render

**Impact**:
- 🔥 **Janky UI**: Render > 50ms on slower machines
- 🔥 **Keyboard lag**: Dashboard interactions feel sluggish
- 🔥 **Battery drain**: Mobile devices overheat

**Recommendation**:
- [ ] Memoize with `useMemo()` for all calculations
- [ ] Move PortfolioHealthReport computation to a separate memoized component
- [ ] Consider Web Worker for trend calculation (6-month analysis)

---

## 🟡 SHORT-PATH ISSUES (Fix This Sprint/Next Week)

### 4. **Disabled Widgets Still Incur Render Cost**
**Location**: `PortalDashboard.tsx:339-354` (renderWidgetContent)

**Problem**:
- Even though `getSortedEnabledWidgets()` filters, the `renderWidgetContent()` switch statement **still renders null for every disabled widget**
- React still creates component instances even if returning null
- Service Agreement Monitor and Maintenance Cost Tracker **allocate memory** even when disabled=false

**Current Cost**:
- 2 disabled widgets x 1000 users = 2000 unused component instances in memory
- When users re-enable: no caching means fresh re-computation

**Fix** (10 min):
```typescript
// Only call renderWidgetContent for enabled widgets
{getSortedEnabledWidgets().map((widgetName) => {
  const content = renderWidgetContent(widgetName);
  return content ? <div key={widgetName}>{content}</div> : null;
})}
```

---

### 5. **Health Score Calculation is Hard-coded and Non-transparent**
**Location**: `PortalDashboard.tsx:108-155`

**Problem**:
- Health score formula is embedded in component (hardcoded):
  - Freshness: 0-40 points
  - Critical Issues: 0-30 points
  - Maintenance Frequency: 0-30 points
- **Users don't understand how scores are calculated**
- **Different from chart display** (potential inconsistency)
- **Not configurable** for different business rules

**Business Impact**:
- 😕 Users confused when a building scores 65 (not obviously "C grade")
- 😕 Can't customize scoring for regional regulations
- 😕 Hard to A/B test better scoring algorithms

**Fix** (2-3 hours):
- [ ] Move to `healthScoringService.ts` with clear documentation
- [ ] Add configuration object (easily adjustable)
- [ ] Add "How is this calculated?" tooltip on dashboard
- [ ] Validate consistency with PortfolioHealthReport formulas

---

### 6. **Missing Error Boundaries for Heavy Components**
**Location**: `BuildingsMapOverview.tsx`, `PortfolioHealthReport.tsx`

**Problem**:
- Leaflet map has 12 potential failure points (tile layer load, marker creation, etc.)
- PortfolioHealthReport has no error handling for data calculations
- Single component crash crashes entire dashboard
- User sees blank page with no context

**Real Scenario**:
- Slow network → tile layer timeout → map never renders
- User stares at blank space, assumes dashboard is broken
- No error message to diagnose problem

**Fix** (1-2 hours):
```typescript
// src/components/common/ComponentErrorBoundary.tsx
class ComponentErrorBoundary extends React.Component {
  // Wraps heavy components with graceful degradation
}

// In PortalDashboard:
<ComponentErrorBoundary fallback={<MapErrorPlaceholder />}>
  <BuildingsMapOverview buildings={buildings} />
</ComponentErrorBoundary>
```

---

### 7. **Customizer State Not Persisted During Session**
**Location**: `DashboardCustomizer.tsx`, `PortalDashboard.tsx`

**Problem**:
- User opens customizer, drags widgets, clicks Save
- Save succeeds, Firestore updated, modal closes
- **But dashboard doesn't refresh** - old order still showing
- User must **refresh page** to see changes take effect
- Creates perception of "didn't work"

**Root Cause**:
- `handleSaveWidgetPreferences` updates local state BEFORE Firestore persists
- If Firestore save is slow: user sees stale UI briefly then real data
- Race condition between local state and Firestore

**Fix** (30 min):
```typescript
// In handleSaveWidgetPreferences:
setWidgets(updatedWidgets); // Optimistic update
await saveDashboardPreferences(...); // Background persist

// Better: use React Query with callbacks
onSuccess: () => queryClient.invalidateQueries(['dashboardPrefs'])
```

---

### 8. **No Pagination for "Buildings Needing Attention" List**
**Location**: `PortalDashboard.tsx:241-252`

**Problem**:
- Shows only **top 5** buildings needing attention
- But `.slice(0, 5)` is silent - no indication there are more
- User with 50 urgent buildings only sees 5
- No "Show All" link or count indicator

**UX Impact**:
- 😕 User thinks only 5 buildings need attention (false confidence)
- 😕 Can't find a specific building in the list
- 😕 Must navigate to Buildings page to see full list (extra clicks)

**Fix** (1 hour):
```typescript
// Show 5 with "View All X Buildings Needing Attention" link
// Or: Add pagination controls in the widget
// Or: Make limit configurable in preferences
```

---

## 🔵 LONG-TERM ARCHITECTURAL ISSUES (Plan for Q2 2026)

### 9. **No Real-time Updates - Stale Data Problem**
**Location**: Entire dashboard architecture

**Problem**:
- Dashboard data loaded once on mount
- If building gets inspected while user is viewing: **user won't see updated score**
- Service agreement expires: **no notification**
- Scheduled visit completed: **still shows as pending**
- **Data can be 5-30 minutes stale** depending on user behavior

**Business Impact**:
- 😠 Users make decisions on stale data
- 😠 Miss time-sensitive actions (upcoming visits expiring soon)
- 😠 Poor user experience on busy days

**Current Workaround**: Users manually refresh page (poor UX)

**Solution** (3-5 days):
- [ ] Add WebSocket listener for real-time updates
- [ ] Implement `onSnapshot()` for critical collections (agreements, visits)
- [ ] Add refresh indicator: "Data updated 2 minutes ago"
- [ ] Consider Cloud Firestore real-time sync

---

### 10. **Scalability: Component List Growing Without Limits**
**Location**: `dashboardCustomizationService.ts:20-100`

**Problem**:
- DEFAULT_WIDGETS array now has 10 items
- Plan: Add Service Agreement Monitor, Maintenance Cost Tracker
- Potential: User role-specific widgets, regional widgets, custom widgets
- **Without architecture change: dashboard becomes unmaintainable at 20+ widgets**

**Future Growth Concerns**:
- 🚀 Staff portal widgets
- 🚀 Analytics/reporting widgets
- 🚀 Integration widgets (3rd-party APIs)
- 🚀 Regional compliance widgets

**Architecture Debt**:
- Large switch statement in `renderWidgetContent()` (will hit 1000+ lines)
- Widget registry hard-coded in service
- No plugin/dynamic widget system

**Solution** (2 weeks):
- [ ] Create widget registry/manifest system
- [ ] Implement lazy-loading for widgets
- [ ] Abstract widget interface (type: React.FC<WidgetProps>)
- [ ] Support dynamic widget loading from config

```typescript
// Example: Widget-as-plugin architecture
const WIDGET_REGISTRY = {
  'buildings-map': {
    component: lazy(() => import('./widgets/BuildingsMapWidget')),
    description: '...',
    enabled: true,
  },
  // ...
};
```

---

### 11. **Health Score Algorithm Divergence**
**Location**: `PortalDashboard.tsx:108-155` vs `PortfolioHealthReport.tsx:225-270`

**Problem**:
- **Two independent health score calculations** in different files
- Main dashboard calculates per-building health in component
- PortfolioHealthReport has `calculateReportHealth()` function
- **If scoring rules change, must update both places** → inconsistency risk

**Real Risk**:
```
Dashboard shows Building A: 75 (C grade)
PortfolioHealthReport shows Building A: 82 (B grade)
User is confused 😕
```

**Solution** (1-2 hours):
- [ ] Create single `healthScoringService.ts` 
- [ ] Import in both components
- [ ] Unit test scoring logic independently
- [ ] Document scoring algorithm clearly

---

### 12. **No Analytics/Audit Trail on Dashboard Usage**
**Location**: Entire dashboard

**Problem**:
- No visibility into:
  - Which widgets users actually use (all 10 enabled by default)
  - How long users spend on dashboard
  - When they customize (personalization engagement)
  - Performance metrics per user/device

**Business Value Lost**:
- Can't optimize: Don't know which widgets matter most
- Can't debug: "Dashboard is slow" - but for whom? Which widgets?
- Can't prioritize: Should we invest in Map or Reports? No data.

**Solution** (1 week):
- [ ] Add analytics events:
  - `dashboard_view` (widget: [enabled list])
  - `widget_toggled` (widget: X, enabled: true/false)
  - `widget_reordered` (from_pos: N, to_pos: M)
- [ ] Track Core Web Vitals (LCP, CLS, FID)
- [ ] Add performance monitoring to heavy components

---

### 13. **Mobile Responsiveness Gaps**
**Location**: Entire dashboard, especially `BuildingsMapOverview`, `PortfolioHealthReport`

**Problem**:
- Charts not responsive (fixed heights, may overflow on mobile)
- Map shows fixed 400px height (not mobile-friendly)
- Customizer modal potentially unusable on small screens
- Stats cards may stack awkwardly on tablets

**Test Case**: Open dashboard on iPhone 12
- 📱 Map takes full height, user can't scroll
- 📱 Charts might be unreadable (legend wraps)
- 📱 Customizer buttons hard to tap

**Solution** (2-3 hours):
- [ ] Add responsive breakpoints to charts (ResponsiveContainer already present, needs testing)
- [ ] Map height: `max(400px, 50vh)` instead of fixed 400px
- [ ] Customizer: Modal width=95vw on mobile, proper scroll
- [ ] Test on actual devices, not just browser emulation

---

## 📊 PRIORITY MATRIX

| Issue | Priority | Effort | Impact | Timeline |
|-------|----------|--------|--------|----------|
| **Uncontrolled Data Fetching** | 🔴 CRITICAL | 6-8h | Cost savings, 5x perf | Week 1 |
| **Map Re-init Loop** | 🔴 CRITICAL | 4-6h | Stability, mobile experience | Week 1 |
| **Computed Stats Performance** | 🔴 CRITICAL | 3-4h | UI responsiveness | Week 1 |
| **Disabled Widget Render Cost** | 🟡 SHORT | 0.5h | Memory savings | Sprint Task |
| **Health Score Transparency** | 🟡 SHORT | 2-3h | UX clarity | Sprint Task |
| **Missing Error Boundaries** | 🟡 SHORT | 2-3h | Stability | Sprint Task |
| **Customizer State Persistence** | 🟡 SHORT | 1-2h | UX polish | Sprint Task |
| **Pagination for Widget Lists** | 🟡 SHORT | 1-2h | Usability | Sprint Task |
| **Real-time Updates** | 🔵 LONG | 3-5d | Data freshness, alerts | Q2 2026 |
| **Widget Scalability Architecture** | 🔵 LONG | 2w | Future growth | Q2 2026 |
| **Health Score Unification** | 🔵 LONG | 4h | Consistency | Q2 2026 |
| **Analytics/Audit Trail** | 🔵 LONG | 1w | Optimization data | Q2 2026 |
| **Mobile Responsiveness** | 🔵 LONG | 2-3h | Mobile UX | Q2 2026 |

---

## 🎯 RECOMMENDED NEXT STEPS

### **IMMEDIATE (This Week)**
1. Fix map re-initialization loop (prevent memory leak)
2. Add `useMemo()` to critical calculations
3. Implement load-on-demand for widget data

### **SHORT-TERM (Next 2 Weeks)**
1. Add error boundaries for heavy components
2. Unify health score calculations
3. Improve customizer UX (state persistence, pagination)

### **LONG-TERM (Q2)**
1. Real-time sync with Firestore listeners
2. Widget plugin architecture
3. Analytics integration
4. Mobile optimization
5. WebSocket for instant updates

---

## 📋 CODE QUALITY CHECKPOINTS

- [ ] Add `useMemo()` to all calculations
- [ ] Add component-level error boundaries
- [ ] Implement proper Leaflet cleanup in useEffect
- [ ] Move health scoring to dedicated service
- [ ] Add comprehensive error logging
- [ ] Document health score algorithm publicly
- [ ] Performance testing: 200+ buildings, 1000+ reports
- [ ] Mobile testing: iOS Safari, Android Chrome
- [ ] Accessibility: Keyboard navigation for drag-drop

---

## 🔍 TESTING RECOMMENDATIONS

```typescript
// Test scenarios for critical issues:

// 1. Large portfolio performance
const TEST_BUILDINGS = 200;
const TEST_REPORTS = 1000;
// Measure: Time to interactive, memory usage

// 2. Map memory leaks
const TOGGLE_CUSTOMIZER = 10; // Open/close customizer 10x
// Measure: Memory growth, Leaflet instance count

// 3. Calculation performance
const RENDER_ITERATIONS = 100;
// Measure: Average render time without useMemo vs with

// 4. Concurrent updates
const UPDATE_BUILDING_HEALTH = async () => {
  // Update building while user viewing dashboard
  // Expectation: Real-time refresh (future feature)
}
```

---

## 📝 SUMMARY

**The dashboard is feature-complete but has significant performance and scalability issues that will impact user experience with large portfolios.** Recommend addressing critical issues immediately, then short-term optimizations within the next sprint.

**Estimated Total Effort**: 
- 🔴 Critical fixes: 13-14 hours
- 🟡 Short-term improvements: 8-10 hours  
- 🔵 Long-term architecture: 3-4 weeks

**Expected Outcome**: 5x performance improvement, reduced Firestore costs, better mobile experience, and scalable foundation for future features.

---

**Document created**: January 31, 2026
**Reviewed by**: Solutions Architect (AI)
**Next review**: After critical fixes (Feb 7, 2026)
