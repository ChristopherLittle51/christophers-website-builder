import type { Metadata } from 'next';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';
import { getSiteMetadataSettings } from '@/lib/site-metadata';
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
import './globals.css';

function siteUrl() {
  try { return new URL(process.env.SITE_URL || 'http://localhost:3000'); }
  catch { return new URL('http://localhost:3000'); }
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const record = await storage().getSite();
  const data = record?.published || starterData;
  const settings = getSiteMetadataSettings(data);
  const socialImage = settings.usesDefaultSocialImage
    ? { url: settings.socialImage, width: 1672, height: 941, alt: settings.socialImageAlt }
    : { url: settings.socialImage, alt: settings.socialImageAlt };
  const icons = settings.usesDefaultFavicon
    ? {
        icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
        shortcut: '/favicon-32.png',
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      }
    : { icon: [{ url: settings.favicon }], shortcut: settings.favicon, apple: [{ url: settings.favicon }] };

  return {
    metadataBase: siteUrl(),
    title: settings.browserTitle,
    description: settings.socialDescription,
    applicationName: settings.socialTitle,
    alternates: { canonical: '/' },
    manifest: '/site.webmanifest',
    icons,
    openGraph: {
      title: settings.socialTitle,
      description: settings.socialDescription,
      url: '/',
      siteName: settings.socialTitle,
      locale: 'en_US',
      type: 'website',
      images: [socialImage],
    },
    twitter: { card: 'summary_large_image', title: settings.socialTitle, description: settings.socialDescription, images: [{ url: settings.socialImage, alt: settings.socialImageAlt }] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
