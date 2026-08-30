import { notFound } from 'next/navigation';
import PublishedPage from '../PublishedPage';
import { normalizeBuilderData } from '@/lib/puck-data';
import { toSitePages } from '@/lib/site-pages';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await storage().getSite();
  const site = toSitePages(record || { draft: starterData, published: starterData }, starterData);
  const page = site.pages.find((candidate) => candidate.slug === slug && candidate.id !== site.homepageId);
  if (!page?.published) notFound();
  return <PublishedPage data={normalizeBuilderData(page.published).data} />;
}
