import assert from 'node:assert/strict';
import test from 'node:test';
import { formatGitHubCount, formatGitHubDate, parseGitHubRepository } from './github.ts';

test('parses GitHub repository URLs and compact references', () => {
  assert.deepEqual(parseGitHubRepository('https://github.com/open-canvas/builder/'), { owner: 'open-canvas', repo: 'builder' });
  assert.deepEqual(parseGitHubRepository('github.com/open-canvas/builder'), { owner: 'open-canvas', repo: 'builder' });
  assert.deepEqual(parseGitHubRepository('open-canvas/builder'), { owner: 'open-canvas', repo: 'builder' });
});

test('rejects non-repository GitHub inputs', () => {
  assert.equal(parseGitHubRepository('https://gitlab.com/open-canvas/builder'), null);
  assert.equal(parseGitHubRepository('https://github.com/open-canvas'), null);
  assert.equal(parseGitHubRepository('https://github.com/open-canvas/builder/issues'), null);
});

test('formats repository values for compact display', () => {
  assert.equal(formatGitHubCount(12400), '12.4K');
  assert.equal(formatGitHubCount(undefined), '—');
  assert.equal(formatGitHubDate('2026-08-15T00:00:00Z'), 'Aug 2026');
  assert.equal(formatGitHubDate('not-a-date'), 'Unknown');
});
