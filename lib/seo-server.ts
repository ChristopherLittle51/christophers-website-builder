import 'server-only';
import { headers } from 'next/headers';
import { publicOrigin } from './seo';
import type { SeoSettings } from './site-settings';

export async function metadataOrigin(settings: SeoSettings) {
  const requestHeaders = await headers();
  return publicOrigin(new Request('http://localhost:3000', { headers: requestHeaders }), process.env.SITE_URL, settings.siteUrl);
}
