'use client';

import type { AnalyticsReport } from '@/lib/analytics';
import { useState } from 'react';

type Range = 7 | 30 | 90;

const number = new Intl.NumberFormat('en-US');

function shortPath(path: string) {
  return path === '/' ? 'Home' : path.replace(/^\//, '').replaceAll('-', ' ');
}

function Chart({ daily }: { daily: AnalyticsReport['daily'] }) {
  const max = Math.max(...daily.map((item) => item.views), 1);
  const points = daily.map((item, index) => {
    const x = (index / Math.max(daily.length - 1, 1)) * 100;
    const y = 96 - (item.views / max) * 82;
    return `${x},${y}`;
  }).join(' ');
  const labels = daily.length <= 7 ? daily : [daily[0], daily[Math.floor(daily.length / 2)], daily[daily.length - 1]];
  return (
    <div className="analytics-chart">
      <svg viewBox="0 0 100 100" role="img" aria-label="Views by day" preserveAspectRatio="none">
        <line x1="0" y1="96" x2="100" y2="96" className="analytics-chart__axis" />
        <polyline points={points} className="analytics-chart__line" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="analytics-chart__labels">{labels.map((item) => <span key={item.date}>{item.label}</span>)}</div>
    </div>
  );
}

function Ranking({ items, kind }: { items: Array<{ label: string; value: number; note?: string }>; kind: string }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (!items.length) return <p className="analytics-empty">No {kind} recorded in this window.</p>;
  return <div className="analytics-ranking">{items.map((item) => <div className="analytics-ranking__row" key={item.label}><div className="analytics-ranking__copy"><strong>{item.label}</strong>{item.note ? <span>{item.note}</span> : null}<b>{number.format(item.value)}</b></div><div className="analytics-ranking__bar"><i style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} /></div></div>)}</div>;
}

export default function AnalyticsDashboard({ initialReport }: { initialReport: AnalyticsReport }) {
  const [report, setReport] = useState(initialReport);
  const [range, setRange] = useState<Range>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeRange = async (nextRange: Range) => {
    if (nextRange === range) return;
    setRange(nextRange);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?days=${nextRange}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load analytics');
      setReport(await response.json() as AnalyticsReport);
    } catch {
      setError('Could not refresh this window. Showing the previous report.');
      setRange(report.days as Range);
    } finally {
      setLoading(false);
    }
  };

  const topPages = report.pages.map((item) => ({ label: shortPath(item.path), value: item.views, note: `${number.format(item.visitors)} visitors` }));
  const topSources = report.sources.map((item) => ({ label: item.source, value: item.views }));
  const topDevices = report.devices.map((item) => ({ label: item.device, value: item.views }));

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div><span className="analytics-kicker">Open Canvas / Signal room</span><h1>Analytics</h1><p>Understand what your published work is doing in the wild.</p></div>
        <nav className="analytics-header__nav" aria-label="Studio navigation"><a href="/">View site ↗</a><a href="/edit">Edit site</a><form action="/api/auth/logout" method="post"><button type="submit">Sign out</button></form></nav>
      </header>

      <section className="analytics-toolbar" aria-label="Analytics controls"><div><span>Reporting window</span><strong>{loading ? 'Refreshing…' : `Last ${report.days} days`}</strong>{error ? <small className="analytics-toolbar__error" role="alert">{error}</small> : null}</div><div className="analytics-range" role="group" aria-label="Reporting window"><button type="button" className={range === 7 ? 'is-active' : ''} onClick={() => void changeRange(7)}>7D</button><button type="button" className={range === 30 ? 'is-active' : ''} onClick={() => void changeRange(30)}>30D</button><button type="button" className={range === 90 ? 'is-active' : ''} onClick={() => void changeRange(90)}>90D</button></div></section>

      <section className="analytics-stats" aria-label="Summary"><article><span>Page views</span><strong>{number.format(report.summary.views)}</strong><small>Total visits to your published pages</small></article><article><span>Tab sessions</span><strong>{number.format(report.summary.visitors)}</strong><small>Anonymous browser-tab visits, not people</small></article><article><span>Pages reached</span><strong>{number.format(report.summary.pages)}</strong><small>{report.summary.topPage ? `Top: ${shortPath(report.summary.topPage)}` : 'Waiting for the first visit'}</small></article><article><span>Top source</span><strong className="analytics-stat-text">{report.summary.topSource || '—'}</strong><small>Referrer host or direct</small></article></section>

      <section className="analytics-panel analytics-panel--chart"><div className="analytics-panel__heading"><div><span>Attention over time</span><h2>Views, day by day</h2></div><em>{report.daily.reduce((sum, day) => sum + day.views, 0) ? 'Live from your published site' : 'No events yet'}</em></div><Chart daily={report.daily} /></section>

      <div className="analytics-columns"><section className="analytics-panel"><div className="analytics-panel__heading"><div><span>Pages</span><h2>What people opened</h2></div></div><Ranking items={topPages} kind="pages" /></section><section className="analytics-panel"><div className="analytics-panel__heading"><div><span>Acquisition</span><h2>Where they came from</h2></div></div><Ranking items={topSources} kind="sources" /></section></div>

      <section className="analytics-panel analytics-panel--devices"><div className="analytics-panel__heading"><div><span>Context</span><h2>Devices in the mix</h2></div><em>Views</em></div><Ranking items={topDevices} kind="devices" /></section>
      <footer className="analytics-footer"><span>First-party analytics</span><span>Data is stored with your site content · {report.since.slice(0, 10)} → today</span></footer>
    </main>
  );
}
