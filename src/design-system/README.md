# Design System

This directory contains the centralized design system for the Agritectum Platform application.

## Overview

The design system provides:
- **Design Tokens**: Colors, spacing, typography, shadows, etc.
- **Component Patterns**: Standardized class name patterns for common UI elements
- **Utilities**: Helper functions for working with design tokens

## Structure

```
src/design-system/
├── tokens.ts          # Design tokens (colors, spacing, etc.)
├── components.ts      # Component class name patterns
├── utilities.ts       # Utility functions
└── README.md         # This file
```

## Usage

### Importing Tokens

```typescript
import { colors, spacing, borderRadius } from '@/design-system/tokens';

// Use in component
<div className={colors.ui.background.card}>
  <p className={colors.ui.text.primary}>Content</p>
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

1. **Always use design tokens** - Don't hardcode colors or spacing
2. **Use component patterns** - Use standardized class patterns for consistency
3. **Leverage utilities** - Use utility functions for dynamic styling
4. **Follow naming conventions** - Use semantic names (primary, secondary, etc.)
5. **Document exceptions** - If you need to deviate, document why

## Exceptions

Some components use Material Design patterns (e.g., `SchedulePage.tsx`). These are acceptable exceptions and should be documented. The design system supports both Tailwind and Material Design patterns.

## Future Enhancements

- TypeScript types for design tokens
- Storybook integration
- Visual regression testing
- Design token validation
- Automated migration tools
