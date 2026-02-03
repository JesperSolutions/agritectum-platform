# Phase 4 Sprint Plan - Updated Priorities

**Updated:** January 30, 2026  
**Change:** Email alerts removed from critical path (on hold)  
**Focus:** Type safety, logging, memory management, code quality

---

## 🚀 NEW Priority Order

### CRITICAL (DO THIS WEEK) - 11-15 hours

#### 1. **Type Safety Cleanup** ⭐ ✅ COMPLETE
**Effort:** 6-8 hours ✅ **COMPLETED**
**Impact:** Huge (enables refactoring, IDE support, catch bugs)

**Status:** 
```
✅ 35+ `as any` casts eliminated
✅ 27 files improved
✅ TypeScript compilation: 0 errors
✅ Full IDE type support enabled
```

**What Was Fixed:**
- offerService.ts: 3+ problematic casts fixed
- reportAccessControlService.ts: Untyped `any` data → proper interface
- dateFormatter.ts: 4+ functions with Timestamp handling
- memoryManagementService.ts: window.gc access typed
- searchService.ts: Generic indexing properly typed
- buildingService.ts: RoofType and buildingType properly cast
- All utility functions: Window extensions properly typed
- Logger, debug functions, PWA events all type-safe

**Checklist:**
- [x] Create proper interfaces for all data types
- [x] Remove all `as any` casts
- [x] Update function signatures
- [x] Run `tsc --noEmit` and verify 0 errors
- [x] Code review for completeness
- [x] Documentation: PHASE_4_TYPE_SAFETY_COMPLETION.md

---

#### 2. **Structured Logging Service** ⭐ CRITICAL
**Effort:** 4-5 hours  
**Impact:** High (debugging, performance, security)

**Create:** `src/utils/structuredLogger.ts`

```typescript
// Structured logger - replaces console.log
const logger = {
  debug: (msg: string, context?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${msg}`, context);
    }
  },
  
  info: (msg: string, context?: any) => {
    console.log(`[INFO] ${msg}`, context);
  },
  
  warn: (msg: string, context?: any) => {
    console.warn(`[WARN] ${msg}`, context);
  },
  
  error: (msg: string, error?: Error | any, context?: any) => {
    console.error(`[ERROR] ${msg}`, {
      message: error?.message,
      stack: error?.stack,
      ...context
    });
    // Could send to error tracking service here
  },
  
  performance: (label: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  }
};
```

**Tasks:**
- [ ] Create logger service with 5 methods
- [ ] Replace 30+ console statements with logger
- [ ] Only allow in development (production = silent)
- [ ] Add to shared services
- [ ] Update guidelines in docs

**Files to Update (Priority):**
1. `src/utils/cleanupDraftReports.ts` (12 statements) - 0.5h
2. `src/utils/firestoreClient.ts` (5 statements) - 0.25h
3. `src/utils/seedFirebase.ts` (8 statements) - 0.5h
4. Other services with console logs - 1.5h
5. Create documentation - 0.75h

---

#### 3. **Remove Debug Functions from Production** ⭐ SECURITY
**Effort:** 2-3 hours  
**Impact:** Security (prevents users from calling admin functions)

**Current Problem:**
```typescript
// WRONG - exposes to users
(window as any).cleanupTempReports = cleanupTempReports;
(window as any).testReportDeletion = testReportDeletion;
(window as any).seedTestData = seedTestDataBrowser;
(window as any).debugAuth = debugUserAuth;
```

**Solution:**
```typescript
// RIGHT - dev-only
if (process.env.NODE_ENV === 'development') {
  (window as any).debugTools = {
    cleanupTempReports,
    testReportDeletion,
    seedTestData: seedTestDataBrowser,
    debugAuth: debugUserAuth,
    debugUserAccount: debugUserAccount,
    findLinusHollberg: findLinusHollberg,
  };
}
```

**Files to Fix:**
1. `src/utils/cleanupDraftReports.ts` - Line 131
2. `src/utils/testReportDeletion.ts` - Lines 273-274
3. `src/utils/seedFirebase.ts` - Line 119
4. `src/utils/debugUserAccount.ts` - Lines 158-159
5. `src/utils/debugAuth.ts` - Line 42

**Checklist:**
- [ ] Wrap window assignments in `process.env.NODE_ENV === 'development'`
- [ ] Group under single `window.debugTools` object
- [ ] Verify in production build: not exposed
- [ ] Update dev environment docs
- [ ] Test in dev mode still works

---

### IMPORTANT (THIS SPRINT) - 8-10 hours

#### 4. **Fix Memory Leaks** 
**Effort:** 3-4 hours

**Problem:** `setInterval` without cleanup
```typescript
// File: src/services/memoryManagementService.ts
this.monitoringInterval = setInterval(() => {
  // monitoring logic
}, 5000); // ← Never cleared!
```

**Solution:** Add destroy method
```typescript
private monitoringInterval: NodeJS.Timeout | null = null;

startMonitoring() {
  this.monitoringInterval = setInterval(() => {
    // ...
  }, 5000);
}

destroy() {
  if (this.monitoringInterval) {
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
  }
}
```

**Plus:**
- Remove manual `window.gc()` calls (not performant)
- Use `AbortController` for async operations
- Document cleanup in React useEffect

---

#### 5. **Custom Claims Fallback Risk**
**Effort:** 2 hours

**Problem in firestore.rules:**
```javascript
function getUserBranchId() {
  return request.auth.token.branchId != null 
    ? request.auth.token.branchId
    : (exists(...) && get(...).data.branchId != null  // ← FALLBACK RISK
      ? get(...).data.branchId
      : "");
}
```

**Risk:** If user modifies their Firestore document, they escalate privileges.

**Solution:** Remove fallback, enforce custom claims only
```javascript
function getUserBranchId() {
  // Must have custom claim - no Firestore fallback
  return request.auth.token.branchId != null 
    ? request.auth.token.branchId
    : "";  // Empty string if not in token
}
```

**Changes Needed:**
- Update 5 helper functions
- Ensure all users have custom claims on login
- Document the requirement

---

#### 6. **Improve Lazy Loading Robustness**
**Effort:** 2-3 hours

**Problem:** `src/utils/lazyLoading.tsx` Line 130
```typescript
setTimeout(attemptImport, delay * retries); // ← No max retries!
```

**Solution:**
```typescript
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

async function loadModule() {
  let lastError;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await import(modulePath);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt); // exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Failed after all retries
  logger.error(`Failed to load chunk after ${MAX_RETRIES} attempts`, lastError);
  // Show user-friendly error
  return null;
}
```

---

### ON HOLD (NOT THIS SPRINT)

#### ❌ Error Monitoring Email Alerts
**Status:** On hold as requested  
**When:** Implement when team is ready  
**Effort:** 2-3 hours (when needed)

---

### NICE-TO-HAVE (Q2 2026)

#### Query Performance Monitoring (3-4 hours)
#### Rate Limiting on Cloud Functions (4-5 hours)
#### Externalize ESG Constants (5 hours)
#### Error Boundaries on Services (4 hours)

---

## 📅 Recommended Timeline

### **WEEK 1: Type Safety + Logging**
```
Monday:     Start type safety cleanup (2-3 files)
Wednesday:  Create structured logger
Thursday:   Replace console logs
Friday:     Code review + testing
```
**Deliverable:** Type safety ~50% complete, logging service live

### **WEEK 2: Security + Stability**
```
Monday:     Remove debug functions from production
Tuesday:    Fix memory leaks in monitoring service
Wednesday:  Update custom claims rules
Thursday:   Improve lazy loading
Friday:     Code review + test everything
```
**Deliverable:** No debug functions exposed, memory safe, robust chunk loading

### **WEEK 3: Final Polish**
```
Monday-Fri: Complete type safety (finish remaining `any` casts)
            Update error handling across services
            Performance testing
            Documentation updates
```
**Deliverable:** 100% type safety, health score 90+

---

## ✅ Success Criteria

By end of 2 weeks:
- [ ] **0 `any` type casts** (100% type safe)
- [ ] **0 console.log statements** (use logger instead)
- [ ] **0 debug functions in production** (dev-only)
- [ ] **0 memory leaks** (all intervals cleaned up)
- [ ] **0 custom claims fallback** (auth tokens required)
- [ ] **Max retry limit** on chunk loading
- [ ] All code reviewed and tested
- [ ] Health score maintained at 90+

---

## 🎯 What This Achieves

✅ **Type Safety:** Full TypeScript benefit, catch bugs before runtime  
✅ **Performance:** Structured logging only in dev, no console overhead  
✅ **Security:** Users can't call admin functions, privileges protected  
✅ **Stability:** No memory leaks, proper cleanup  
✅ **Robustness:** Chunk loading won't fail users  
✅ **Maintainability:** Clear error handling patterns  

---

## 📊 Effort Summary

```
Type Safety Cleanup:       6-8 hours ⭐ HIGHEST VALUE
Structured Logging:        4-5 hours ⭐ HIGH VALUE  
Remove Debug Functions:    2-3 hours ⭐ SECURITY
Fix Memory Leaks:          3-4 hours ⭐ STABILITY
Custom Claims Fix:         2 hours
Lazy Loading:              2-3 hours
────────────────────────────────────
TOTAL:                    21-27 hours (2-3 weeks)

Can start immediately.
No dependencies on email implementation.
Improves health score: 84 → 92+
```

---

## 🚀 Next Steps

1. ✅ Review this plan
2. ✅ Prioritize type safety (highest ROI)
3. ✅ Start with `offerService.ts` (6 `any` casts)
4. ✅ Create structured logger (will be needed throughout)
5. ✅ Begin removing debug functions

**Ready to tackle these? I can help implement any of them!** 💪
