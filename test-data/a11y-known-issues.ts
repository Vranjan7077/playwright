/**
 * Axe rule IDs that are currently known to fail on the live site, tracked as
 * accepted debt rather than silently ignored. Tests fail loudly on any
 * violation NOT in this list (regressions), and separately report the known
 * ones on every run so they stay visible instead of rotting in a suppressed
 * state forever.
 *
 * Remove an entry once the underlying issue is fixed - the test suite will
 * then fail if it ever comes back, which is the point.
 */
export const KNOWN_A11Y_ISSUES: readonly string[] = [
  // Found across /, /work/, /blog/, /contact/ during framework setup (2026-07-19):
  // low-contrast text/link elements against their background. Real bug, not a test artifact.
  'color-contrast',
  // Found on /blog/post/*/ pages during framework setup (2026-07-19): syntax-highlighted
  // <code> blocks are horizontally scrollable but not keyboard-focusable, so keyboard
  // users can't scroll to see content that overflows the block.
  'scrollable-region-focusable',
  // Found on /blog/post/*/ pages during framework setup (2026-07-19): elements marked
  // aria-hidden="true" (likely icon SVGs) still contain focusable descendants, which
  // AT users can tab into despite the subtree being hidden from them.
  'aria-hidden-focus',
];
