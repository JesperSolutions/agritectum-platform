# Design Tokens Reference

**Version:** 2.0  
**Last Updated:** 2025-01-31

## Overview

This document provides a complete reference for all design tokens in the unified Material Design system. All tokens are located in `src/design-system/tokens/`.

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Shadows](#shadows)
5. [Borders](#borders)
6. [Motion](#motion)

---

## Colors

**Location:** `src/design-system/tokens/colors.ts`

### Slate Color Palette (Primary UI Colors)

All UI components use the slate color palette. Brand colors (orange, blue, yellow) are reserved for marketing pages only.

```typescript
import { colors } from '@/design-system/tokens/colors';

// Slate colors (50-900)
colors.slate[50]   // 'slate-50'
colors.slate[100]  // 'slate-100'
// ... through 900
```

### UI Background Colors

```typescript
colors.backgrounds.page          // 'bg-gradient-to-br from-slate-50 to-slate-100'
colors.backgrounds.card           // 'bg-white'
colors.backgrounds.cardElevated   // 'bg-white'
colors.backgrounds.cardFilled     // 'bg-slate-50'
colors.backgrounds.nested         // 'bg-slate-100'
```

### UI Border Colors

```typescript
colors.borders.default  // 'border-slate-200'
colors.borders.input    // 'border-slate-300'
colors.borders.focus    // 'border-slate-500'
colors.borders.error    // 'border-red-500'
```

### UI Text Colors

```typescript
colors.text.primary    // 'text-slate-900'
colors.text.secondary  // 'text-slate-600'
colors.text.tertiary   // 'text-slate-500'
colors.text.muted      // 'text-slate-400'
colors.text.disabled   // 'text-slate-400'
colors.text.inverse    // 'text-white'
```

### Semantic Colors

```typescript
colors.semantic.success.bg    // 'bg-green-100'
colors.semantic.success.text   // 'text-green-800'
colors.semantic.success.badge  // 'bg-green-100 text-green-800'
colors.semantic.error.bg       // 'bg-red-100'
colors.semantic.warning.bg     // 'bg-yellow-100'
colors.semantic.info.bg        // 'bg-blue-100'
```

### Button Colors

```typescript
colors.button.primary.bg      // 'bg-slate-700'
colors.button.primary.bgHover // 'hover:bg-slate-800'
colors.button.primary.text    // 'text-white'
colors.button.secondary.bg    // 'bg-white'
colors.button.danger.bg       // 'bg-red-600'
colors.button.ghost.bg         // 'bg-transparent'
```

---

## Typography

**Location:** `src/design-system/tokens/typography.ts`

### Font Family

```typescript
import { typography } from '@/design-system/tokens/typography';

typography.fontFamily.sans  // ['Roboto', 'system-ui', '-apple-system', 'sans-serif']
typography.fontFamily.mono  // ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace']
```

### Font Weights

```typescript
typography.fontWeight.light     // 'font-light' (300)
typography.fontWeight.regular    // 'font-normal' (400)
typography.fontWeight.medium    // 'font-medium' (500)
typography.fontWeight.semibold  // 'font-semibold' (600)
typography.fontWeight.bold      // 'font-bold' (700)
```

### Typography Scale

#### Display (Large Headings)

```typescript
typography.typography.display.large   // 'text-5xl font-light text-slate-900' (48px)
typography.typography.display.medium  // 'text-4xl font-light text-slate-900' (36px)
typography.typography.display.small    // 'text-3xl font-light text-slate-900' (32px)
```

#### Headline (Section Headings)

```typescript
typography.typography.headline.large   // 'text-3xl font-normal text-slate-900' (32px)
typography.typography.headline.medium  // 'text-2xl font-normal text-slate-900' (28px)
typography.typography.headline.small   // 'text-xl font-normal text-slate-900' (24px)
```

#### Title (Card Titles, List Items)

```typescript
typography.typography.title.large   // 'text-xl font-medium text-slate-900' (20px)
typography.typography.title.medium // 'text-base font-medium text-slate-900' (16px)
typography.typography.title.small   // 'text-sm font-medium text-slate-900' (14px)
```

#### Body (Main Content)

```typescript
typography.typography.body.large   // 'text-base font-normal text-slate-900' (16px)
typography.typography.body.medium  // 'text-sm font-normal text-slate-900' (14px)
typography.typography.body.small   // 'text-xs font-normal text-slate-900' (12px)
```

#### Label (Form Labels, Buttons)

```typescript
typography.typography.label.large   // 'text-sm font-medium text-slate-700' (14px)
typography.typography.label.medium  // 'text-xs font-medium text-slate-700' (12px)
typography.typography.label.small   // 'text-[11px] font-medium text-slate-700' (11px)
```

### Form Labels

```typescript
typography.label.default   // 'block text-sm font-medium text-slate-700 mb-2'
typography.label.required  // 'block text-sm font-medium text-slate-700 mb-2 after:content-["*"] after:ml-0.5 after:text-red-500'
typography.label.error     // 'block text-sm font-medium text-red-700 mb-2'
```

---

## Spacing

**Location:** `src/design-system/tokens/spacing.ts`

### Base Unit

The design system uses an 8dp grid system where `0.5rem = 8px = 1dp`.

```typescript
import { spacing } from '@/design-system/tokens/spacing';

spacing.baseUnit  // 0.5 (rem)
```

### Spacing Scale

```typescript
spacing.spacing.xs    // '0.5rem' (8px / 1dp)
spacing.spacing.sm    // '1rem' (16px / 2dp)
spacing.spacing.md    // '1.5rem' (24px / 3dp)
spacing.spacing.lg    // '2rem' (32px / 4dp)
spacing.spacing.xl    // '3rem' (48px / 6dp)
spacing.spacing['2xl'] // '4rem' (64px / 8dp)
spacing.spacing['3xl'] // '6rem' (96px / 12dp)
```

### Component Spacing

```typescript
// Button Padding
spacing.componentSpacing.button.sm  // 'px-3 py-1.5' (12px x 6px)
spacing.componentSpacing.button.md  // 'px-4 py-2' (16px x 8px)
spacing.componentSpacing.button.lg  // 'px-6 py-3' (24px x 12px)

// Input Padding
spacing.componentSpacing.input.default // 'px-3 py-2.5' (12px x 10px)
spacing.componentSpacing.input.sm     // 'px-2 py-1.5' (8px x 6px)
spacing.componentSpacing.input.lg     // 'px-4 py-3' (16px x 12px)

// Card Padding
spacing.componentSpacing.card.compact  // 'p-4' (16px / 2dp)
spacing.componentSpacing.card.default  // 'p-6' (24px / 3dp)
spacing.componentSpacing.card.spacious // 'p-8' (32px / 4dp)
```

---

## Shadows

**Location:** `src/design-system/tokens/shadows.ts`

### Material Design Elevation Levels

```typescript
import { shadows } from '@/design-system/tokens/shadows';

shadows.elevation.level1  // 'shadow-material-1' (Subtle elevation)
shadows.elevation.level2  // 'shadow-material-2' (Default card elevation)
shadows.elevation.level3  // 'shadow-material-3' (Hover state, raised cards)
shadows.elevation.level4  // 'shadow-material-4' (Dropdowns, popovers)
shadows.elevation.level5  // 'shadow-material-5' (Modals, dialogs)
shadows.elevation.level6  // 'shadow-material-6' (Tooltips, notifications)
```

### Semantic Shadow Names

```typescript
shadows.shadows.surface      // 'shadow-material-1'
shadows.shadows.surfaceHover // 'shadow-material-2'
shadows.shadows.card         // 'shadow-material-2'
shadows.shadows.cardHover    // 'shadow-material-3'
shadows.shadows.button       // 'shadow-material-2'
shadows.shadows.buttonHover  // 'shadow-material-3'
shadows.shadows.input        // 'shadow-material-1'
shadows.shadows.inputFocus   // 'shadow-material-2'
shadows.shadows.dropdown     // 'shadow-material-4'
shadows.shadows.modal        // 'shadow-material-5'
shadows.shadows.tooltip      // 'shadow-material-6'
```

---

## Borders

**Location:** `src/design-system/tokens/borders.ts`

### Border Radius

```typescript
import { borders } from '@/design-system/tokens/borders';

borders.borderRadius.material  // 'rounded-material' (4px) - Standard for all interactive elements
borders.borderRadius.full     // 'rounded-full' (50%) - For badges, avatars
borders.borderRadius.none      // 'rounded-none'
```

### Component-Specific Border Radius

```typescript
borders.componentRadius.interactive  // 'rounded-material' (4px) - Buttons, inputs
borders.componentRadius.card          // 'rounded-material' (4px) - Cards
borders.componentRadius.badge         // 'rounded-full' (50%) - Badge pills
borders.componentRadius.chip          // 'rounded-material' (4px) - Badge chips
borders.componentRadius.modal         // 'rounded-material' (4px) - Modals
```

### Border Width

```typescript
borders.borderWidth.none   // 'border-0'
borders.borderWidth.thin    // 'border' (1px)
borders.borderWidth.medium  // 'border-2' (2px)
borders.borderWidth.thick   // 'border-4' (4px)
```

---

## Motion

**Location:** `src/design-system/tokens/motion.ts`

### Transition Duration

```typescript
import { motion } from '@/design-system/tokens/motion';

motion.duration.instant  // 'duration-0' (0ms)
motion.duration.fast     // 'duration-150' (150ms)
motion.duration.material // 'duration-material' (250ms) - Material Design standard
motion.duration.default  // 'duration-200' (200ms)
motion.duration.slow     // 'duration-300' (300ms)
motion.duration.slower   // 'duration-500' (500ms)
```

### Transition Properties

```typescript
motion.transition.colors     // 'transition-colors duration-material'
motion.transition.all         // 'transition-all duration-material'
motion.transition.opacity     // 'transition-opacity duration-material'
motion.transition.transform   // 'transition-transform duration-material'
motion.transition.shadow      // 'transition-shadow duration-material'
```

### Component Transitions

```typescript
motion.componentTransitions.button  // 'transition-all duration-material'
motion.componentTransitions.card   // 'transition-shadow duration-material'
motion.componentTransitions.input  // 'transition-all duration-material'
motion.componentTransitions.modal  // 'transition-all duration-material'
```

---

## Usage Examples

### Using Colors

```typescript
import { colors } from '@/design-system/tokens/colors';

// Button with primary color
<button className={`${colors.button.primary.bg} ${colors.button.primary.text} ${colors.button.primary.bgHover}`}>
  Click Me
</button>

// Card with slate colors
<div className={`${colors.card.bg} ${colors.card.border} ${colors.text.primary}`}>
  Content
</div>
```

### Using Typography

```typescript
import { typography } from '@/design-system/tokens/typography';

<h1 className={typography.typography.display.large}>Large Heading</h1>
<p className={typography.typography.body.medium}>Body text</p>
<label className={typography.label.default}>Form Label</label>
```

### Using Spacing

```typescript
import { spacing } from '@/design-system/tokens/spacing';

<div className={spacing.componentSpacing.card.default}>
  Card content with standard padding
</div>
```

### Using Shadows

```typescript
import { shadows } from '@/design-system/tokens/shadows';

<div className={`${shadows.shadows.card} hover:${shadows.shadows.cardHover}`}>
  Card with elevation
</div>
```

### Using All Tokens Together

```typescript
import { colors, shadows, borders, spacing, motion } from '@/design-system/tokens';

<div
  className={`
    ${borders.componentRadius.card}
    ${colors.card.bg}
    ${colors.card.border}
    ${shadows.shadows.card}
    ${spacing.componentSpacing.card.default}
    ${motion.componentTransitions.card}
    hover:${shadows.shadows.cardHover}
  `}
>
  Unified Material Design Card
</div>
```

---

## Migration Notes

- **Legacy colors:** Replace `gray-*` with `slate-*`, replace `blue-*` (for UI) with `slate-*`
- **Legacy border radius:** Replace `rounded-lg`, `rounded-xl`, `rounded-md` with `rounded-material` for interactive elements
- **Legacy shadows:** Replace `shadow-sm`, `shadow-md`, `shadow-lg` with Material elevation system
- **Legacy spacing:** Use 8dp grid system (0.5rem base unit)

---

## Best Practices

1. **Always use design tokens** - Don't hardcode colors, spacing, or other values
2. **Use semantic names** - Prefer `shadows.shadows.card` over `shadows.elevation.level2`
3. **Import from tokens** - Use `import { colors } from '@/design-system/tokens/colors'`
4. **Consistent spacing** - Use component spacing tokens for buttons, inputs, cards
5. **Material Design first** - Use Material Design standards (4dp radius, 250ms transitions, etc.)
