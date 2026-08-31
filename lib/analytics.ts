import { storage } from './storage';
import type { AnalyticsEvent, AnalyticsEventType } from './analytics-types';
import { analyticsDays, classifyDevice } from './analytics-utils';
export { analyticsDays, classifyDevice } from './analytics-utils';

export type AnalyticsReport = {
  days: number;
  since: string;
  summary: {
    views: number;
    visitors: number;
    pages: number;
    topPage: string | null;
    topSource: string | null;
  };
  daily: Array<{ date: string; label: string; views: number; visitors: number }>;
  pages: Array<{ path: string; views: number; visitors: number }>;
  sources: Array<{ source: string; views: number }>;
  devices: Array<{ device: AnalyticsEvent['device']; views: number }>;
};

const MAX_EVENTS = 100_000;
const RETENTION_DAYS = 400;
function safePath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  return value.split(/[?#]/, 1)[0].slice(0, 500) || '/';
}

function safeVisitorId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(value)) return 'anonymous';
  return value;
}

function sourceFromReferrer(value: unknown, requestOrigin: string) {
  if (typeof value !== 'string' || !value) return '(direct)';
  try {
    const referrer = new URL(value);
    if (referrer.origin === requestOrigin) return '(internal)';
    return referrer.hostname.slice(0, 180) || '(direct)';
  } catch {
    return '(direct)';
  }
}

export async function recordPageView(input: {
  path: unknown;
  visitorId: unknown;
  referrer: unknown;
  requestOrigin: string;
  userAgent: string | null;
}) {
  const now = Date.now();
  const event: AnalyticsEvent = {
    id: crypto.randomUUID(),
    type: 'page_view' satisfies AnalyticsEventType,
    path: safePath(input.path),
    source: sourceFromReferrer(input.referrer, input.requestOrigin),
    device: classifyDevice(input.userAgent),
    visitorId: safeVisitorId(input.visitorId),
    createdAt: new Date(now).toISOString(),
  };
  await storage().appendAnalyticsEvent(event);
}

function increment(map: Map<string, { views: number; visitors: Set<string> }>, key: string, visitorId: string) {
  const current = map.get(key) || { views: 0, visitors: new Set<string>() };
  current.views += 1;
  current.visitors.add(visitorId);
  map.set(key, current);
}

export async function getAnalyticsReport(days = 30): Promise<AnalyticsReport> {
  const range = analyticsDays(String(days));
  const end = new Date();
  const retentionCutoff = end.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const sinceDate = new Date(end.getTime() - (range - 1) * 24 * 60 * 60 * 1000);
  sinceDate.setUTCHours(0, 0, 0, 0);
  const since = sinceDate.toISOString();
  const events = (await storage().getAnalyticsEvents())
    .filter((event) => event.type === 'page_view' && Date.parse(event.createdAt) >= retentionCutoff && Date.parse(event.createdAt) >= sinceDate.getTime())
    .slice(-MAX_EVENTS);
  const pages = new Map<string, { views: number; visitors: Set<string> }>();
  const sources = new Map<string, number>();
  const devices = new Map<AnalyticsEvent['device'], number>();
  const daily = new Map<string, { views: number; visitors: Set<string> }>();
  const visitors = new Set<string>();

  for (const event of events) {
    const date = event.createdAt.slice(0, 10);
    increment(pages, event.path, event.visitorId);
    increment(daily, date, event.visitorId);
    sources.set(event.source, (sources.get(event.source) || 0) + 1);
    devices.set(event.device, (devices.get(event.device) || 0) + 1);
    visitors.add(event.visitorId);
  }

  const dailySeries = Array.from({ length: range }, (_, index) => {
    const date = new Date(sinceDate.getTime() + index * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    const value = daily.get(key);
    return { date: key, label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), views: value?.views || 0, visitors: value?.visitors.size || 0 };
  });
  const rankedPages = [...pages.entries()].sort((a, b) => b[1].views - a[1].views).map(([path, value]) => ({ path, views: value.views, visitors: value.visitors.size }));
  const rankedSources = [...sources.entries()].sort((a, b) => b[1] - a[1]).map(([source, views]) => ({ source, views }));
  const rankedDevices = [...devices.entries()].sort((a, b) => b[1] - a[1]).map(([device, views]) => ({ device, views }));
  return {
    days: range,
    since,
    summary: { views: events.length, visitors: visitors.size, pages: pages.size, topPage: rankedPages[0]?.path || null, topSource: rankedSources[0]?.source || null },
    daily: dailySeries,
    pages: rankedPages.slice(0, 8),
    sources: rankedSources.slice(0, 8),
    devices: rankedDevices,
  };
}
