const ORIGIN = process.env.QA_ORIGIN || 'http://localhost:3010';
const QA_DATA_DIR = process.env.DATA_DIR || '/tmp/open-canvas-production-qa';
const PASSWORD = process.env.QA_PASSWORD || 'production-qa-password';
const report = { origin: ORIGIN, dataDir: QA_DATA_DIR, startedAt: new Date().toISOString(), checks: [], failures: [] };
let cookie = '';
const runSlug = `qa-work-renamed-${Date.now()}`;

function check(name, ok, detail = '') {
  const item = { name, ok: Boolean(ok), detail };
  report.checks.push(item);
  if (!ok) report.failures.push(item);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  return Boolean(ok);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (cookie) headers.set('cookie', cookie);
  const response = await fetch(new URL(path, ORIGIN), { redirect: 'manual', ...options, headers });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';', 1)[0];
  return response;
}

async function json(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { _text: text }; }
}

async function siteDraft(pageId) {
  const response = await request(`/api/site?mode=draft${pageId ? `&page=${encodeURIComponent(pageId)}` : ''}`);
  return { response, body: await json(response) };
}

async function savePage(data, pageId, publish) {
  const response = await request('/api/site', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data, pageId, publish }) });
  return { response, body: await json(response) };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function firstComponent(data) { return Array.isArray(data?.content) ? data.content.find((item) => item && typeof item === 'object' && item.props && typeof item.props === 'object') : null; }
function hasNoStore(response) { return response.headers.get('cache-control')?.toLowerCase() === 'no-store'; }
function hasCrawlerVary(response) { return (response.headers.get('vary') || '').toLowerCase().split(',').map(value => value.trim()).includes('accept') && (response.headers.get('vary') || '').toLowerCase().split(',').map(value => value.trim()).includes('user-agent'); }

async function main() {
  try {
    if (!['localhost', '127.0.0.1'].includes(new URL(ORIGIN).hostname)) throw new Error('QA writes require a localhost server with isolated storage.');
    const fixture = await fetch(new URL('/fixtures', ORIGIN));
    if (!fixture.ok || !(await fixture.text()).includes('data-fixture-controls')) throw new Error('Start the isolated COMPONENT_FIXTURES=1 server before running QA writes.');
    const login = await request('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ password: PASSWORD, returnTo: '/edit' }) });
    check('admin login', login.status === 303 && Boolean(cookie), `status=${login.status}`);

    const initial = await siteDraft();
    check('authenticated draft API', initial.response.ok && initial.body?.page?.id, `status=${initial.response.status}`);
    const home = initial.body.page;
    const homeData = clone(initial.body.data);
    const homeComponent = firstComponent(homeData);
    if (homeComponent) { homeComponent.props.name = 'qa-section-old'; }
    homeData.root = { ...homeData.root, props: { ...homeData.root.props, title: 'QA Home' } };
    const homeSave = await savePage(homeData, home.id, true);
    check('publish home through API', homeSave.response.ok, `status=${homeSave.response.status}`);

    const create = await request('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create', title: 'QA Work Page' }) });
    const created = await json(create);
    check('create page through API', create.ok && created?.page?.id, `status=${create.status}`);
    const page = created.page;
    const pageDraft = await siteDraft(page.id);
    const pageData = clone(pageDraft.body.data);
    pageData.root = { ...pageData.root, props: { ...pageData.root.props, title: 'QA Work Page', noIndex: false } };
    const targetComponent = firstComponent(pageData);
    if (targetComponent) targetComponent.props.name = 'linked-target';
    homeData.content.push({ type: 'ButtonBlock', props: { id: 'qa-stable-link', name: 'qa-stable-link', label: 'Stable project link', href: { type: 'page', pageId: page.id, componentId: targetComponent.props.id }, style: 'solid', align: 'left' } });
    await savePage(homeData, home.id, true);
    const pageSave = await savePage(pageData, page.id, true);
    check('publish secondary page through API', pageSave.response.ok, `status=${pageSave.response.status}`);

    const publicHome = await request('/');
    const publicPage = await request(`/${page.slug}`);
    check('published home is public', publicHome.status === 200 && (await publicHome.text()).includes('QA Home'));
    check('published page is public', publicPage.status === 200 && (await publicPage.text()).includes('QA Work Page'));
    const unauth = await fetch(new URL('/api/site?mode=draft', ORIGIN));
    check('draft API is not public', unauth.status === 401, `status=${unauth.status}`);

    const rename = await request('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'rename', pageId: page.id, title: 'QA Work Renamed', slug: runSlug }) });
    const renamed = await json(rename);
    const renamedSlug = renamed?.page?.slug || 'qa-work-renamed';
    check('rename page slug through API', rename.ok && renamedSlug === runSlug, `status=${rename.status}`);
    const oldPage = await request(`/${page.slug}`);
    const newPage = await request(`/${renamedSlug}`, { redirect: 'follow' });
    check('old slug no longer serves page', oldPage.status === 404, `status=${oldPage.status}`);
    const linkedHome = await (await request('/')).text();
    check('structured link follows renamed page slug in rendered HTML', linkedHome.includes(`href="/${renamedSlug}#linked-target"`));
    check('new slug serves renamed page', newPage.status === 200 && (await newPage.text()).includes('QA Work Page'));

    const settingsResponse = await request('/api/site-settings');
    const settingsInitial = await json(settingsResponse);
    check('settings API authenticated', settingsResponse.ok && settingsInitial?.draft && settingsInitial?.published, `status=${settingsResponse.status}`);
    const settingsDraft = clone(settingsInitial.draft);
    const publishedMarkdownBeforeDraftSave = settingsInitial.published.crawler.markdown;
    settingsDraft.enabled = true;
    settingsDraft.crawler.markdown = false;
    settingsDraft.crawler.search = 'disallow';
    settingsDraft.crawler.aiTraining = 'disallow';
    settingsDraft.crawler.aiSearch = 'allow';
    settingsDraft.navigation = [{ pageId: page.id, label: 'Renamed work', group: 'Explore', hidden: false }];
    const settingsSaveDraft = await request('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: settingsDraft, publish: false }) });
    const settingsAfterDraft = await json(settingsSaveDraft);
    check('settings draft persists without publication', settingsSaveDraft.ok && settingsAfterDraft.published.crawler.markdown === publishedMarkdownBeforeDraftSave && settingsAfterDraft.draft.crawler.markdown === false);
    const disabledPublish = await request('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: settingsDraft, publish: true }) });
    check('publish disabled Markdown setting', disabledPublish.ok);
    const htmlWhenMarkdownDisabled = await request('/', { headers: { accept: 'text/markdown' } });
    check('disabled Markdown negotiation falls back to HTML', htmlWhenMarkdownDisabled.status === 200 && (htmlWhenMarkdownDisabled.headers.get('content-type') || '').includes('text/html') && hasCrawlerVary(htmlWhenMarkdownDisabled));
    settingsDraft.crawler.markdown = true;
    settingsDraft.crawler.aiMarkdown = true;
    const settingsPublish = await request('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: settingsDraft, publish: true }) });
    check('publish settings through API', settingsPublish.ok);
    const markdown = await request('/', { headers: { accept: 'text/markdown' } });
    check('explicit Markdown negotiation returns Markdown', markdown.status === 200 && (markdown.headers.get('content-type') || '').includes('text/markdown') && hasNoStore(markdown) && markdown.headers.get('x-robots-tag') === 'noindex' && hasCrawlerVary(markdown));
    const markdownQ0 = await request('/', { headers: { accept: 'text/markdown;q=0, text/html' } });
    check('Markdown q=0 preserves HTML', markdownQ0.status === 200 && (markdownQ0.headers.get('content-type') || '').includes('text/html'));
    const aiMarkdown = await request('/', { headers: { 'user-agent': 'GPTBot/1.0', accept: 'text/html' } });
    check('enabled AI Markdown negotiation returns Markdown', aiMarkdown.status === 200 && (aiMarkdown.headers.get('content-type') || '').includes('text/markdown'));

    const homeDraftAfterRename = await siteDraft(home.id);
    const renamedData = clone(homeDraftAfterRename.body.data);
    const renamedComponent = firstComponent(renamedData);
    if (renamedComponent) renamedComponent.props.name = 'qa-section-new';
    await savePage(renamedData, home.id, true);
    const sectionHtml = await request('/');
    const sectionText = await sectionHtml.text();
    check('section anchor rename is rendered', sectionText.includes('id="qa-section-new"') && !sectionText.includes('id="qa-section-old"'));
    const settingsCheck = await json(await request('/api/site-settings'));
    check('published settings survive page save', settingsCheck.published.crawler.markdown === true && settingsCheck.published.crawler.aiMarkdown === true);

    const noIndexData = clone((await siteDraft(page.id)).body.data);
    noIndexData.root = { ...noIndexData.root, props: { ...noIndexData.root.props, noIndex: true } };
    await savePage(noIndexData, page.id, true);
    const createUnpublished = await request('/api/site', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create', title: 'QA Unpublished Page' }) });
    const unpublished = await json(createUnpublished);
    const unpublishedPath = unpublished?.page?.slug;
    const sitemap = await request('/sitemap.xml');
    const sitemapText = await sitemap.text();
    check('sitemap excludes noIndex page', !sitemapText.includes(renamedSlug));
    const publicCatalog = await (await fetch(new URL('/api/site', ORIGIN))).json();
    check('public page catalog excludes unpublished page', !publicCatalog.pages.some(item => item.id === unpublished.page.id));
    const missingDraft = await fetch(new URL(`/api/site?page=${unpublished.page.id}`, ORIGIN));
    check('public data request for unpublished page returns 404', missingDraft.status === 404);
    check('sitemap excludes unpublished page', !unpublishedPath || !sitemapText.includes(unpublishedPath));
    const robots = await request('/robots.txt');
    const robotsText = await robots.text();
    const robotsGroups = robotsText.split(/\n\n/);
    check('robots endpoint responds', robots.status === 200 && robotsText.includes('Sitemap:') && hasNoStore(robots));
    check('robots separates search, training, and AI search groups', robotsGroups.some(group => group.split('\n').includes('User-agent: *') && group.split('\n').includes('Disallow: /')) && robotsGroups.some(group => group.split('\n').includes('User-agent: GPTBot') && group.split('\n').includes('Disallow: /')) && robotsGroups.some(group => group.split('\n').includes('User-agent: OAI-SearchBot') && group.split('\n').includes('Allow: /')));

    const canonicalPage = await request(`/${renamedSlug}`, { redirect: 'follow' });
    const canonicalText = await canonicalPage.text();
    check('page metadata includes canonical URL', canonicalText.includes(`canonical" href="${ORIGIN}/${renamedSlug}`) || canonicalText.includes(`canonical" href="${ORIGIN}/${encodeURIComponent(renamedSlug)}`));
    const explicitContent = await request(`/content/${page.id}.md`, { headers: { accept: 'text/markdown' } });
    check('explicit page-ID Markdown endpoint works', explicitContent.status === 200 && (explicitContent.headers.get('content-type') || '').includes('text/markdown') && hasNoStore(explicitContent) && explicitContent.headers.get('x-robots-tag') === 'noindex');
    const previewUnauth = await fetch(new URL(`/api/crawler-preview?page=${page.id}`, ORIGIN));
    check('crawler preview requires auth', previewUnauth.status === 401 && hasNoStore(previewUnauth));
    const preview = await request(`/api/crawler-preview?page=${page.id}`);
    check('authenticated crawler preview works', preview.status === 200 && (await preview.text()).includes('QA Work Renamed') && hasNoStore(preview));
    const spoofed = await request(`/content/${page.id}.md`, { headers: { 'x-crawler-negotiated': '1', 'x-crawler-original-path': '/api/site' } });
    check('spoofed internal path cannot fetch private route', spoofed.status === 404 && hasNoStore(spoofed));

    const concurrentSettings = clone(settingsCheck.published);
    concurrentSettings.brand = 'Concurrent settings retained';
    await Promise.all([savePage(renamedData, home.id, false), request('/api/site-settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ settings: concurrentSettings, publish: true }) })]);
    const afterConcurrent = await json(await request('/api/site-settings'));
    check('concurrent page save and settings publish preserve settings', afterConcurrent.published.brand === concurrentSettings.brand);
    const exported = await request('/api/export');
    const manifest = await json(exported);
    check('export includes site settings', exported.ok && manifest?.document?.siteSettings?.published?.crawler?.markdown === true);
    const { mkdtemp, writeFile, readFile } = await import('node:fs/promises');
    const { execFileSync } = await import('node:child_process');
    const dir = await mkdtemp('/tmp/open-canvas-import-qa-');
    await writeFile(`${dir}/manifest.json`, JSON.stringify(manifest));
    execFileSync(process.execPath, ['scripts/import-site-export.mjs', '--manifest', `${dir}/manifest.json`, '--origin', ORIGIN, '--data-dir', `${dir}/data`], { stdio: 'pipe' });
    const imported = JSON.parse(await readFile(`${dir}/data/documents/home.json`, 'utf8'));
    check('export/import round trip preserves shared settings and page links', JSON.stringify(imported.siteSettings) === JSON.stringify(manifest.document.siteSettings) && JSON.stringify(imported.pages) === JSON.stringify(manifest.document.pages));
    report.completedAt = new Date().toISOString();
    report.ok = report.failures.length === 0;
  } catch (error) {
    report.ok = false;
    report.failures.push({ name: 'verifier exception', ok: false, detail: error instanceof Error ? error.stack : String(error) });
  }
  await import('node:fs/promises').then(({ writeFile }) => writeFile('/tmp/open-canvas-feature-qa.json', `${JSON.stringify(report, null, 2)}\n`));
  console.log(JSON.stringify({ ok: report.ok, failures: report.failures.length, report: '/tmp/open-canvas-feature-qa.json' }, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

await main();
