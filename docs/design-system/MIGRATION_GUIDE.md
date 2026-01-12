# Migration Guide

**Version:** 2.0  
**Last Updated:** 2025-01-31

## Overview

This guide provides step-by-step instructions for migrating existing components to the unified Material Design system.

## Migration Strategy

### Phase 1: Design Tokens (Completed)
✅ Enhanced design token system created  
✅ All tokens organized in `src/design-system/tokens/`

### Phase 2: Component Unification (Completed)
✅ Unified Button component  
✅ Unified Card component  
✅ Unified Input component  
✅ Unified StatusBadge component

### Phase 3: Color Migration (In Progress)

#### Step 1: Identify Legacy Colors

Search for legacy color usage:
```bash
# Find gray colors
grep -r "gray-\d\+" src/components

# Find blue colors (for UI elements)
grep -r "blue-\d\+" src/components
```

#### Step 2: Replace Gray with Slate

**Before:**
```typescript
<div className="bg-gray-100 text-gray-800 border-gray-200">
  Content
</div>
```

**After:**
```typescript
<div className="bg-slate-100 text-slate-800 border-slate-200">
  Content
</div>
```

#### Step 3: Replace Blue (UI) with Slate

**Before:**
```typescript
<button className="bg-blue-600 hover:bg-blue-700 text-white">
  Click Me
</button>
```

**After:**
```typescript
<button className="bg-slate-700 hover:bg-slate-800 text-white">
  Click Me
</button>
```

**Note:** Keep blue for semantic info states (e.g., info badges).

### Phase 4: Border Radius Migration

#### Replace Inconsistent Border Radius

**Before:**
```typescript
<div className="rounded-lg">  // 0.75rem
<div className="rounded-xl">  // 1rem
<div className="rounded-md">  // 0.375rem
```

**After:**
```typescript
<div className="rounded-material">  // 4px - Material Design standard
```

**Exceptions:**
- Badges: Keep `rounded-full` for pill-shaped badges
- Legacy components: Migrate gradually

### Phase 5: Shadow Migration

#### Replace Tailwind Shadows with Material Elevation

**Before:**
```typescript
<div className="shadow-sm">   // Tailwind small shadow
<div className="shadow-md">   // Tailwind medium shadow
<div className="shadow-lg">   // Tailwind large shadow
```

**After:**
```typescript
<div className="shadow-material-1">  // Material elevation 1
<div className="shadow-material-2">  // Material elevation 2
<div className="shadow-material-3">  // Material elevation 3
```

**Semantic Usage:**
```typescript
// Use semantic names from design tokens
import { shadows } from '@/design-system/tokens/shadows';

<div className={shadows.shadows.card}>           // shadow-material-2
<div className={shadows.shadows.cardHover}>     // shadow-material-3
<div className={shadows.shadows.button}>         // shadow-material-2
<div className={shadows.shadows.modal}>         // shadow-material-5
```

### Phase 6: Typography Migration

#### Use Roboto Typography Scale

**Before:**
```typescript
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
```

**After:**
```typescript
import { typography } from '@/design-system/tokens/typography';

<h1 className={typography.typography.display.large}>Heading</h1>
<p className={typography.typography.body.medium}>Body text</p>
```

### Phase 7: Spacing Migration

#### Use 8dp Grid System

**Before:**
```typescript
<div className="p-5">  // 20px - not on 8dp grid
<div className="m-3">   // 12px - not on 8dp grid
```

**After:**
```typescript
<div className="p-4">  // 16px (2dp)
<div className="p-6">  // 24px (3dp)
<div className="m-4">  // 16px (2dp)
```

**Component Spacing:**
```typescript
import { spacing } from '@/design-system/tokens/spacing';

<div className={spacing.componentSpacing.card.default}>  // p-6
<button className={spacing.componentSpacing.button.md}>  // px-4 py-2
```

## Component-Specific Migrations

### Button Migration

**Before (Legacy):**
```typescript
import { buttonStyles } from '@/utils/buttonStyles';

<button className={buttonStyles.primary.full}>
  Click Me
</button>
```

**After (Unified):**
```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Click Me</Button>
```

### Card Migration

**Before (Legacy):**
```typescript
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  Content
</div>
```

**After (Unified):**
```typescript
import { Card, CardContent } from '@/components/ui/card';

<Card>
  <CardContent>Content</CardContent>
</Card>
```

### Input Migration

**Before (Legacy):**
```typescript
import { FormField } from '@/components/FormField';

<FormField label="Email" error={errors.email}>
  <input type="email" className="border-gray-300 rounded-md" />
</FormField>
```

**After (Unified):**
```typescript
import { Input } from '@/components/ui/input';

<Input type="email" placeholder="Email" />
```

## Automated Migration Tools

### ESLint Rules (Planned)

ESLint rules will be created to detect:
- Legacy color usage (`gray-*`, `blue-*` for UI)
- Inconsistent border radius
- Legacy shadow usage
- Hardcoded spacing values

### Codemod Scripts (Planned)

Codemod scripts will be created for:
- Bulk color replacement (gray → slate)
- Border radius standardization
- Shadow migration

## Migration Checklist

For each component:

- [ ] Replace `gray-*` with `slate-*`
- [ ] Replace `blue-*` (UI) with `slate-*`
- [ ] Replace `rounded-lg/xl/md` with `rounded-material`
- [ ] Replace `shadow-sm/md/lg` with Material elevation
- [ ] Use design tokens instead of hardcoded values
- [ ] Update to use unified components (Button, Card, Input)
- [ ] Ensure proper focus states
- [ ] Add ARIA labels where needed
- [ ] Test keyboard navigation
- [ ] Verify color contrast
- [ ] Update tests

## Common Issues and Solutions

### Issue: Component uses both legacy and new styles

**Solution:** Migrate incrementally, starting with colors, then spacing, then components.

### Issue: Third-party component library conflicts

**Solution:** Override styles using design tokens, or create wrapper components.

### Issue: Brand colors needed in UI components

**Solution:** Use brand colors only for marketing pages. For UI components, use slate colors.

### Issue: Custom component doesn't fit Material Design

**Solution:** Review Material Design guidelines and adapt component to fit, or document exception.

## Testing After Migration

1. **Visual Regression:** Compare screenshots before/after
2. **Accessibility:** Run a11y checks (axe-core)
3. **Keyboard Navigation:** Test all interactive elements
4. **Color Contrast:** Verify WCAG 2.1 AA compliance
5. **Responsive:** Test on all breakpoints

## Rollback Plan

If issues arise:

1. Keep legacy components available during migration
2. Use feature flags for gradual rollout
3. Maintain backward compatibility where possible
4. Document breaking changes

## Resources

- [Design Tokens Reference](./TOKENS_REFERENCE.md)
- [Component Guidelines](./COMPONENT_GUIDELINES.md)
- [Accessibility Standards](./ACCESSIBILITY.md)
- [Material Design 3 Guidelines](https://m3.material.io/)
