'use client';

import type { CSSProperties } from 'react';
import { buildCalendlyEmbedUrl } from '../../embed-utils';
import { nestedAllowlist } from '../catalog';
import { alignOptions, colorField, cropField, embedHeights, fontField, fontStyle, imageField, imagePosition, qolGapOptions, qolPaddingOptions, qolRadiusOptions, qolToneOptions, sizeOptions, themeOptions, trackingOptions, typeClass, videoField } from '../shared';
import { BeforeAfterView, CalendlyWidget, GitHubRepositoryView, HeadingPrimitive, NoticeView, ScrollFilmStrip, SocialIcon, socialPlatformOptions, videoEmbedUrl } from '../runtime';

export const developerComponents: Record<string, any> = {
  CodeSnippetBlock: {
        label: 'Code snippet',
        fields: { eyebrow: { type: 'text', label: 'Language label', contentEditable: true }, title: { type: 'text', label: 'Snippet title', contentEditable: true }, code: { type: 'textarea', label: 'Code', contentEditable: true }, filename: { type: 'text', label: 'Filename' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
        defaultProps: { eyebrow: 'TypeScript', title: 'A small boundary with a clear job.', filename: 'lib/format.ts', code: "export function formatName(name: string) {\n  return name.trim().replace(/\\s+/g, ' ');\n}", theme: 'black' },
        render: ({ eyebrow, title, code, filename, theme }) => <section className={'builder-dev-code builder-theme--' + theme}><header><span>{eyebrow}</span><strong>{filename}</strong></header><h2>{title}</h2><pre><code>{code}</code></pre></section>,
  },
  TerminalBlock: {
        label: 'Terminal session',
        fields: { title: { type: 'text', label: 'Terminal title' }, prompt: { type: 'text', label: 'Prompt' }, lines: { type: 'array', label: 'Terminal lines', min: 1, max: 16, arrayFields: { text: { type: 'text', label: 'Line' }, kind: { type: 'radio', label: 'Line type', options: [{ label: 'Command', value: 'command' }, { label: 'Output', value: 'output' }, { label: 'Success', value: 'success' }] } }, defaultItemProps: (index) => ({ text: index === 0 ? 'npm run build' : 'Build completed successfully.', kind: index === 0 ? 'command' : 'success' }), getItemSummary: (item, index) => item.text || 'Line ' + ((index || 0) + 1) } },
        defaultProps: { title: 'project — zsh', prompt: 'sam@studio project %', lines: [{ text: 'npm run build', kind: 'command' }, { text: '▲ Compiled in 1.8s', kind: 'output' }, { text: 'Build completed successfully.', kind: 'success' }] },
        render: ({ title, prompt, lines }) => (
          <section className="builder-dev-terminal" aria-label={title || 'Terminal session'}>
            <header className="builder-dev-terminal__titlebar">
              <div className="builder-dev-terminal__controls" aria-hidden="true"><i /><i /><i /></div>
              <span className="builder-dev-terminal__title">{title}</span>
            </header>
            <div className="builder-dev-terminal__body">
              {(lines || []).map((line: { text: string; kind: string }, index: number) => (
                <p className={'builder-dev-terminal__line builder-dev-terminal__line--' + (line.kind || 'output')} key={index}>
                  {line.kind === 'command' && prompt ? <span className="builder-dev-terminal__prompt">{prompt}{' '}</span> : null}
                  {line.text}
                </p>
              ))}
              <p className="builder-dev-terminal__line" aria-hidden="true"><span className="builder-dev-terminal__prompt">{prompt}{' '}</span><span className="builder-dev-terminal__cursor" /></p>
            </div>
          </section>
        ),
  },
  TechStackBlock: {
        label: 'Tech stack',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, items: { type: 'array', label: 'Technologies', min: 2, max: 16, arrayFields: { name: { type: 'text', label: 'Name' }, detail: { type: 'text', label: 'Role / detail' }, mark: { type: 'text', label: 'Mark' } }, defaultItemProps: (index) => ({ name: 'Tool ' + (index + 1), detail: 'A reliable part of the toolkit', mark: '◎' }), getItemSummary: (item, index) => item.name || 'Tool ' + ((index || 0) + 1) } },
        defaultProps: { eyebrow: 'The tools behind the work', title: 'A considered stack.', items: [{ name: 'TypeScript', detail: 'Typed interfaces', mark: 'TS' }, { name: 'React', detail: 'Composable UI', mark: '◒' }, { name: 'Postgres', detail: 'Durable data', mark: 'PG' }, { name: 'Playwright', detail: 'Confident releases', mark: '▶' }] },
        render: ({ eyebrow, title, items }) => <section className="builder-dev-stack"><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><ul>{(items || []).map((item: { name: string; detail: string; mark: string }, index: number) => <li key={item.name + '-' + index}><b>{item.mark}</b><span><strong>{item.name}</strong><small>{item.detail}</small></span><em>↗</em></li>)}</ul></section>,
  },
  DeveloperFeaturesBlock: {
        label: 'Developer features',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, columns: { type: 'radio', label: 'Columns', options: [{ label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }] }, items: { type: 'array', label: 'Features', min: 2, max: 9, arrayFields: { number: { type: 'text', label: 'Number' }, title: { type: 'text', label: 'Feature title' }, body: { type: 'textarea', label: 'Description' }, tag: { type: 'text', label: 'Tag' } }, defaultItemProps: (index) => ({ number: String(index + 1).padStart(2, '0'), title: 'A sharp edge', body: 'Describe the useful detail that makes this work feel considered.', tag: 'DETAIL' }), getItemSummary: (item, index) => item.title || 'Feature ' + ((index || 0) + 1) } },
        defaultProps: { eyebrow: 'What I care about', title: 'Good software feels inevitable.', columns: 'three', items: [{ number: '01', title: 'Clear by default', body: 'Interfaces should explain themselves before they ask for attention.', tag: 'UX' }, { number: '02', title: 'Built to last', body: 'Simple boundaries keep a product legible as it grows.', tag: 'SYSTEMS' }, { number: '03', title: 'Fast where it matters', body: 'Performance is part of the craft, not a final polish pass.', tag: 'SPEED' }] },
        render: ({ eyebrow, title, columns, items }) => <section className={'builder-dev-features builder-dev-features--' + columns}><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><div>{(items || []).map((item: { number: string; title: string; body: string; tag: string }, index: number) => <article key={item.title + '-' + index}><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p><small>{item.tag}</small></article>)}</div></section>,
  },
  ApiEndpointBlock: {
        label: 'API endpoint',
        fields: { method: { type: 'radio', label: 'HTTP method', options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }, { label: 'DELETE', value: 'DELETE' }] }, path: { type: 'text', label: 'Endpoint path' }, title: { type: 'text', label: 'Endpoint title', contentEditable: true }, description: { type: 'textarea', label: 'Description', contentEditable: true }, response: { type: 'textarea', label: 'Response example', contentEditable: true }, auth: { type: 'text', label: 'Authentication note' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
        defaultProps: { method: 'GET', path: '/v1/projects/:id', title: 'Read a project', description: 'Fetch the public project shape by its stable identifier.', response: '{\n  \"id\": \"proj_7f2\",\n  \"status\": \"active\"\n}', auth: 'Public · rate limited', theme: 'paper' },
        render: ({ method, path, title, description, response, auth, theme }) => <section className={'builder-dev-endpoint builder-theme--' + theme}><header><span className={'builder-dev-endpoint__method builder-dev-endpoint__method--' + String(method).toLowerCase()}>{method}</span><code>{path}</code></header><h2>{title}</h2><p>{description}</p><div className="builder-dev-endpoint__response"><span>Response · 200 OK</span><pre>{response}</pre></div><small>{auth}</small></section>,
  },
  ArchitectureBlock: {
        label: 'Architecture map',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, note: { type: 'textarea', label: 'Note', contentEditable: true }, nodes: { type: 'array', label: 'Layers', min: 2, max: 8, arrayFields: { label: { type: 'text', label: 'Layer label' }, detail: { type: 'text', label: 'Layer detail' }, color: colorField('Layer color') }, defaultItemProps: (index) => ({ label: 'Layer ' + (index + 1), detail: 'Describe this boundary.', color: '#d8ff00' }), getItemSummary: (item, index) => item.label || 'Layer ' + ((index || 0) + 1) } },
        defaultProps: { eyebrow: 'How the pieces meet', title: 'Small boundaries. Strong seams.', note: 'A useful architecture is a map of responsibilities, not a monument to complexity.', nodes: [{ label: 'Interface', detail: 'The human-facing surface', color: '#d8ff00' }, { label: 'Application', detail: 'Rules and orchestration', color: '#8bd8ff' }, { label: 'Data', detail: 'Reliable persistence', color: '#ff9ac6' }] },
        render: ({ eyebrow, title, note, nodes }) => <section className="builder-dev-architecture"><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><div className="builder-dev-architecture__map">{(nodes || []).map((node: { label: string; detail: string; color: string }, index: number) => <div key={node.label + '-' + index}><span className="builder-dev-architecture__node" style={{ '--node-color': node.color || '#d8ff00' } as CSSProperties}>{String(index + 1).padStart(2, '0')}</span><strong>{node.label}</strong><small>{node.detail}</small>{index < (nodes || []).length - 1 ? <i aria-hidden="true">↓</i> : null}</div>)}</div><p className="builder-dev-architecture__note">{note}</p></section>,
  },
  ChangelogBlock: {
        label: 'Changelog',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, releases: { type: 'array', label: 'Releases', min: 1, max: 12, arrayFields: { version: { type: 'text', label: 'Version' }, date: { type: 'text', label: 'Date' }, summary: { type: 'text', label: 'Summary' }, changes: { type: 'textarea', label: 'Changes' } }, defaultItemProps: (index) => ({ version: 'v' + (index + 1) + '.0', date: 'AUG 2026', summary: 'A thoughtful release', changes: 'A useful improvement shipped with care.' }), getItemSummary: (item, index) => item.version || 'Release ' + ((index || 0) + 1) } },
        defaultProps: { eyebrow: 'Release notes', title: 'What changed.', releases: [{ version: 'v2.4.0', date: 'AUG 28, 2026', summary: 'A faster way to find the signal.', changes: 'Added keyboard navigation, clearer empty states, and a smaller payload.' }, { version: 'v2.3.0', date: 'JUL 12, 2026', summary: 'More room for good work.', changes: 'Introduced project spaces and a calmer review flow.' }, { version: 'v2.2.1', date: 'JUN 03, 2026', summary: 'Polish at the edges.', changes: 'Fixed focus states and tightened mobile layout behavior.' }] },
        render: ({ eyebrow, title, releases }) => <section className="builder-dev-changelog"><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><ol>{(releases || []).map((release: { version: string; date: string; summary: string; changes: string }, index: number) => <li key={release.version + '-' + index}><div><strong>{release.version}</strong><time>{release.date}</time></div><h3>{release.summary}</h3><p>{release.changes}</p></li>)}</ol></section>,
  },
  OpenSourceBlock: {
        label: 'Open source note',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, body: { type: 'textarea', label: 'Description', contentEditable: true }, repoLabel: { type: 'text', label: 'Repository label' }, repoUrl: { type: 'text', label: 'Repository URL' }, license: { type: 'text', label: 'License' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
        defaultProps: { eyebrow: 'Public by design', title: 'Tools worth sharing.', body: 'A small collection of utilities, experiments, and patterns I keep useful in the open.', repoLabel: 'github.com/studio/toolkit', repoUrl: '#', license: 'MIT licensed', theme: 'lime' },
        render: ({ eyebrow, title, body, repoLabel, repoUrl, license, theme }) => <section className={'builder-dev-open-source builder-theme--' + theme}><div><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2><p>{body}</p></div><a href={repoUrl || '#'}><span>{repoLabel}</span><strong>↗</strong></a><small>{license}</small></section>,
  },
  DeveloperStatsBlock: {
        label: 'Developer metrics',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, items: { type: 'array', label: 'Metrics', min: 2, max: 8, arrayFields: { value: { type: 'text', label: 'Value' }, label: { type: 'text', label: 'Label' }, detail: { type: 'text', label: 'Detail' } }, defaultItemProps: (index) => ({ value: '—', label: 'Metric ' + (index + 1), detail: 'Add context.' }), getItemSummary: (item, index) => (item.value || '—') + ' · ' + (item.label || 'Metric ' + ((index || 0) + 1)) } },
        defaultProps: { eyebrow: 'The numbers behind the practice', title: 'Measured, where it helps.', items: [{ value: '99.98%', label: 'Uptime', detail: 'Last 90 days' }, { value: '42ms', label: 'Median response', detail: 'Production API' }, { value: '0', label: 'Open regrets', detail: 'Still iterating' }] },
        render: ({ eyebrow, title, items }) => <section className="builder-dev-stats"><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><div>{(items || []).map((item: { value: string; label: string; detail: string }, index: number) => <article key={item.label + '-' + index}><strong>{item.value}</strong><span>{item.label}</span><small>{item.detail}</small></article>)}</div></section>,
  },
  DocsCalloutBlock: {
        label: 'Documentation callout',
        fields: { type: { type: 'radio', label: 'Callout type', options: [{ label: 'Tip', value: 'tip' }, { label: 'Warning', value: 'warning' }, { label: 'Note', value: 'note' }] }, title: { type: 'text', label: 'Title', contentEditable: true }, body: { type: 'textarea', label: 'Body', contentEditable: true }, code: { type: 'text', label: 'Inline code' }, linkLabel: { type: 'text', label: 'Link label' }, linkUrl: { type: 'text', label: 'Link URL' } },
        defaultProps: { type: 'tip', title: 'Keep the boundary small.', body: 'When a component has one clear job, it is easier to test, document, and trust.', code: 'single responsibility', linkLabel: 'Read the principle ↗', linkUrl: '#' },
        render: ({ type, title, body, code, linkLabel, linkUrl }) => <aside className={'builder-dev-callout builder-dev-callout--' + (type || 'note')}><span className="builder-dev-callout__mark">{type === 'warning' ? '!' : type === 'tip' ? '↗' : 'i'}</span><div><p className="builder-kicker">{type || 'note'}</p><h2>{title}</h2><p>{body} {code ? <code>{code}</code> : null}</p>{linkLabel ? <a href={linkUrl || '#'}>{linkLabel}</a> : null}</div></aside>,
  },
  DeveloperCtaBlock: {
        label: 'Developer CTA',
        fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, body: { type: 'textarea', label: 'Supporting text', contentEditable: true }, primaryLabel: { type: 'text', label: 'Primary label', contentEditable: true }, primaryUrl: { type: 'text', label: 'Primary URL' }, secondaryLabel: { type: 'text', label: 'Secondary label', contentEditable: true }, secondaryUrl: { type: 'text', label: 'Secondary URL' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
        defaultProps: { eyebrow: 'Have a useful problem?', title: 'LET’S BUILD THE NEXT RIGHT THING.', body: 'Tell me what is stuck, what matters, and where you want to go next.', primaryLabel: 'Start a conversation ↗', primaryUrl: 'mailto:hello@example.com', secondaryLabel: 'Browse the work', secondaryUrl: '#work', theme: 'black' },
        render: ({ eyebrow, title, body, primaryLabel, primaryUrl, secondaryLabel, secondaryUrl, theme }) => <section className={'builder-dev-cta builder-theme--' + theme}><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2><p>{body}</p><div><a className="builder-dev-cta__primary" href={primaryUrl || '#'}>{primaryLabel}</a><a href={secondaryUrl || '#'}>{secondaryLabel}</a></div></section>,
  },
};

