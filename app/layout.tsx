import type { Metadata } from 'next';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import { getSiteMetadataSettings } from '@/lib/site-metadata';
import { getSiteSettings } from '@/lib/site-settings';
import { toSitePages } from '@/lib/site-pages';
import { metadataOrigin } from '@/lib/seo-server';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/oswald/400.css';
import '@fontsource/oswald/700.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/700.css';
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/source-code-pro/400.css';
import '@fontsource/source-code-pro/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/700.css';
import './globals.css';
import '@/lib/site-navigation.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const data = site.pages.find(page => page.id === site.homepageId)?.published || { root: { props: {} }, content: [] };
  const siteSettings = getSiteSettings(record, 'published');
  const settings = getSiteMetadataSettings(data);
  const icons = settings.usesDefaultFavicon
    ? {
        icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
        shortcut: '/favicon-32.png',
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      }
    : { icon: [{ url: settings.favicon }], shortcut: settings.favicon, apple: [{ url: settings.favicon }] };

  return {
    metadataBase: new URL(await metadataOrigin(siteSettings.seo)),
    title: settings.browserTitle,
    applicationName: siteSettings.seo.siteName || settings.browserTitle,
    manifest: '/site.webmanifest',
    icons,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
