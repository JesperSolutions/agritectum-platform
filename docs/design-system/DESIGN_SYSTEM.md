# Design System Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-31

---

## Overview

The Agritectum Platform design system provides a consistent foundation for building user interfaces. It includes design tokens, component patterns, and utilities to ensure visual and functional consistency across the application.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Component Patterns](#component-patterns)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Shadows & Borders](#shadows--borders)
7. [Usage Guidelines](#usage-guidelines)
8. [Migration Guide](#migration-guide)

---

## Design Tokens

Design tokens are the foundational values that define our design system. They are located in `src/design-system/tokens.ts`.

### Importing Tokens

```typescript
import { colors, spacing, borderRadius, shadows } from '@/design-system/tokens';
```

---

## Color System

### UI Colors (Slate)

The primary color palette uses **slate** colors for all UI elements:

- **Backgrounds:**
  - Page: `bg-gradient-to-br from-slate-50 to-slate-100`
  - Cards: `bg-white`
  - Inner cards: `bg-slate-50`
  - Nested elements: `bg-slate-100`

- **Borders:**
  - Cards: `border border-slate-200`
  - Inputs: `border border-slate-300`
  - Focus: `border-slate-500`

- **Text:**
  - Primary: `text-slate-900`
  - Secondary: `text-slate-600`
  - Tertiary: `text-slate-500`
  - Muted: `text-slate-400`

### Semantic Colors

Semantic colors are used for status indicators and alerts:

- **Success:** `bg-green-100 text-green-800`
- **Error:** `bg-red-100 text-red-800`
- **Warning:** `bg-yellow-100 text-yellow-800`
- **Info:** `bg-blue-100 text-blue-800`
- **Purple (Custom):** `bg-purple-100 text-purple-800`

### Button Colors

- **Primary:** `bg-slate-700 text-white hover:bg-slate-800`
- **Secondary:** `border border-slate-200 text-slate-700 bg-white hover:bg-slate-50`
- **Danger:** `bg-red-600 text-white hover:bg-red-700`
- **Ghost:** `text-slate-700 hover:bg-slate-100`

---

## Typography

### Headings

- **H1:** `text-3xl font-bold text-slate-900`
- **H2:** `text-2xl font-bold text-slate-900`
- **H3:** `text-xl font-semibold text-slate-900`
- **H4:** `text-lg font-semibold text-slate-900`

### Body Text

- **Primary:** `text-base text-slate-900`
- **Secondary:** `text-sm text-slate-600`
- **Tertiary:** `text-xs text-slate-500`

### Labels

- **Default:** `block text-sm font-medium text-slate-700 mb-2`
- **Required:** `block text-sm font-medium text-slate-700 mb-2 after:content-["*"] after:ml-0.5 after:text-red-500`

---

## Spacing

### Card Padding

- **Main cards:** `p-6`
- **Inner cards:** `p-4`
- **Compact cards:** `p-3`

### Button Padding

- **Default:** `px-4 py-2`
- **Small:** `px-3 py-1.5`
- **Large:** `px-6 py-3`

### Input Padding

- **Default:** `px-3 py-2`

---

## Shadows & Borders

### Shadows

- **Cards:** `shadow-sm`
- **Card hover:** `hover:shadow-md`
- **Buttons:** `shadow-sm`
- **Modals:** `shadow-lg`

### Border Radius

- **Buttons/Inputs:** `rounded-lg` (8px)
- **Cards:** `rounded-xl` (12px)
- **Badges:** `rounded-full`
- **Material Design:** `rounded-material` (4px) - for Material-specific components

---

## Component Patterns

### Buttons

```typescript
import { getButtonClasses } from '@/design-system/components';

// Primary button
<button className={getButtonClasses('primary')}>
  Save
</button>

// Secondary button
<button className={getButtonClasses('secondary')}>
  Cancel
</button>

// Danger button
<button className={getButtonClasses('danger')}>
  Delete
</button>
```

### Cards

```typescript
import { getCardClasses } from '@/design-system/components';

// Main card
<div className={getCardClasses('main')}>
  Content
</div>

// Inner card
<div className={getCardClasses('inner')}>
  Nested content
</div>
```

### Form Inputs

```typescript
import { getFormInputClass } from '@/design-system/utilities';

// Default input
<input className={getFormInputClass()} type="text" />

// Error input
<input className={getFormInputClass(true)} type="text" />

// Disabled input
<input className={getFormInputClass(false, true)} type="text" disabled />
```

### Status Badges

```typescript
import { getStatusBadgeClass } from '@/design-system/utilities';

<span className={getStatusBadgeClass('completed')}>
  Completed
</span>
```

---

## Usage Guidelines

### 1. Always Use Design Tokens

❌ **Don't:**

```typescript
<div className="bg-gray-100 text-gray-800">
```

✅ **Do:**

```typescript
import { colors } from '@/design-system/tokens';
<div className={colors.ui.background.inner}>
```

### 2. Use Component Patterns

❌ **Don't:**

```typescript
<button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
```

✅ **Do:**

```typescript
import { getButtonClasses } from '@/design-system/components';
<button className={getButtonClasses('primary')}>
```

### 3. Consistent Border Radius

- Buttons and inputs: `rounded-lg`
- Cards: `rounded-xl`
- Badges: `rounded-full`

### 4. Consistent Focus States

All form inputs should use:

```typescript
focus:ring-2 focus:ring-slate-500 focus:border-slate-500
```

---

## Migration Guide

### Migrating from Gray to Slate

Use the utility function:

```typescript
import { migrateGrayToSlate } from '@/design-system/utilities';

const oldClass = 'bg-gray-100 text-gray-800';
const newClass = migrateGrayToSlate(oldClass);
// Result: 'bg-slate-100 text-slate-800'
```

### Migrating Focus States

Replace `focus:ring-blue-500` with `focus:ring-slate-500`:

```typescript
// Before
<input className="focus:ring-blue-500" />

// After
<input className="focus:ring-slate-500 focus:border-slate-500" />
```

---

## Exceptions

Some components use Material Design patterns (e.g., `SchedulePage.tsx`). These are acceptable exceptions and should be documented. The design system supports both Tailwind and Material Design patterns.

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:

- Text on backgrounds: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio

### Focus States

All interactive elements have visible focus states:

- Form inputs: `focus:ring-2 focus:ring-slate-500`
- Buttons: Visible hover and focus states

---

## Future Enhancements

- TypeScript types for design tokens
- Storybook integration
- Visual regression testing
- Design token validation
- Automated migration tools

---

**For implementation details, see:** `src/design-system/README.md`
