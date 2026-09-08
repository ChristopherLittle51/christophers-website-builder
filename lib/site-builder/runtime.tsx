'use client';

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { buildCalendlyEmbedUrl } from '../embed-utils';
import { formatGitHubCount, formatGitHubDate, parseGitHubRepository } from '../github';
import { typographyStyle } from '../typography';
import { MarkdownText } from '../markdown-text';
import { fontStyle, imagePosition } from './shared';

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(options: { url: string; parentElement: HTMLElement; prefill: Record<string, never>; utm: Record<string, never> }): void;
    };
  }
}

export const socialPlatformOptions = [
  { label: 'Facebook', value: 'facebook' }, { label: 'Instagram', value: 'instagram' }, { label: 'LinkedIn', value: 'linkedin' },
  { label: 'YouTube', value: 'youtube' }, { label: 'X / Twitter', value: 'x' }, { label: 'TikTok', value: 'tiktok' },
  { label: 'Pinterest', value: 'pinterest' }, { label: 'Threads', value: 'threads' }, { label: 'Bluesky', value: 'bluesky' },
  { label: 'GitHub', value: 'github' }, { label: 'Discord', value: 'discord' }, { label: 'Twitch', value: 'twitch' },
  { label: 'Mastodon', value: 'mastodon' }, { label: 'Email', value: 'email' }, { label: 'Website', value: 'website' },
  { label: 'Custom link', value: 'custom' },
];
export const socialIconName = (icon?: string, platform?: string) => {
  const candidate = (icon || platform || 'custom').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (candidate === 'twitter') return 'x';
  if (candidate === 'arena') return 'custom';
  return socialPlatformOptions.some((option) => option.value === candidate) ? candidate : 'custom';
};

export function SocialIcon({ name }: { name: string }) {
  const commonProps = { className: 'builder-social-icons__icon', viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;
  switch (name) {
    case 'facebook': return <svg {...commonProps}><path d="M14 8h3V4.5c-.5-.1-1.8-.2-3.3-.2-3.2 0-5.4 2-5.4 5.6V13H5v4h3.3v7h4.1v-7h3.4l.5-4h-3.9V10.3c0-1.2.3-2.3 1.6-2.3Z" /></svg>;
    case 'instagram': return <svg {...commonProps}><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.7" r="1.2" /></svg>;
    case 'linkedin': return <svg {...commonProps}><rect x="3" y="9" width="4" height="12" rx=".5" /><circle cx="5" cy="5" r="2.2" /><path d="M10 9h4v1.7c1-1.4 2.3-2.1 4-2.1 3 0 4 2 4 5.2V21h-4v-6.4c0-1.7-.6-2.7-2-2.7-1.4 0-2 1-2 3V21h-4V9Z" /></svg>;
    case 'youtube': return <svg {...commonProps}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 6 3-6 3V9Z" fill="var(--social-icon-cutout,white)" /></svg>;
    case 'x': return <svg {...commonProps}><path d="M4 3h4.8l4.1 5.7L18 3h2l-6.2 7.2L21 21h-4.8l-4.6-6.4L6 21H4l6.7-7.9L4 3Zm4 2 9.2 14H19L9.8 5H8Z" /></svg>;
    case 'tiktok': return <svg {...commonProps}><path d="M14 3h3c.3 2.2 1.6 3.6 4 4v3c-1.6 0-3-.5-4-1.3V16a5.5 5.5 0 1 1-5.5-5.5H12v3c-.2-.1-.4-.1-.7-.1a2.6 2.6 0 1 0 2.7 2.7V3Z" /></svg>;
    case 'pinterest': return <svg {...commonProps}><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-1.6 0-3.4.4-5l1.3-5.4s-.3-.8-.3-2c0-1.9 1.1-3.3 2.5-3.3 1.2 0 1.7.9 1.7 2 0 1.2-.7 2.9-1.1 4.5-.6 1.4.7 2.6 2.1 2.6 2.5 0 4.4-2.6 4.4-6.4 0-3.4-2.4-5.7-5.9-5.7-4 0-6.4 3-6.4 6.1 0 1.2.5 2.5 1.1 3.2.1.1.1.3.1.5l-.4 1.6c-.1.5-.5.6-.9.4-2.9-1.3-4.7-5.5-4.7-8.8C2.3 2.4 6.2-2 13.5-2 19.4-2 24 2.2 24 7.8c0 5.8-3.7 10.5-8.8 10.5-1.7 0-3.3-.9-3.9-2l-1 4c-.4 1.5-1.4 3.4-2.1 4.5 1.2.4 2.5.7 3.8.7A10 10 0 0 0 12 2Z" transform="scale(.82) translate(2.6 1.2)" /></svg>;
    case 'threads': return <svg {...commonProps}><path d="M12.4 2c-5.7 0-9.2 3.7-9.2 10.1 0 6.3 3.5 9.9 9.6 9.9 5.1 0 8-2.8 8-6.5 0-2.7-1.5-4.8-4.2-5.7-.3-3.4-2.2-5.2-5.4-5.2-2.3 0-4.2 1-5.3 2.8l2.3 1.4c.7-1.1 1.7-1.7 3-1.7 1.6 0 2.5.7 2.8 2.2h-2c-3.8 0-6.1 1.8-6.1 4.8 0 2.8 2.2 4.7 5.3 4.7 2.9 0 5-1.7 5.4-4.5 1 .6 1.5 1.5 1.5 2.7 0 2.3-2 3.8-5.3 3.8-4.5 0-6.9-2.7-6.9-7.6 0-5 2.4-7.8 6.6-7.8 3.3 0 5.5 1.6 6.5 4.7l2.6-.8C20.3 4.5 17.2 2 12.4 2Zm-1.2 14.3c-1.6 0-2.7-.8-2.7-2.1 0-1.4 1.2-2.2 3.5-2.2h2.1c-.1 2.7-1 4.3-2.9 4.3Z" /></svg>;
    case 'bluesky': return <svg {...commonProps}><path d="M12 10.8C10.9 8.7 7.9 4.7 5.1 2.8 2.5 1 1.5 1.3.8 1.6.1 2-.1 3.2-.1 4c0 .8.4 6.3.7 7.3.9 3 3.9 4 6.6 3.6-4.7.7-8.9 2.4-3.4 8.5 6 6.2 8.2-1.3 8.2-1.3s2.2 7.5 8.2 1.3c5.5-6.1 1.3-7.8-3.4-8.5 2.7.4 5.7-.6 6.6-3.6.3-1 .7-6.5.7-7.3 0-.8-.2-2-.9-2.4-.7-.3-1.7-.6-4.3 1.2-2.8 1.9-5.8 5.9-6.9 8Z" transform="scale(.82) translate(2.6 0)" /></svg>;
    case 'github': return <svg {...commonProps}><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.3-2.3-.3-4.7-1.1-4.7-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.8 9.8 0 0 1 5.1 0c2-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1.1 2.7c0 3.9-2.4 4.7-4.7 5 .4.3.7 1 .7 2V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" /></svg>;
    case 'discord': return <svg {...commonProps}><path d="M19.5 5.3A17 17 0 0 0 15.3 4l-.5 1a15 15 0 0 0-5.6 0l-.5-1a17 17 0 0 0-4.2 1.3C1.8 9.3 1.1 13.2 1.5 17a17 17 0 0 0 5.2 2.6l1.2-1.7-1.7-.8.4-.3c3.3 1.5 7.6 1.5 10.8 0l.5.3-1.8.8 1.2 1.7a17 17 0 0 0 5.2-2.6c.5-4.4-.8-8.2-3-11.7ZM8.4 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" /></svg>;
    case 'twitch': return <svg {...commonProps}><path d="M4 2 1 5v15h5v3h3l3-3h4l7-7V2H4Zm17 10-4 4h-5l-3 3v-3H5V4h16v8Zm-4-5h-2v6h2V7Zm-5 0h-2v6h2V7Z" /></svg>;
    case 'mastodon': return <svg {...commonProps}><path d="M21.6 8.1c0-4.4-2.9-5.7-2.9-5.7C17.2 1.7 14.7 1.4 12 1.4h-.1c-2.7 0-5.2.3-6.7 1C5.2 2.4 2.3 3.7 2.3 8.1c0 1 .0 2.2.1 3.5.4 4.3 2.5 8.5 7.6 9.5 2.4.5 4.4.6 6 .3 2.9-.5 4.5-1.8 4.5-1.8l-.1-2.3s-2.1.7-4.4.6c-2.3-.1-4.8-.3-5.2-3a5.8 5.8 0 0 1-.1-.8s2.3.6 5.2.7c1.8.1 3.5-.1 5.2-.3 3.2-.4 6-2.6 6.4-4.5.5-2.9.4-7.1.4-7.1Zm-4 6.1h-3.1V8.7c0-1.2-.5-1.8-1.4-1.8-1 0-1.5.7-1.5 2v3h-3V9c0-1.3-.5-2-1.5-2-.9 0-1.4.6-1.4 1.8v5.5H2.6V8.6c0-1.2.3-2.2.9-3 .7-.8 1.5-1.2 2.6-1.2 1.3 0 2.3.5 2.9 1.5l.6 1 .6-1c.6-1 1.6-1.5 2.9-1.5 1.1 0 2 .4 2.6 1.2.6.8.9 1.8.9 3v5.6Z" transform="scale(.78) translate(3 3)" /></svg>;
    case 'email': return <svg {...commonProps}><rect x="2.5" y="4.5" width="19" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
    case 'website': return <svg {...commonProps}><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 12h18M12 3c3 3.1 3 14.9 0 18M12 3c-3 3.1-3 14.9 0 18" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
    default: return <svg {...commonProps}><path d="M9.5 14.5 14.5 9M7.7 17.7l-1.4 1.4a3 3 0 0 1-4.2-4.2l4.2-4.2a3 3 0 0 1 4.2 0M16.3 6.3l1.4-1.4a3 3 0 0 1 4.2 4.2l-4.2 4.2a3 3 0 0 1-4.2 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>;
  }
}
export const stableNameHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};
export const generatedSectionName = (type: string, id: unknown) => {
  const typeSlug = type.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
  return `generated-${typeSlug}-${stableNameHash(`${type}|${typeof id === 'string' ? id : ''}`)}`;
};

// Add the anchor to the block's existing root element so it does not introduce
// a layout wrapper around blocks that participate in grids or flex layouts.
export function withSectionAnchor(render: (props: any) => ReactNode): any {
  return (props: any) => {
    const rendered = render(props);
    if (!isValidElement(rendered)) return rendered;
    const name = typeof props.name === 'string' ? props.name.trim() : '';
    const id = name || (typeof props.id === 'string' ? props.id : undefined);
    return cloneElement(rendered as ReactElement<any>, id ? { id } : undefined);
  };
}

// Every block gets an optional, block-wide override so text nested in repeaters
// and helper renderers can be styled without changing the authored content.
export function withTypographyOverride(render: (props: any) => ReactNode): any {
  return (props: any) => {
    const rendered = render(props);
    if (!isValidElement(rendered)) return rendered;
    const typography = typographyStyle({ font: props.typographyFont, fontWeight: props.typographyFontWeight, fontStyle: props.typographyFontStyle, letterSpacing: props.typographyLetterSpacing, wordSpacing: props.typographyWordSpacing, lineHeight: props.typographyLineHeight, textDecoration: props.typographyTextDecoration, textTransform: props.typographyTextTransform, fontKerning: props.typographyFontKerning });
    const classes = Object.keys(typography).map(key => `builder-typography-${key}`).join(' ');
    return cloneElement(rendered as ReactElement<any>, { className: `${(rendered.props as { className?: string }).className || ''} ${classes}`.trim(), style: { ...typography, ...((rendered.props as { style?: CSSProperties }).style || {}) } });
  };
}

export function BeforeAfterView({ before, after, beforeAlt, afterAlt, beforeCrop, afterCrop, label }: { before: string; after: string; beforeAlt: string; afterAlt: string; beforeCrop?: string; afterCrop?: string; label: ReactNode }) {
  const [position, setPosition] = useState(50);
  return <section className="builder-compare"><div className="builder-compare__heading"><h2>{label}</h2><span>{position}%</span></div><div className="builder-compare__stage">
    <img src={before} alt={beforeAlt || ''} style={imagePosition(beforeCrop)} /><div className="builder-compare__after" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><img src={after} alt={afterAlt || ''} style={imagePosition(afterCrop)} /></div><span className="builder-compare__line" style={{ left: `${position}%` }} aria-hidden="true" />
  </div><label className="builder-compare__control"><span>Before</span><input aria-label="Compare before and after images" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} /><span>After</span></label></section>;
}

export function NoticeView({ title, message, tone, dismissible, className, style, id }: { title: ReactNode; message: ReactNode; tone: string; dismissible: string; className?: string; style?: CSSProperties; id?: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <aside id={id} className={`builder-notice builder-notice--${tone} ${className || ''}`.trim()} style={style} role="status"><div><strong>{title}</strong><p>{message}</p></div>{dismissible === 'hint' ? <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss notice">×</button> : null}</aside>;
}

export function HeadingPrimitive({ level, text, font, size, tracking, align, fontWeight, fontStyle: textStyle, letterSpacing, wordSpacing, lineHeight, textDecoration, textTransform, fontKerning, className, style, id }: { level: string; text: ReactNode; font: string; size: string; tracking: string; align: string; fontWeight?: string; fontStyle?: string; letterSpacing?: string; wordSpacing?: string; lineHeight?: string; textDecoration?: string; textTransform?: string; fontKerning?: string; className?: string; style?: CSSProperties; id?: string }) {
  const Tag = (['h1', 'h2', 'h3'].includes(level) ? level : 'h2') as 'h1' | 'h2' | 'h3';
  return <Tag id={id} className={`builder-heading builder-heading--${size} builder-heading--tracking-${tracking} builder-align--${align} ${className || ''}`.trim()} style={{ ...style, ...fontStyle(font), ...typographyStyle({ fontWeight, fontStyle: textStyle, letterSpacing, wordSpacing, lineHeight, textDecoration, textTransform, fontKerning }) }}><MarkdownText>{text}</MarkdownText></Tag>;
}

export function videoEmbedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : '';
    }
    if (url.hostname.endsWith('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch { return ''; }
  return '';
}

export function CalendlyWidget({ url, height, isEditing }: { url: string; height: number; isEditing: boolean }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const parentElement = parentRef.current;
    if (!parentElement || !url) return;
    let cancelled = false;
    const initialize = () => {
      if (cancelled || !window.Calendly || !parentRef.current) return;
      parentRef.current.replaceChildren();
      window.Calendly.initInlineWidget({ url, parentElement: parentRef.current, prefill: {}, utm: {} });
      setFailed(false);
    };
    const handleError = () => { if (!cancelled) setFailed(true); };
    const existing = document.querySelector<HTMLScriptElement>('script[data-open-canvas-calendly]');
    const script = existing || document.createElement('script');
    script.addEventListener('load', initialize);
    script.addEventListener('error', handleError);
    if (!existing) {
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.dataset.openCanvasCalendly = 'true';
      document.head.appendChild(script);
    } else if (window.Calendly) {
      initialize();
    }
    return () => {
      cancelled = true;
      script.removeEventListener('load', initialize);
      script.removeEventListener('error', handleError);
      parentElement.replaceChildren();
    };
  }, [url]);

  return <div className={`builder-calendly__stage${isEditing ? ' builder-embed-stage--editing' : ''}`} style={{ height }}>
    <div className="builder-calendly__widget" ref={parentRef} />
    {failed ? <a className="builder-calendly__fallback" href={url} target="_blank" rel="noreferrer">Open scheduling page ↗</a> : null}
    {isEditing ? <span className="builder-embed-stage__label">Calendly preview · edit from the sidebar</span> : null}
  </div>;
}

type GitHubRepository = {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string | null; name: string } | null;
  topics?: string[];
  updated_at: string | null;
};

export function GitHubRepositoryView({ repoUrl, title, description, stats, topics, theme, isEditing, className, style, id }: { repoUrl: string; title: string; description: string; stats: string; topics: string; theme: string; isEditing: boolean; className?: string; style?: CSSProperties; id?: string }) {
  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const parsed = parseGitHubRepository(repoUrl || '');

  useEffect(() => {
    if (!parsed) {
      setRepository(null);
      setState('idle');
      setError('');
      return;
    }
    const controller = new AbortController();
    setState('loading');
    setError('');
    fetch(`https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 403 ? 'GitHub rate limit reached. Try again later.' : response.status === 404 ? 'Repository not found or not public.' : 'GitHub could not load this repository.');
        return response.json() as Promise<GitHubRepository>;
      })
      .then((result) => { setRepository(result); setState('ready'); })
      .catch((fetchError: unknown) => { if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return; setRepository(null); setState('error'); setError(fetchError instanceof Error ? fetchError.message : 'GitHub could not load this repository.'); });
    return () => controller.abort();
  }, [parsed?.owner, parsed?.repo]);

  const heading = title || repository?.name || (parsed ? `${parsed.owner}/${parsed.repo}` : 'GitHub repository');
  return <section id={id} className={`builder-github builder-theme--${theme} ${className || ''}`.trim()} style={style}>
    <div className="builder-github__topline"><p className="builder-kicker">GitHub repository</p><span aria-hidden="true">◈</span></div>
    <div className="builder-github__heading"><h2>{heading}</h2>{repository?.html_url ? <a href={repository.html_url} target="_blank" rel="noreferrer">View on GitHub ↗</a> : null}</div>
    {!parsed ? <div className="builder-github__message">Add a public GitHub repository URL in the sidebar to connect this block.</div> : state === 'loading' ? <div className="builder-github__message" role="status">Reading repository details…</div> : state === 'error' ? <div className="builder-github__message builder-github__message--error" role="alert">{error}</div> : repository ? <>
      {description !== 'hide' ? <p className="builder-github__description">{repository.description || 'No repository description yet.'}</p> : null}
      {stats !== 'hide' ? <dl className="builder-github__stats"><div><dt>Stars</dt><dd>{formatGitHubCount(repository.stargazers_count)}</dd></div><div><dt>Forks</dt><dd>{formatGitHubCount(repository.forks_count)}</dd></div><div><dt>Issues</dt><dd>{formatGitHubCount(repository.open_issues_count)}</dd></div><div><dt>Watchers</dt><dd>{formatGitHubCount(repository.watchers_count)}</dd></div><div><dt>Language</dt><dd>{repository.language || '—'}</dd></div><div><dt>Updated</dt><dd>{formatGitHubDate(repository.updated_at)}</dd></div></dl> : null}
      {topics !== 'hide' && repository.topics?.length ? <ul className="builder-github__topics" aria-label="Repository topics">{repository.topics.slice(0, 8).map((topic) => <li key={topic}>#{topic}</li>)}</ul> : null}
      {repository.license ? <p className="builder-github__license">{repository.license.spdx_id || repository.license.name}</p> : null}
    </> : null}
    {isEditing ? <span className="builder-embed-stage__label">Live GitHub data · edit from the sidebar</span> : null}
  </section>;
}

type FilmStripFrame = { image: string; crop?: string; alt: string; caption: string };

export function ScrollFilmStrip({ title, stock, direction, frames, theme, isEditing, className, style, id }: { title: ReactNode; stock: ReactNode; direction: string; frames: FilmStripFrame[]; theme: string; isEditing: boolean; className?: string; style?: CSSProperties; id?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollHeight, setScrollHeight] = useState<number>();
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    const viewport = track?.parentElement;
    if (!section || !sticky || !track || !viewport || direction === 'vertical' || isEditing) {
      setScrollHeight(undefined);
      setHasHorizontalOverflow(false);
      if (track) track.style.transform = '';
      return;
    }

    let distance = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(Math.max(-section.getBoundingClientRect().top, 0), distance);
      track.style.transform = `translate3d(${-progress}px,0,0)`;
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const measure = () => {
      // Stop at the last photo, not the track's padded/intrinsic scroll box.
      // Both rectangles include the current translation, which cancels out.
      const lastPhoto = track.lastElementChild?.querySelector('img');
      const photoEnd = lastPhoto
        ? lastPhoto.getBoundingClientRect().right - track.getBoundingClientRect().left
        : 0;
      distance = Math.max(0, photoEnd - viewport.clientWidth);
      const hasOverflow = distance > 0;
      setHasHorizontalOverflow(hasOverflow);
      setScrollHeight(hasOverflow ? sticky.getBoundingClientRect().height + distance : undefined);
      requestUpdate();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(sticky);
    observer.observe(viewport);
    observer.observe(track);
    for (const photo of track.querySelectorAll('img')) observer.observe(photo);
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', measure);
      if (frame) window.cancelAnimationFrame(frame);
      track.style.transform = '';
    };
  }, [direction, frames, isEditing]);

  return <section id={id} ref={sectionRef} className={`builder-filmstrip builder-filmstrip--${direction}${!hasHorizontalOverflow ? ' builder-filmstrip--static' : ''}${isEditing ? ' builder-filmstrip--editing' : ''} builder-theme--${theme} ${className || ''}`.trim()} style={{ ...(scrollHeight ? { height: scrollHeight } : {}), ...style }}><div className="builder-filmstrip__sticky" ref={stickyRef}><header><p className="builder-kicker">{stock}</p><h2>{title}</h2></header><div className="builder-filmstrip__track-viewport"><div className="builder-filmstrip__track" ref={trackRef}>{(frames || []).map((filmFrame, index) => <figure key={`${filmFrame.image}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><img src={filmFrame.image} alt={filmFrame.alt || ''} style={imagePosition(filmFrame.crop)} /><figcaption>{filmFrame.caption}</figcaption></figure>)}</div></div></div></section>;
}


