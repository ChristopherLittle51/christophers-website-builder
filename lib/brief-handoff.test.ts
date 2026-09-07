import assert from 'node:assert/strict';
import test from 'node:test';
import { briefHandoff } from './brief-handoff.ts';

test('builds a mailto handoff with the project brief in subject and body', () => {
  const handoff = briefHandoff('mailto:hello@example.com?cc=team@example.com', 'A new site', 'A focused portfolio for the launch.');
  assert.ok(handoff);
  const url = new URL(handoff);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'hello@example.com');
  assert.equal(url.searchParams.get('cc'), 'team@example.com');
  assert.equal(url.searchParams.get('subject'), 'Project brief: A new site');
  assert.equal(url.searchParams.get('body'), 'A new site\n\nA focused portfolio for the launch.');
});

test('adds a brief query to an external destination and preserves existing URL state', () => {
  const handoff = briefHandoff('https://example.com/intake?source=portfolio#start', 'A new site', 'A focused portfolio for the launch.');
  assert.ok(handoff);
  const url = new URL(handoff);
  assert.equal(url.searchParams.get('source'), 'portfolio');
  assert.equal(url.searchParams.get('brief'), 'A new site\n\nA focused portfolio for the launch.');
  assert.equal(url.hash, '#start');
});

test('rejects unsafe or unsupported handoff destinations', () => {
  for (const destination of [
    '',
    '#',
    'javascript:alert(1)',
    'data:text/html,unsafe',
    'vbscript:msgbox(1)',
    '//evil.example/collect',
    'ftp://example.com/intake',
    'https://example.com/\u0000intake',
  ]) {
    assert.equal(briefHandoff(destination, 'A new site', 'Summary'), undefined, destination);
  }
});

