import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsDays, classifyDevice } from './analytics-utils.ts';
import { analyticsRequestOrigin } from './analytics-origin.ts';

test('resolves the public HTTPS origin behind an HTTP proxy', () => {
  const request = new Request('http://localhost:3000/api/analytics', { headers: {
    host: 'portfolio.example.com',
    'x-forwarded-host': 'portfolio.example.com',
    'x-forwarded-proto': 'https',
  } });
  assert.equal(analyticsRequestOrigin(request), 'https://portfolio.example.com');
});

test('supports direct local requests and forwarded hosts with non-default ports', () => {
  assert.equal(analyticsRequestOrigin(new Request('http://localhost:3100/api/analytics')), 'http://localhost:3100');
  assert.equal(analyticsRequestOrigin(new Request('http://localhost/api/analytics', { headers: {
    host: 'portfolio.example.com:8443', 'x-forwarded-proto': 'https',
  } })), 'https://portfolio.example.com:8443');
  assert.equal(analyticsRequestOrigin(new Request('http://localhost/api/analytics', { headers: {
    host: 'portfolio.example.com:443', 'x-forwarded-proto': 'https',
  } })), 'https://portfolio.example.com');
});

test('uses the first proxy value and does not derive the origin from the submitted Origin header', () => {
  const request = new Request('http://localhost/api/analytics', { headers: {
    'x-forwarded-host': 'portfolio.example.com, internal.example.com',
    'x-forwarded-proto': 'https, http',
    origin: 'https://unrelated.example.com',
  } });
  assert.equal(analyticsRequestOrigin(request), 'https://portfolio.example.com');
});

test('rejects malformed forwarded authorities and protocols', () => {
  for (const host of ['example.com/path', 'user@example.com', 'https://example.com', 'example.com?query', 'example.com#fragment']) {
    assert.equal(analyticsRequestOrigin(new Request('http://localhost/api/analytics', { headers: {
      'x-forwarded-host': host, 'x-forwarded-proto': 'https',
    } })), 'http://localhost');
  }
  assert.equal(analyticsRequestOrigin(new Request('http://localhost/api/analytics', { headers: {
    'x-forwarded-host': 'example.com', 'x-forwarded-proto': 'file',
  } })), 'http://localhost');
});

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
