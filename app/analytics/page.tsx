import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';
import { getAnalyticsReport } from '@/lib/analytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import './analytics.css';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AnalyticsPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(token)) redirect('/login?returnTo=/analytics');
  const report = await getAnalyticsReport(30);
  return <AnalyticsDashboard initialReport={report} />;
}
