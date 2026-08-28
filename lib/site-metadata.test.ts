import assert from 'node:assert/strict';
import test from 'node:test';
import type { Data } from '@puckeditor/core';
import { DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE, getSiteMetadataSettings } from './site-metadata.ts';

function data(props: Record<string, unknown>): Data {
  return { content: [], root: { props } } as unknown as Data;
}

test('uses branded fallbacks for older published documents', () => {
  assert.deepEqual(getSiteMetadataSettings(data({})), {
    browserTitle: DEFAULT_SITE_TITLE,
    socialTitle: DEFAULT_SITE_TITLE,
    socialDescription: DEFAULT_SITE_DESCRIPTION,
    socialImage: '/og.png',
    socialImageAlt: `${DEFAULT_SITE_TITLE} social preview`,
    favicon: '/favicon.svg',
    usesDefaultSocialImage: true,
    usesDefaultFavicon: true,
  });
});

test('reads customizable published favicon and social fields', () => {
  assert.deepEqual(getSiteMetadataSettings(data({
    title: 'Studio Name — Director', socialTitle: 'Stories in motion', socialDescription: 'Selected film and editorial work.',
    socialImage: '/api/media/social-card', socialImageAlt: 'Film frames arranged in a contact sheet', favicon: '/api/media/favicon',
  })), {
    browserTitle: 'Studio Name — Director',
    socialTitle: 'Stories in motion',
    socialDescription: 'Selected film and editorial work.',
    socialImage: '/api/media/social-card',
    socialImageAlt: 'Film frames arranged in a contact sheet',
    favicon: '/api/media/favicon',
    usesDefaultSocialImage: false,
    usesDefaultFavicon: false,
  });
});

test('rejects unsafe asset protocols and protocol-relative URLs', () => {
  const settings = getSiteMetadataSettings(data({ socialImage: 'javascript:alert(1)', favicon: '//tracker.example/icon.png' }));
  assert.equal(settings.socialImage, '/og.png');
  assert.equal(settings.favicon, '/favicon.svg');
});
