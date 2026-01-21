# Currency Configuration Migration Guide

## Overview

The platform now supports **branch-specific currency configuration** for reports. This means each branch can have its own currency (DKK, SEK, EUR, NOK, USD, etc.), and public reports will display costs in the appropriate currency.

**Date**: January 20, 2026  
**Impact**: Public report display, report PDF generation, cost estimates

## Changes Made

### 1. Added `currency` Field to Branch Type

**File**: [src/types/index.ts](src/types/index.ts#L110)

```typescript
export interface Branch {
  // ... existing fields ...
  country: string;
  // NEW: Currency configuration for this branch
  currency?: string; // Currency code (e.g., 'DKK', 'SEK', 'EUR', 'NOK')
}
```

### 2. Updated PublicReportView

**File**: [src/components/reports/PublicReportView.tsx](src/components/reports/PublicReportView.tsx)

- Now loads branch currency when displaying public reports
- Intelligently falls back to country-based currency if not explicitly set
- All cost estimates show correct currency symbol

### 3. Created Branch Currency Utilities

**File**: [src/utils/branchCurrency.ts](src/utils/branchCurrency.ts)

Provides helper functions:

- `getCurrencyFromCountry()` - Map country name/code to currency
- `getCurrencyFromLocale()` - Map locale to currency
- `determineBranchCurrency()` - Determine best currency for branch
- `formatBranchCurrency()` - Format amounts with currency
- `isValidCurrencyCode()` - Validate currency codes

## Supported Currencies

- **DKK** - Danish Krone (Denmark)
- **SEK** - Swedish Krona (Sweden)
- **NOK** - Norwegian Krone (Norway)
- **EUR** - Euro (Germany, Finland, etc.)
- **USD** - US Dollar (USA)
- **CAD** - Canadian Dollar (Canada)
- **GBP** - British Pound (UK)
- **CHF** - Swiss Franc (Switzerland)

## Currency Determination Logic

For public report displays:

1. **If branch.currency is set** → Use explicit currency
2. **Else if branch.country is set** → Derive from country mapping
3. **Else** → Default to SEK

This ensures:

- Explicit control when needed (via admin panel)
- Automatic detection from existing country data
- Safe fallback to SEK

## Migration Instructions

### For Existing Branches

No action required! The system works automatically:

1. Branches with existing `country` field will automatically show correct currency
2. Optional: Set explicit `currency` field in Firestore for manual override

### For Admin Panel (if implementing UI)

Add a "Currency" dropdown field to branch edit form:

```typescript
<select value={branch.currency || determineBranchCurrency(undefined, branch.country)}>
  {supportedCurrencies.map(curr => (
    <option key={curr.code} value={curr.code}>
      {curr.name} ({curr.code})
    </option>
  ))}
</select>
```

### For Manual Firestore Update

If you need to set explicit currencies:

```javascript
// For a specific branch
db.collection('branches').doc('branch-id').update({
  currency: 'DKK', // or 'SEK', 'EUR', etc.
});

// Or leave empty to auto-detect from country
```

## Testing the Changes

### 1. Verify Public Reports Show Correct Currency

**Steps**:

1. Create a report in a Danish branch
2. Generate public/shared link
3. View in public mode
4. Check cost estimates display DKK (not SEK)

### 2. Test Fallback Logic

**Steps**:

1. Check a report from Swedish branch shows SEK
2. Check a report from German branch shows EUR
3. Check a report with no currency/country shows SEK (default)

### 3. Test PDF Generation

**Steps**:

1. Print/export report to PDF
2. Verify currency displays correctly
3. Check all cost fields use proper currency

## Backward Compatibility

✅ **Fully backward compatible**

- Existing branches without `currency` field work automatically
- Country field is used for automatic currency detection
- Default fallback to SEK if no country specified
- No data migration needed

## Code Examples

### Using in Components

```typescript
import { determineBranchCurrency, formatBranchCurrency } from '../../utils/branchCurrency';

// In your component
const currency = determineBranchCurrency(branch.currency, branch.country);
const formatted = formatBranchCurrency(amount, currency);
```

### Using in Services

```typescript
import { getCurrencyFromCountry } from '../../utils/branchCurrency';

const currency = getCurrencyFromCountry(branch.country);
```

## Currency in Different Contexts

### 1. Public Reports (Implemented ✅)

- Shows branch's currency
- Falls back to country-based currency
- User sees correct symbol and formatting

### 2. PDF Export (Implemented ✅)

- Inherits currency from public report display
- Prints with correct currency symbol

### 3. Cost Estimates (Uses branch currency)

- Labor, material, travel, overhead all in branch currency
- Maintains consistency across report

### 4. Offers/Quotes (Could be extended)

- Could use branch currency for consistency
- Already has `currency` field in Offer type

## Future Enhancements

1. **Admin Panel UI**
   - Add currency selector to branch management
   - Show auto-detected vs. explicit currency
   - Add currency validation

2. **Multi-currency Reports**
   - Allow conversion between currencies
   - Store exchange rates
   - Display both local and reference currency

3. **Currency Formatting**
   - Localized number formatting per country
   - Symbol placement (before/after number)
   - Custom decimal separators

4. **Analytics & Reports**
   - Currency-aware totals
   - Multi-currency summaries
   - Exchange rate tracking

## Troubleshooting

### Currency Shows as "SEK" for Danish Branch

**Cause**: Branch doesn't have `currency` set and country mapping not working

**Solution**:

1. Check branch has `country` field set (e.g., "Denmark" or "DK")
2. Or explicitly set `currency: 'DKK'` in Firestore

### Invalid Currency Code Error

**Cause**: Currency code not in supported list

**Solution**:

1. Use one of supported currencies: DKK, SEK, NOK, EUR, USD, CAD, GBP, CHF
2. Add new currency to `branchCurrency.ts` if needed

### PDF Shows Wrong Currency

**Cause**: PDF uses old hardcoded SEK value

**Solution**:

1. Clear browser cache
2. Ensure branch has currency/country set
3. Regenerate PDF

## Files Changed

- ✅ [src/types/index.ts](src/types/index.ts) - Added `currency` field to Branch
- ✅ [src/components/reports/PublicReportView.tsx](src/components/reports/PublicReportView.tsx) - Implemented currency detection and display
- ✅ [src/utils/branchCurrency.ts](src/utils/branchCurrency.ts) - Created utility functions

## Related Documentation

- See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)
- Currency utilities documentation in code comments

---

**Status**: Complete ✅  
**Breaking Changes**: None  
**Data Migration Required**: No  
**Admin Action Required**: No (Optional: set explicit currencies)
