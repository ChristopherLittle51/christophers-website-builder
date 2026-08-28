import PublishedPage from './PublishedPage';
import { normalizeBuilderData } from '@/lib/puck-data';
import { storage } from '@/lib/storage';
import { starterData } from '@/lib/templates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Home() {
  const record = await storage().getSite();
  return <PublishedPage data={normalizeBuilderData(record?.published || starterData).data} />;
}
