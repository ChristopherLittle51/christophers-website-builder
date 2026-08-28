import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCalendlyEmbedUrl } from './embed-utils.ts';

const colors = { backgroundColor: '#f7f7f3', textColor: '#050505', primaryColor: '#d8ff00' };

test('builds an HTTPS Calendly embed URL with appearance controls', () => {
  const result = new URL(buildCalendlyEmbedUrl('calendly.com/studio/portfolio-call?month=2026-08', { ...colors, hideDetails: true }));
  assert.equal(result.origin, 'https://calendly.com');
  assert.equal(result.pathname, '/studio/portfolio-call');
  assert.equal(result.searchParams.get('month'), '2026-08');
  assert.equal(result.searchParams.get('hide_landing_page_details'), '1');
  assert.equal(result.searchParams.get('hide_event_type_details'), '1');
  assert.equal(result.searchParams.get('background_color'), 'f7f7f3');
  assert.equal(result.searchParams.get('text_color'), '050505');
  assert.equal(result.searchParams.get('primary_color'), 'd8ff00');
});

test('keeps details visible and drops invalid colors', () => {
  const result = new URL(buildCalendlyEmbedUrl('https://calendly.com/studio/30min?hide_event_type_details=1', {
    backgroundColor: 'paper', textColor: '#050505', primaryColor: '#d8ff00', hideDetails: false,
  }));
  assert.equal(result.searchParams.has('hide_landing_page_details'), false);
  assert.equal(result.searchParams.has('hide_event_type_details'), false);
  assert.equal(result.searchParams.has('background_color'), false);
});

test('rejects non-Calendly, non-HTTPS, and empty URLs', () => {
  assert.equal(buildCalendlyEmbedUrl('https://example.com/studio', { ...colors, hideDetails: true }), '');
  assert.equal(buildCalendlyEmbedUrl('http://calendly.com/studio', { ...colors, hideDetails: true }), '');
  assert.equal(buildCalendlyEmbedUrl('', { ...colors, hideDetails: true }), '');
});
