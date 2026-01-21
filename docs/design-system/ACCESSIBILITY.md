# Accessibility Standards

**Version:** 2.0  
**Last Updated:** 2025-01-31

## Overview

This document outlines accessibility standards and best practices for the unified Material Design system. All components must meet WCAG 2.1 AA compliance.

## WCAG 2.1 AA Requirements

### Color Contrast

- **Normal Text:** Minimum 4.5:1 contrast ratio
- **Large Text (18pt+ or 14pt+ bold):** Minimum 3:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio

**Examples:**

- ✅ `text-slate-900` on `bg-white` = 15.8:1 (pass)
- ✅ `text-slate-700` on `bg-white` = 10.2:1 (pass)
- ✅ `text-white` on `bg-slate-700` = 10.2:1 (pass)
- ❌ `text-slate-400` on `bg-white` = 3.1:1 (fail for normal text)

### Focus Indicators

All interactive elements must have visible focus indicators:

- **Minimum width:** 2px
- **Color:** Must contrast with background (3:1 minimum)
- **Style:** Ring or outline

**Implementation:**

```typescript
import { getFocusRing } from '@/design-system/utilities/accessibility';

<button className={getFocusRing('slate')}>
  Click Me
</button>
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

- **Tab order:** Logical and intuitive
- **Focus management:** Proper focus trapping in modals
- **Keyboard shortcuts:** Documented and consistent

### Screen Reader Support

- **ARIA labels:** Use for icon-only buttons
- **ARIA descriptions:** Use for help text
- **ARIA states:** Use for form validation
- **Semantic HTML:** Use proper HTML elements

## Component Accessibility

### Button

**Requirements:**

- Visible focus indicator
- Proper ARIA labels for icon-only buttons
- Disabled state clearly indicated

**Example:**

```typescript
<Button aria-label="Close dialog">
  <XIcon />
</Button>
```

### Input

**Requirements:**

- Associated label (visible or via `aria-label`)
- Error messages linked via `aria-describedby`
- `aria-invalid` for error states

**Example:**

```typescript
<Input
  id="email"
  aria-label="Email address"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" role="alert">
    Invalid email address
  </p>
)}
```

### Card

**Requirements:**

- Proper heading hierarchy
- Semantic HTML structure

**Example:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>  {/* h2 or h3 */}
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Status Badge

**Requirements:**

- Color not the only indicator (use text/icon)
- Proper contrast ratios

**Example:**

```typescript
<StatusBadge status="completed" label="Completed" icon={CheckIcon} />
```

## Accessibility Utilities

### Focus Ring

```typescript
import { getFocusRing } from '@/design-system/utilities/accessibility';

// Default (slate)
getFocusRing('slate'); // 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2'

// Error state
getFocusRing('red'); // 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
```

### Form Field Attributes

```typescript
import { getFormFieldAttributes } from '@/design-system/utilities/accessibility';

const attributes = getFormFieldAttributes('email-field', hasError, hasHelp);
// Returns: { 'aria-invalid': true/false, 'aria-describedby': 'email-field-error' }
```

### Screen Reader Only

```typescript
import { srOnly } from '@/design-system/utilities/accessibility';

<span className={srOnly()}>Screen reader only text</span>
```

## Testing Accessibility

### Automated Testing

**Tools:**

- [axe-core](https://github.com/dequelabs/axe-core) - Automated accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Accessibility audits

**Example:**

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

**Keyboard Navigation:**

1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test Enter/Space on buttons
4. Test Escape to close modals
5. Test arrow keys in menus

**Screen Reader Testing:**

1. Test with NVDA (Windows) or VoiceOver (Mac)
2. Verify all content is announced
3. Verify form labels are read
4. Verify error messages are announced

**Color Contrast:**

1. Use browser DevTools to check contrast ratios
2. Test with color blindness simulators
3. Verify text is readable on all backgrounds

## Common Issues and Solutions

### Issue: Low contrast text

**Solution:** Use darker text colors (slate-700, slate-800, slate-900) on light backgrounds.

### Issue: Missing focus indicators

**Solution:** Add `getFocusRing()` utility to all interactive elements.

### Issue: Icon-only buttons without labels

**Solution:** Add `aria-label` prop to buttons.

### Issue: Form fields without labels

**Solution:** Add visible labels or `aria-label` attributes.

### Issue: Color-only status indicators

**Solution:** Add text labels or icons in addition to color.

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
