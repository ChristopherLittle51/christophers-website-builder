import { parse } from 'parse5';

export type CrawlFormat = 'markdown';

export type CrawlLink = { label: string; href: string };
export type CrawlImage = { src: string; alt: string };
export type CrawlBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'table'; rows: string[][] };
export type CrawlerDocument = {
  title: string;
  description: string;
  canonical: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  links: CrawlLink[];
  images: CrawlImage[];
  blocks: CrawlBlock[];
};

type Node = { nodeName?: string; tagName?: string; attrs?: Array<{ name: string; value: string }>; childNodes?: Node[] };

const attr = (node: Node, name: string) => node.attrs?.find((item) => item.name === name)?.value || '';
const text = (node: Node): string => (node.nodeName === '#text' ? (node as Node & { value?: string }).value || '' : (node.childNodes || []).map(text).join(' '))
  .replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
const rawText = (node: Node): string => (node.nodeName === '#text' ? (node as Node & { value?: string }).value || '' : (node.childNodes || []).map(rawText).join(''));
const walk = (node: Node, callback: (node: Node) => void) => { callback(node); (node.childNodes || []).forEach((child) => walk(child, callback)); };

/** Return an origin only when it is safe to use as the renderer's same-origin base. */
export function normalizeCrawlerOrigin(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return '';
    return url.origin;
  } catch { return ''; }
}

export function configuredCrawlerOrigin() {
  return normalizeCrawlerOrigin(process.env.RENDER_ORIGIN || process.env.SITE_URL);
}

export function crawlerResponseHeaders(contentType = 'text/markdown; charset=utf-8') {
  return { 'content-type': contentType, 'cache-control': 'no-store', 'x-robots-tag': 'noindex', vary: 'Accept, User-Agent' };
}

function absoluteUrl(raw: string, baseUrl: string) {
  if (!raw || /^(?:javascript|data|vbscript):/i.test(raw)) return '';
  try { return new URL(raw, baseUrl).toString(); } catch { return ''; }
}

export function extractCrawlerDocument(html: string, baseUrl: string, maxItems = 200): CrawlerDocument {
  const document = parse(html) as unknown as Node;
  const result: CrawlerDocument = { title: '', description: '', canonical: '', headings: [], paragraphs: [], links: [], images: [], blocks: [] };
  function prune(node: Node) {
    node.childNodes = (node.childNodes || []).filter(child => {
      const tag = child.tagName || '';
      return !['script', 'style', 'noscript', 'template', 'svg', 'input', 'select', 'textarea'].includes(tag)
        && !(tag === 'dialog' && !child.attrs?.some(a => a.name === 'open'))
        && !child.attrs?.some(a => a.name === 'hidden' || a.name === 'data-crawler-ignore' || a.name === 'data-fixture-controls')
        && attr(child, 'aria-hidden') !== 'true'
        && !/(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(attr(child, 'style'));
    });
    node.childNodes.forEach(prune);
  }
  prune(document);
  const root = document;
  walk(root, (node) => {
    const tag = node.tagName || '';
    if (tag === 'title' && !result.title) result.title = text(node);
    if (tag === 'meta' && attr(node, 'name').toLowerCase() === 'description') result.description = attr(node, 'content').trim();
    if (tag === 'link' && attr(node, 'rel').toLowerCase().split(/\s+/).includes('canonical')) result.canonical = absoluteUrl(attr(node, 'href'), baseUrl);
    if (/^h[1-6]$/.test(tag) && result.headings.length < maxItems) result.headings.push({ level: Number(tag.slice(1)), text: text(node) });
    if ((tag === 'p' || tag === 'blockquote') && result.paragraphs.length < maxItems) { const value = text(node); if (value) result.paragraphs.push(value); }
    if (tag === 'a' && result.links.length < maxItems) { const href = absoluteUrl(attr(node, 'href'), baseUrl); const label = text(node); if (href && label) result.links.push({ label, href }); }
    if (tag === 'img' && result.images.length < maxItems) { const src = absoluteUrl(attr(node, 'src'), baseUrl); if (src && attr(node, 'alt').trim()) result.images.push({ src, alt: attr(node, 'alt').trim() }); }
  });
  const body = (() => { let found: Node | undefined; walk(root, (node) => { if (!found && node.tagName === 'body') found = node; }); return found || root; })();
  const collectBlocks = (node: Node) => {
    const tag = node.tagName || '';
    if (['script', 'style', 'noscript', 'template', 'svg'].includes(tag)) return;
    if (/^h[1-6]$/.test(tag)) { const value = text(node); if (value) result.blocks.push({ type: 'heading', level: Number(tag.slice(1)), text: value }); return; }
    if (tag === 'p' || tag === 'blockquote') { const value = text(node); if (value) result.blocks.push({ type: 'paragraph', text: value }); return; }
    if (tag === 'pre') { const value = rawText(node).trim(); if (value) result.blocks.push({ type: 'code', text: value }); return; }
    if (tag === 'ul' || tag === 'ol') { const items = childrenByTag(node, 'li').map(text).filter(Boolean); if (items.length) result.blocks.push({ type: 'list', ordered: tag === 'ol', items }); return; }
    if (tag === 'table') { const rows = descendantsByTag(node, 'tr').map(row => childrenByTag(row, 'th').concat(childrenByTag(row, 'td')).map(text)); if (rows.length) result.blocks.push({ type: 'table', rows }); return; }
    // Collect inline runs as well as conventional prose: metric values, captions,
    // status labels, authored button labels, and disclosure summaries are
    // meaningful published content. Icon-only controls remain UI noise.
    const inlineTags = new Set(['a','button','span','strong','em','b','i','small','time','code','abbr','label','summary','figcaption','output']);
    const meaningfulButton = (value: string) => /[\p{L}\p{N}]/u.test(value);
    let run: string[] = [];
    const flush = () => { const value = run.join(' ').trim(); if (value) result.blocks.push({ type: 'paragraph', text: value }); run = []; };
    (node.childNodes || []).forEach(child => {
      if (child.nodeName === '#text' || inlineTags.has(child.tagName || '')) {
        const value = text(child);
        if (value && (child.tagName !== 'button' || meaningfulButton(value))) run.push(value);
      }
      else { flush(); collectBlocks(child); }
    });
    flush();
  };
  collectBlocks(body);
  return result;
}

const childrenByTag = (node: Node, tag: string) => (node.childNodes || []).filter((child) => child.tagName === tag);
const descendantsByTag = (node: Node, tag: string): Node[] => childrenByTag(node, tag).concat((node.childNodes || []).flatMap((child) => descendantsByTag(child, tag)));

const md = (value: string) => value.replace(/[\\`*_{}[\]()#+.!|>~-]/g, '\\$&');

export function crawlerDocumentToMarkdown(document: CrawlerDocument) {
  const lines: string[] = [];
  if (document.title) lines.push(`# ${md(document.title)}`, '');
  if (document.canonical) lines.push(`Canonical: <${document.canonical}>`, '');
  if (document.description) lines.push(md(document.description), '');
  document.blocks.forEach((block) => {
    if (block.type === 'heading') lines.push(`${'#'.repeat(Math.min(6, Math.max(1, block.level)))} ${md(block.text)}`, '');
    if (block.type === 'paragraph') lines.push(md(block.text), '');
    if (block.type === 'code') { const fence = '`'.repeat(Math.max(3, ...[...block.text.matchAll(/`+/g)].map(match => match[0].length + 1))); lines.push(fence, block.text, fence, ''); }
    if (block.type === 'list') block.items.forEach((item, index) => lines.push(`${block.ordered ? `${index + 1}.` : '-'} ${md(item)}`));
    if (block.type === 'table' && block.rows.length) { lines.push(`| ${block.rows[0].map(md).join(' | ')} |`, `| ${block.rows[0].map(() => '---').join(' | ')} |`); block.rows.slice(1).forEach(row => lines.push(`| ${row.map(md).join(' | ')} |`)); lines.push(''); }
  });
  if (document.links.length) { lines.push('## Links', ''); document.links.forEach((link) => lines.push(`- [${md(link.label)}](${link.href})`)); lines.push(''); }
  if (document.images.length) { lines.push('## Images', ''); document.images.forEach((image) => lines.push(`- ${md(image.alt || 'Image')}: ${image.src}`)); lines.push(''); }
  return lines.join('\n').trim() + '\n';
}

export function isAiCrawlerUserAgent(userAgent: string) {
  return /\b(?:gptbot|oai-searchbot|chatgpt-user|claudebot|claude-searchbot|anthropic-ai|perplexitybot|google-extended|bytespider|ccbot)\b/i.test(userAgent);
}

export function crawlerFormatFromRequest(
  request: Request
): CrawlFormat | null {
  const explicit = request.headers.get('accept') || '';

  if (acceptsMarkdown(explicit)) return 'markdown';

  return null;
}

function acceptsMarkdown(header: string) {
  return header.split(',').some((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(';');
    if (type !== 'text/markdown') return false;
    const quality = params.find((param) => param.trim().startsWith('q='));
    return !quality || Number(quality.trim().slice(2)) > 0;
  });
}

export function hasExplicitMarkdownAccept(request: Request) { return acceptsMarkdown(request.headers.get('accept') || ''); }

export function crawlerRobotsDirectives(settings: { search: 'allow' | 'disallow'; aiTraining: 'allow' | 'disallow'; aiSearch: 'allow' | 'disallow'; aiMarkdown: boolean }) {
  const privatePaths = ['/edit', '/login', '/api/', '/analytics', '/migration-export', '/fixtures'];
  const group = (agents: string[], allowed: boolean) => [...agents.map(agent => `User-agent: ${agent}`), allowed ? 'Allow: /' : 'Disallow: /', ...(allowed ? privatePaths.map(path => `Disallow: ${path}`) : []), ''];
  const lines = [
    ...group(['*'], settings.search === 'allow'),
    ...group(['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider'], settings.aiTraining === 'allow'),
    ...group(['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'], settings.aiSearch === 'allow'),
  ];
  return lines.join('\n') + '\n';
}

export function sitemapPagePaths<T extends { path: string; noIndex?: boolean; published: boolean }>(pages: T[]) {
  return pages.filter((page) => page.published && !page.noIndex).map((page) => page.path);
}
