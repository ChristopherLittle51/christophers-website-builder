'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const VISITOR_KEY = 'open-canvas-analytics-visitor';

function visitorId() {
  try {
    const existing = window.sessionStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return 'anonymous-browser';
  }
}

export default function PageViewTracker() {
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (pathname === '/analytics' || pathname.startsWith('/api/')) return;
    if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'page_view', path: pathname, visitorId: visitorId(), referrer: document.referrer }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
