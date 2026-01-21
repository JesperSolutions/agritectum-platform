# Component Guidelines

**Version:** 2.0  
**Last Updated:** 2025-01-31

## Overview

This document provides guidelines for using and creating components in the unified Material Design system.

## Core Principles

1. **Material Design 3 Foundation** - All components follow Material Design 3 specifications
2. **Slate Color Palette** - Exclusive use of slate colors for UI (brand colors reserved for marketing)
3. **8dp Grid System** - All spacing based on 8dp increments
4. **4dp Border Radius** - Standard `rounded-material` (4px) for all interactive elements
5. **Material Elevation** - 6-level shadow system
6. **Roboto Typography** - Single font family with standardized scale
7. **Accessibility First** - WCAG 2.1 AA compliance built into all components

## Unified Components

### Button

**Location:** `src/components/ui/button.tsx`

**Variants:**

- `default` - Primary button (slate-700 background)
- `destructive` - Danger button (red-600 background)
- `outline` - Outlined button (white background, slate border)
- `secondary` - Secondary button (white background, slate border)
- `ghost` - Ghost button (transparent background)
- `link` - Link button (text only with underline)

**Sizes:**

- `sm` - Small (h-8, px-3, text-xs)
- `default` - Default (h-10, px-4, text-sm)
- `lg` - Large (h-12, px-6, text-base)
- `icon` - Icon only (h-10, w-10)

**Usage:**

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default" size="default">Click Me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Skip</Button>
<Button variant="link">Learn More</Button>
```

**Do's:**

- ✅ Use `default` variant for primary actions
- ✅ Use `destructive` for destructive actions
- ✅ Use `outline` or `secondary` for secondary actions
- ✅ Use `ghost` for tertiary actions
- ✅ Use `link` for text-only actions

**Don'ts:**

- ❌ Don't use brand colors (orange, blue) for UI buttons
- ❌ Don't use custom border radius (always use `rounded-material`)
- ❌ Don't use custom shadows (use Material elevation system)

### Card

**Location:** `src/components/ui/card.tsx`

**Variants:**

- `elevated` (default) - Card with shadow-material-2, hover to shadow-material-3
- `outlined` - Card with border only, no shadow
- `filled` - Card with slate-50 background

**Usage:**

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
  <CardFooter>
    Card footer
  </CardFooter>
</Card>
```

**Do's:**

- ✅ Use `Card` for all card containers
- ✅ Use `CardHeader`, `CardContent`, `CardFooter` for structure
- ✅ Use `CardTitle` and `CardDescription` for headers

**Don'ts:**

- ❌ Don't use custom card implementations
- ❌ Don't use `rounded-lg` or `rounded-xl` (use `rounded-material`)
- ❌ Don't use custom shadows (use Material elevation)

### Input

**Location:** `src/components/ui/input.tsx`

**Features:**

- Material Design styling
- 4dp border radius
- Material elevation on focus
- Slate color scheme
- Proper focus states

**Usage:**

```typescript
import { Input } from '@/components/ui/input';

<Input type="text" placeholder="Enter text" />
<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Enter password" />
```

**Do's:**

- ✅ Use `Input` for all text inputs
- ✅ Use proper `type` attributes
- ✅ Use `placeholder` for hints

**Don'ts:**

- ❌ Don't use legacy `FormField` or `ValidatedInput` components
- ❌ Don't use custom border radius
- ❌ Don't use gray or blue colors

### Status Badge

**Location:** `src/components/shared/badges/StatusBadge.tsx`

**Variants:**

- `scheduled` - Blue badge
- `in_progress` - Yellow badge
- `completed` - Green badge
- `cancelled` - Red badge
- `pending` - Yellow badge
- `accepted` - Green badge
- `rejected` - Red badge

**Usage:**

```typescript
import StatusBadge from '@/components/shared/badges/StatusBadge';

<StatusBadge status="completed" label="Completed" />
<StatusBadge status="pending" />
```

**Do's:**

- ✅ Use semantic status values
- ✅ Provide `label` prop for custom labels
- ✅ Use icons when appropriate

**Don'ts:**

- ❌ Don't use custom colors
- ❌ Don't use custom border radius (always `rounded-full`)

## Creating New Components

### Component Structure

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { colors } from '@/design-system/tokens/colors';
import { shadows } from '@/design-system/tokens/shadows';
import { borders } from '@/design-system/tokens/borders';
import { spacing } from '@/design-system/tokens/spacing';
import { motion } from '@/design-system/tokens/motion';

interface MyComponentProps {
  // Props here
  className?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({
  className,
  // Other props
}) => {
  return (
    <div
      className={cn(
        // Use design tokens
        borders.componentRadius.card,
        colors.card.bg,
        colors.card.border,
        shadows.shadows.card,
        spacing.componentSpacing.card.default,
        motion.componentTransitions.card,
        className
      )}
    >
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### Design Token Usage

1. **Colors:** Always use `colors` from design tokens
2. **Spacing:** Use `spacing.componentSpacing` for component-specific spacing
3. **Shadows:** Use `shadows.shadows` for semantic shadow names
4. **Borders:** Use `borders.componentRadius` for border radius
5. **Motion:** Use `motion.componentTransitions` for transitions

### Accessibility Requirements

1. **Focus States:** All interactive elements must have visible focus indicators
2. **ARIA Labels:** Use proper ARIA attributes
3. **Keyboard Navigation:** All interactive elements must be keyboard accessible
4. **Color Contrast:** Ensure WCAG 2.1 AA compliance (4.5:1 for text, 3:1 for UI)

### Example: Creating a New Card Variant

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { colors } from '@/design-system/tokens/colors';
import { shadows } from '@/design-system/tokens/shadows';
import { borders } from '@/design-system/tokens/borders';
import { spacing } from '@/design-system/tokens/spacing';
import { motion } from '@/design-system/tokens/motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  className,
}) => {
  return (
    <div
      className={cn(
        borders.componentRadius.card,
        colors.card.bg,
        colors.card.border,
        shadows.shadows.card,
        spacing.componentSpacing.card.default,
        motion.componentTransitions.card,
        'hover:shadow-material-3',
        className
      )}
    >
      <p className={colors.text.secondary}>{title}</p>
      <p className={colors.text.primary}>{value}</p>
    </div>
  );
};

export default MetricCard;
```

## Migration Checklist

When migrating existing components:

- [ ] Replace `gray-*` colors with `slate-*`
- [ ] Replace `blue-*` colors (for UI) with `slate-*`
- [ ] Replace `rounded-lg/xl/md` with `rounded-material`
- [ ] Replace `shadow-sm/md/lg` with Material elevation system
- [ ] Use design tokens instead of hardcoded values
- [ ] Ensure proper focus states
- [ ] Add ARIA labels where needed
- [ ] Test keyboard navigation
- [ ] Verify color contrast

## Common Patterns

### Card with Hover Effect

```typescript
<div
  className={cn(
    'rounded-material border border-slate-200 bg-white shadow-material-2 p-6 transition-shadow duration-material hover:shadow-material-3 cursor-pointer'
  )}
>
  Content
</div>
```

### Button with Loading State

```typescript
<Button disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

### Input with Error State

```typescript
<Input
  className={hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}
  aria-invalid={hasError}
/>
```

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Design Tokens Reference](./TOKENS_REFERENCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Accessibility Standards](./ACCESSIBILITY.md)
