import { safeHref } from './site-catalog.ts';

export function briefHandoff(destination: unknown, title: string, summary: string): string | undefined {
  const href = safeHref(destination);
  if (!href) return undefined;
  if (/^mailto:/i.test(href)) {
    const url = new URL(href);
    url.searchParams.set('subject', `Project brief: ${title}`);
    url.searchParams.set('body', `${title}\n\n${summary}`);
    return url.toString();
  }
  if (/^https?:/i.test(href) || href.startsWith('/')) {
    const url = new URL(href, 'https://relative.invalid');
    url.searchParams.set('brief', `${title}\n\n${summary}`);
    return url.origin === 'https://relative.invalid' ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  }
  return undefined;
}
