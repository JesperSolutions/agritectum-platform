---
description: 'Investigate an emulator or production issue and propose a fix.'
mode: 'Debug'
---

Issue: ${input:description}

Environment: ${input:env|emulator|test|prod}

Investigate using the Debug Mode method:
1. Reproduce (state exact steps, expected vs. actual).
2. Localize to minimal file/function.
3. List 1–3 ranked hypotheses.
4. Verify with evidence (logs, rules simulator, types, or a targeted test).
5. Propose the minimal fix as a diff.
6. Add or adjust a test that would have caught the bug.

Required artifacts in the answer:
- Root cause in one sentence.
- File:line evidence.
- Fix diff.
- Regression test reference.
