# Page wheel/touch scroll recovery

Production selfie page at viewport 502×648 reproduced the reported symptom:
wheel outside the contract left `window.scrollY` at 0. `html` was the page scroller
(1115px content / 648px viewport). `body` had `overflow-y:auto` with no own overflow
(1115px content / 1115px height) and `overscroll-behavior-y:none`. It intercepted
scroll chaining before the gesture reached `html`. Dragging the root scrollbar
bypassed that intermediary, explaining why only the side bar worked.

The shared CSS now places edge overscroll behavior on `html`, leaving `body` to
forward wheel/touch gestures. Responsive sizing, contract internal overflow and
the fixed dock are preserved; no wheel listeners or forced scrolling were added.

Regression check: `pnpm exec playwright test tests/e2e/scroll-workflow.spec.ts --project=chromium`.
Before patch, student wheel check failed with received 0 versus expected >30.
After patch, five scenarios passed: student/promoter wheel, student/promoter native
touch gestures, and contract-boundary chaining to the page. Consent control stays
above the dock. These run against the built Worker with local API fixtures; the
production page is separately checked using the same real wheel gesture.
Combined scroll/student/promoter regression run: 24 checks passed in 24.1 seconds.
TypeScript check and production build also completed successfully.

Release 0.0.0-sandbox.98. Previous Worker version for rollback:
`2d302558-06eb-43aa-8c78-529ec3fea4e1`.
Rollback: `pnpm exec wrangler rollback 2d302558-06eb-43aa-8c78-529ec3fea4e1 --config wrangler.jsonc`.

Reference on containers at their scroll boundary and chaining:
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior
