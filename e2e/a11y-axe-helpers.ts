import {AxeBuilder} from '@axe-core/playwright';
import {expect, type Page} from '@playwright/test';
import type {Result, RunResults} from 'axe-core';

function summarizeViolations(results: RunResults): string {
  if (results.violations.length === 0) {
    return '';
  }
  return results.violations.map(formatViolation).join('\n\n---\n\n');
}

function formatViolation(v: Result): string {
  const nodes = v.nodes
    .slice(0, 5)
    .map((n) => `  • ${n.failureSummary ?? v.help}\n    ${truncateHtml(n.html)}`)
    .join('\n');
  const more = v.nodes.length > 5 ? `\n  … +${v.nodes.length - 5} node(s)` : '';
  return `${v.id} (${v.impact})\n  ${v.help}\n  ${v.helpUrl}\n${nodes}${more}`;
}

function truncateHtml(html: string, max = 160): string {
  const t = html.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Full-page axe scan; fails the test with readable violation output. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({page}).analyze();
  expect(results.violations, summarizeViolations(results)).toEqual([]);
}

export async function goToPrimarySection(page: Page, buttonName: RegExp): Promise<void> {
  await page
    .getByRole('navigation', {name: 'Primary navigation'})
    .getByRole('button', {name: buttonName})
    .click();
}
