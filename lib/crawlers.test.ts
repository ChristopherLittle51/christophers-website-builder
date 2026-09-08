import assert from 'node:assert/strict';
import test from 'node:test';
import { configuredCrawlerOrigin, crawlerDocumentToMarkdown, crawlerFormatFromRequest, crawlerResponseHeaders, crawlerRobotsDirectives, extractCrawlerDocument, normalizeCrawlerOrigin, sitemapPagePaths } from './crawlers.ts';

const html = '<!doctype html><html><head><title>Signal</title><meta name="description" content="A useful page"><link rel="canonical" href="/work"><script><h1>Ignore this</h1></script></head><body><main><h1>Make the thing</h1><p>Hello <a href="/about">there</a>.</p><ul><li>One</li><li>Two</li></ul><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><pre>const x = 1;</pre><img src="/cover.jpg" alt="Cover image"><a href="javascript:alert(1)">Bad</a></main></body></html>';

test('extracts semantic published content and resolves safe URLs', () => {
  const document = extractCrawlerDocument(html, 'https://example.test/');
  assert.equal(document.title, 'Signal');
  assert.equal(document.description, 'A useful page');
  assert.equal(document.canonical, 'https://example.test/work');
  assert.deepEqual(document.headings, [{ level: 1, text: 'Make the thing' }]);
  assert.deepEqual(document.paragraphs, ['Hello there.']);
  assert.deepEqual(document.links, [{ label: 'there', href: 'https://example.test/about' }]);
  assert.deepEqual(document.images, [{ src: 'https://example.test/cover.jpg', alt: 'Cover image' }]);
  assert.deepEqual(document.blocks.map((block) => block.type), ['heading', 'paragraph', 'list', 'table', 'code', 'paragraph']);
  assert.equal(document.blocks.at(-1)?.type, 'paragraph'); // Visible text of the rejected link remains readable.
});

test('formats semantic content as markdown and detects crawler requests', () => {
  const markdown = crawlerDocumentToMarkdown(extractCrawlerDocument(html, 'https://example.test/'));
  assert.match(markdown, /^# Signal/m);
  assert.match(markdown, /\[there\]\(https:\/\/example\.test\/about\)/);
  assert.equal(crawlerFormatFromRequest(new Request('https://example.test/', { headers: { accept: 'text/markdown' } })), 'markdown');
  assert.equal(crawlerFormatFromRequest(new Request('https://example.test/', { headers: { accept: 'text/markdown;q=0' } })), null);
  assert.equal(crawlerFormatFromRequest(new Request('https://example.test/', { headers: { accept: 'text/html' } })), null);
  assert.match(markdown, /- One\n- Two/);
  assert.match(markdown, /\| A \| B \|/);
  assert.match(markdown, /```[\s\S]*const x = 1;/);
});

test('emits configurable crawler policy directives', () => {
  const body = crawlerRobotsDirectives({ search: 'disallow', aiTraining: 'disallow', aiSearch: 'allow', aiMarkdown: true });
  const groups = body.trim().split(/\n\n/);
  assert.equal(groups.length, 3);
  assert.match(groups[0], /^User-agent: \*\nDisallow: \/$/);
  assert.match(groups[1], /^User-agent: GPTBot\nUser-agent: ClaudeBot\nUser-agent: Google-Extended\nUser-agent: CCBot\nUser-agent: Bytespider\nDisallow: \/$/);
  assert.match(groups[2], /^User-agent: OAI-SearchBot\nUser-agent: Claude-SearchBot\nUser-agent: PerplexityBot\nAllow: \/\nDisallow: \/edit\nDisallow: \/login\nDisallow: \/api\/\nDisallow: \/analytics\nDisallow: \/migration-export\nDisallow: \/fixtures\nAllow: \/api\/media\/$/);
  assert.doesNotMatch(body, /User-agent: ChatGPT-User/);
});

test('sitemap excludes unpublished and no-index pages', () => {
  assert.deepEqual(sitemapPagePaths([
    { path: '/', published: true },
    { path: '/about', published: true, noIndex: true },
    { path: '/draft', published: false },
    { path: '/work', published: true },
  ]), ['/', '/work']);
});

test('excludes hidden and decorative content but retains visible inline semantics', () => {
  const document = extractCrawlerDocument('<html><head><link rel="canonical" href="/example"></head><body><main><div hidden><h2>Secret heading</h2><a href="/secret">Secret link</a></div><div aria-hidden="true">Decorative copy</div><p>Visible <span hidden>not visible</span> words</p><div><strong>42%</strong><span>Completion rate</span></div><img src="/decorative.svg" alt=""><img src="/photo.jpg" alt="Study"></main></body></html>', 'https://example.test');
  const markdown = crawlerDocumentToMarkdown(document);
  assert.doesNotMatch(markdown, /Secret|Decorative|not visible|decorative\.svg/);
  assert.match(markdown, /42% Completion rate/);
  assert.match(markdown, /Canonical: <https:\/\/example\.test\/example>/);
});

test('preserves authored button labels while refusing icon-only control noise', () => {
  const document = extractCrawlerDocument('<main><h1>Release notes</h1><p>Read the details below.</p><div><button type="button">Read the release</button><button type="button" aria-label="Close panel">×</button><button type="button"><span aria-hidden="true">↗</span></button></div></main>', 'https://example.test/');
  const markdown = crawlerDocumentToMarkdown(document);
  assert.match(markdown, /Read the release/);
  assert.doesNotMatch(markdown, /Close panel|×|↗/);
});

test('keeps crawler renderer origin and response cache boundaries explicit', () => {
  assert.equal(normalizeCrawlerOrigin('https://example.test'), 'https://example.test');
  assert.equal(normalizeCrawlerOrigin('https://example.test/'), 'https://example.test');
  assert.equal(normalizeCrawlerOrigin('https://example.test/render'), '');
  assert.equal(normalizeCrawlerOrigin('https://user:pass@example.test'), '');
  assert.equal(normalizeCrawlerOrigin('javascript:alert(1)'), '');
  assert.deepEqual(crawlerResponseHeaders(), {
    'content-type': 'text/markdown; charset=utf-8',
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex',
    vary: 'Accept, User-Agent',
  });
  assert.equal(crawlerResponseHeaders('text/html; charset=utf-8')['cache-control'], 'no-store');
});

test('only enables negotiated rendering with a configured origin', () => {
  const previousRenderOrigin = process.env.RENDER_ORIGIN;
  const previousSiteUrl = process.env.SITE_URL;
  try {
    delete process.env.RENDER_ORIGIN;
    delete process.env.SITE_URL;
    assert.equal(configuredCrawlerOrigin(), '');
    process.env.SITE_URL = 'https://example.test';
    assert.equal(configuredCrawlerOrigin(), 'https://example.test');
    process.env.RENDER_ORIGIN = 'http://bad.example/with-path';
    assert.equal(configuredCrawlerOrigin(), '');
  } finally {
    if (previousRenderOrigin === undefined) delete process.env.RENDER_ORIGIN;
    else process.env.RENDER_ORIGIN = previousRenderOrigin;
    if (previousSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previousSiteUrl;
  }
});
