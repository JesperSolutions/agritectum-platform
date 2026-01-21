# Design System

This directory contains the centralized design system for the Agritectum Platform application.

## Overview

The design system provides:

- **Design Tokens**: Colors, spacing, typography, shadows, borders, motion
- **Component Patterns**: Standardized class name patterns for common UI elements
- **Utilities**: Helper functions for working with design tokens, accessibility, and responsive design

## Structure

```
src/design-system/
├── tokens/
│   ├── colors.ts          # Unified slate color palette
│   ├── typography.ts      # Roboto typography scale
│   ├── spacing.ts         # 8dp grid system
│   ├── shadows.ts          # Material elevation system
│   ├── borders.ts         # Border radius and width tokens
│   ├── motion.ts          # Transition timing and easing
│   └── index.ts           # Centralized exports
├── utilities/
│   ├── accessibility.ts  # A11y helper functions
│   ├── responsive.ts      # Breakpoint utilities
│   ├── theme.ts           # Theme utilities
│   └── index.ts           # Centralized exports
├── tokens.ts              # Legacy tokens (deprecated - use tokens/ directory)
├── components.ts          # Component class name patterns
├── utilities.ts           # Legacy utilities (deprecated - use utilities/ directory)
└── README.md             # This file
```

## Usage

### Importing Tokens

```typescript
// New unified token system (recommended)
import { colors, typography, spacing, shadows, borders, motion } from '@/design-system/tokens';

// Or import from specific token files
import { colors } from '@/design-system/tokens/colors';
import { typography } from '@/design-system/tokens/typography';

// Use in component
<div className={`${colors.card.bg} ${colors.card.border} ${shadows.shadows.card}`}>
  <p className={colors.text.primary}>Content</p>
</div>
```

### Using Component Patterns

```typescript
import { getButtonClasses, getCardClasses } from '@/design-system/components';

// Button
<button className={getButtonClasses('primary')}>
  Click Me
</button>

// Card
<div className={getCardClasses('main')}>
  Card content
</div>
```

### Using Utilities

```typescript
import { getStatusBadgeClass, getFormInputClass } from '@/design-system/utilities';

// Status badge
<span className={getStatusBadgeClass('completed')}>
  Completed
</span>

// Form input
<input
  className={getFormInputClass(hasError, isDisabled)}
  type="text"
/>
```

## Design Tokens

### Colors

**UI Colors (Slate):**

- `colors.ui.background.*` - Background colors
- `colors.ui.border.*` - Border colors
- `colors.ui.text.*` - Text colors

**Semantic Colors:**

- `colors.semantic.success.*` - Success states
- `colors.semantic.error.*` - Error states
- `colors.semantic.warning.*` - Warning states
- `colors.semantic.info.*` - Info states

**Button Colors:**

- `colors.button.primary.*` - Primary buttons
- `colors.button.secondary.*` - Secondary buttons
- `colors.button.danger.*` - Danger buttons
- `colors.button.ghost.*` - Ghost buttons

### Spacing

- `spacing.card.padding.*` - Card padding variants
- `spacing.button.padding.*` - Button padding variants
- `spacing.input.padding` - Input padding

### Border Radius

- `borderRadius.button` - Button radius (rounded-lg)
- `borderRadius.input` - Input radius (rounded-lg)
- `borderRadius.card` - Card radius (rounded-xl)
- `borderRadius.badge` - Badge radius (rounded-full)

### Shadows

- `shadows.card` - Card shadow (shadow-sm)
- `shadows.cardHover` - Card hover shadow (hover:shadow-md)
- `shadows.button` - Button shadow (shadow-sm)
- `shadows.modal` - Modal shadow (shadow-lg)

## Component Patterns

### Buttons

```typescript
import { buttonVariants } from '@/design-system/components';

// Primary button
<button className={buttonVariants.primary}>Save</button>

// Secondary button
<button className={buttonVariants.secondary}>Cancel</button>

// Danger button
<button className={buttonVariants.danger}>Delete</button>

// Ghost button
<button className={buttonVariants.ghost}>Skip</button>
```

### Cards

```typescript
import { cardVariants } from '@/design-system/components';

// Main card
<div className={cardVariants.main}>Content</div>

// Inner card
<div className={cardVariants.inner}>Nested content</div>

// Compact card
<div className={cardVariants.compact}>Compact content</div>
```

### Form Inputs

```typescript
import { inputVariants } from '@/design-system/components';

// Default input
<input className={inputVariants.default} type="text" />

// Error input
<input className={inputVariants.error} type="text" />

// Disabled input
<input className={inputVariants.disabled} type="text" disabled />
```

### Status Badges

```typescript
import { badgeVariants } from '@/design-system/components';

<span className={badgeVariants.success}>Success</span>
<span className={badgeVariants.error}>Error</span>
<span className={badgeVariants.warning}>Warning</span>
<span className={badgeVariants.info}>Info</span>
```

## Migration Guide

### Migrating from Legacy Colors

Use the utility function to migrate gray colors to slate:

```typescript
import { migrateGrayToSlate } from '@/design-system/utilities';

const oldClass = 'bg-gray-100 text-gray-800';
const newClass = migrateGrayToSlate(oldClass); // 'bg-slate-100 text-slate-800'
```

### Migrating from Inline Styles

Replace inline button styles:

```typescript
// Before
<button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
  Click
</button>

// After
import { getButtonClasses } from '@/design-system/components';
<button className={getButtonClasses('primary')}>
  Click
</button>
```

## Best Practices

1. **Always use design tokens** - Don't hardcode colors, spacing, or other values
2. **Use unified components** - Use Button, Card, Input from `src/components/ui/`
3. **Material Design first** - Follow Material Design 3 specifications
4. **Slate colors only** - Use slate colors for UI (brand colors for marketing only)
5. **8dp grid system** - Use 8dp increments for all spacing
6. **4dp border radius** - Use `rounded-material` (4px) for all interactive elements
7. **Accessibility first** - Ensure WCAG 2.1 AA compliance

## Documentation

- [Design Tokens Reference](../../docs/design-system/TOKENS_REFERENCE.md)
- [Component Guidelines](../../docs/design-system/COMPONENT_GUIDELINES.md)
- [Migration Guide](../../docs/design-system/MIGRATION_GUIDE.md)
- [Accessibility Standards](../../docs/design-system/ACCESSIBILITY.md)

## Migration Status

- ✅ Design token system enhanced
- ✅ Unified Button component
- ✅ Unified Card component
- ✅ Unified Input component
- ✅ Unified StatusBadge component
- ⏳ Color migration (gray-_ → slate-_) - In progress
- ⏳ Border radius standardization - In progress
- ⏳ Shadow migration - In progress

## Future Enhancements

- TypeScript types for design tokens
- Storybook integration
- Visual regression testing
- Design token validation
- Automated migration tools
