import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsDays, classifyDevice } from './analytics-utils.ts';

test('accepts only the supported reporting windows', () => {
  assert.equal(analyticsDays('7'), 7);
  assert.equal(analyticsDays('30'), 30);
  assert.equal(analyticsDays('90'), 90);
  assert.equal(analyticsDays('365'), 30);
  assert.equal(analyticsDays(null), 30);
});

test('classifies common browser families without storing the user agent', () => {
  assert.equal(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 'mobile');
  assert.equal(classifyDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablet');
  assert.equal(classifyDevice('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'), 'desktop');
});
