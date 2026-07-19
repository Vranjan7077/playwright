import type { TestInfo } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';
import { expect } from '@playwright/test';
import { KNOWN_A11Y_ISSUES } from '../test-data/a11y-known-issues';

function formatViolations(violations: Result[]): string {
  return violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.length} node(s): ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' '))
          .join(', ')}${v.helpUrl ? `\n  ${v.helpUrl}` : ''}`,
    )
    .join('\n\n');
}

/**
 * Fails the test on any violation not already tracked in KNOWN_A11Y_ISSUES,
 * and attaches the known ones to the report so they stay visible instead of
 * being silently swallowed.
 */
export async function expectNoUnexpectedViolations(
  results: AxeResults,
  testInfo: TestInfo,
): Promise<void> {
  const unexpected = results.violations.filter((v) => !KNOWN_A11Y_ISSUES.includes(v.id));
  const known = results.violations.filter((v) => KNOWN_A11Y_ISSUES.includes(v.id));

  if (known.length > 0) {
    await testInfo.attach('known-accessibility-debt', {
      body: formatViolations(known),
      contentType: 'text/plain',
    });
  }

  expect(unexpected, formatViolations(unexpected)).toEqual([]);
}
