---
description: 'Audit a component or page for WCAG 2.2 AA compliance.'
mode: 'A11y'
---

Audit `${file}` (or the component named `${input:target}`) against WCAG 2.2 AA.

Produce a report grouped by WCAG success criterion. For each finding include:
- WCAG SC (e.g. 1.4.3 Contrast, 2.1.1 Keyboard, 4.1.2 Name/Role/Value).
- Severity: BLOCKER / MAJOR / MINOR / NIT.
- File:line reference.
- Concrete remediation snippet using existing primitives (`AccessibleButton`, `AccessibleModal`, `FormField`, etc.) where possible.

Then summarize:
- Keyboard traversal order.
- Focus management for any modal/overlay.
- Color contrast checks for text and interactive states.
- Screen reader announcement behavior for async updates and errors.

Do not change code in this pass — output findings only.
