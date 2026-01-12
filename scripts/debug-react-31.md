# Debugging React #31 Error

## Current Status
The error is occurring in PRODUCTION with OLD code. The fixes haven't been deployed yet.

## Steps to Fix

### 1. Build and Deploy New Code
```bash
npm run build
firebase deploy --only hosting
```

### 2. Clear All Caches
**In Browser DevTools:**
- Application → Service Workers → Unregister (for all workers)
- Application → Storage → "Clear site data" 
- Hard reload: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

**Or use incognito/private window** to test with fresh cache

### 3. Check Source Maps
With source maps enabled, the error should show actual file names and line numbers instead of minified code. Look for:
- Actual component names in stack trace
- File paths like `src/routing/...` instead of `router-Dbrn-4I7.js`

### 4. If Error Persists After Deploy

Check the browser console for the FULL stack trace with source maps. Look for:
- Which route is causing the error
- Which component is being rendered incorrectly
- The exact file and line number

### 5. Common Patterns to Search

If error persists, search codebase for:
```bash
# Find component objects used without JSX
grep -r "element:\s*[A-Z][a-zA-Z]*[^<]" src/routing
grep -r "return\s\+[A-Z][a-zA-Z]*\s*$" src/components
```

## What We Fixed
1. ✅ Service worker duplicate registration (App.tsx + useServiceWorker hook)
2. ✅ Service worker caching strategy (network-first)
3. ✅ Source maps enabled for production
4. ✅ All route configurations verified (all use JSX correctly)

## Next Steps
1. **Deploy the fixes** - rebuild and deploy to Firebase
2. **Test in fresh browser** - incognito window or cleared cache
3. **Check console** - with source maps, find the actual component causing the issue
4. **Report back** - if error persists, provide the new stack trace with source map info
