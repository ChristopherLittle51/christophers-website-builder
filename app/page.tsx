import PublishedPage from './PublishedPage';
import { normalizeBuilderData } from '@/lib/puck-data';
import { toSitePages } from '@/lib/site-pages';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Home() {
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const home = site.pages.find((page) => page.id === site.homepageId) || site.pages[0];
  return <PublishedPage data={normalizeBuilderData(home.published || starterData).data} />;
}
