'use client';

import type { Config, CustomFieldRender } from '@puckeditor/core';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { buildCalendlyEmbedUrl } from './embed-utils';
import { formatGitHubCount, formatGitHubDate, parseGitHubRepository } from './github';

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(options: { url: string; parentElement: HTMLElement; prefill: Record<string, never>; utm: Record<string, never> }): void;
    };
  }
}

type MediaFieldProps = { label: string; value: string; onChange: (value: string) => void; readOnly?: boolean; kind: 'image' | 'video' };

const FONT_OPTIONS = [
  ['Inter — precise sans', 'inter'], ['Manrope — warm geometric', 'manrope'], ['Space Grotesk — graphic sans', 'space-grotesk'],
  ['DM Sans — clean editorial', 'dm-sans'], ['Bricolage Grotesque — expressive', 'bricolage'], ['Playfair Display — high contrast serif', 'playfair'],
  ['Cormorant Garamond — artful serif', 'cormorant'], ['Fraunces — character serif', 'fraunces'], ['IBM Plex Mono — technical mono', 'ibm-plex-mono'],
].map(([label, value]) => ({ label, value }));

const FONT_FAMILIES: Record<string, string> = {
  inter: '"Inter Variable", Arial, sans-serif', manrope: '"Manrope Variable", Arial, sans-serif', 'space-grotesk': '"Space Grotesk Variable", Arial, sans-serif',
  'dm-sans': '"DM Sans Variable", Arial, sans-serif', bricolage: '"Bricolage Grotesque Variable", Arial, sans-serif', playfair: '"Playfair Display Variable", Georgia, serif',
  cormorant: '"Cormorant Garamond Variable", Georgia, serif', fraunces: '"Fraunces Variable", Georgia, serif', 'ibm-plex-mono': '"IBM Plex Mono", ui-monospace, monospace',
};

const fontField = (label: string) => ({ type: 'select' as const, label, options: [{ label: 'Use site default', value: 'inherit' }, ...FONT_OPTIONS] });
const directFontField = (label: string) => ({ type: 'select' as const, label, options: FONT_OPTIONS });
const fontStyle = (font?: string): CSSProperties => font && font !== 'inherit' ? { fontFamily: FONT_FAMILIES[font] } : {};

function MediaUpload({ label, value, onChange, readOnly, kind }: MediaFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const isVideo = kind === 'video';
  const upload = async (file?: File) => {
    if (!file || readOnly) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData(); formData.append('file', file);
      const response = await fetch('/api/media', { method: 'POST', body: formData });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Upload failed');
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : `Could not upload this ${kind}.`);
    }
    finally { setUploading(false); }
  };
  return <label className="image-field" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }}>
    <span className="image-field__label">{label}</span>{value ? (isVideo ? <video src={value} aria-label="Current video upload" muted playsInline preload="metadata" /> : <img src={value} alt="Current upload" />) : <span className="image-field__empty">Drop {isVideo ? 'an MP4 or WebM video' : 'an image'} here</span>}
    <span className="image-field__action">{uploading ? 'Uploading…' : `Choose ${kind}`}</span><input type="file" accept={isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif'} disabled={readOnly || uploading} onChange={(event) => void upload(event.target.files?.[0])} />
    {error ? <span className="image-field__error">{error}</span> : null}
  </label>;
}

const imageField = (label: string) => ({ type: 'custom' as const, render: (({ value, onChange, readOnly }) => <MediaUpload label={label} kind="image" value={value || ''} onChange={onChange} readOnly={readOnly} />) as CustomFieldRender<string> });
const cropOptions = [
  { label: 'Top left', value: 'left top' }, { label: 'Top', value: 'center top' }, { label: 'Top right', value: 'right top' },
  { label: 'Left', value: 'left center' }, { label: 'Center', value: 'center center' }, { label: 'Right', value: 'right center' },
  { label: 'Bottom left', value: 'left bottom' }, { label: 'Bottom', value: 'center bottom' }, { label: 'Bottom right', value: 'right bottom' },
];
const cropField = (label = 'Photo crop') => ({ type: 'radio' as const, label, options: cropOptions });
const videoField = (label: string) => ({ type: 'custom' as const, render: (({ value, onChange, readOnly }) => <MediaUpload label={label} kind="video" value={value || ''} onChange={onChange} readOnly={readOnly} />) as CustomFieldRender<string> });
const colorField = (label: string) => ({ type: 'custom' as const, render: (({ value, onChange, readOnly }) => <label className="color-field"><span>{label}</span><div><input type="color" value={value || '#000000'} disabled={readOnly} onChange={(event) => onChange(event.target.value)} /><input type="text" value={value || ''} disabled={readOnly} onChange={(event) => onChange(event.target.value)} aria-label={`${label} hex value`} /></div></label>) as CustomFieldRender<string> });

const alignOptions = [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }];
const sizeOptions = [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Oversized', value: 'oversized' }];
const trackingOptions = [{ label: 'Tight', value: 'tight' }, { label: 'Natural', value: 'natural' }, { label: 'Wide', value: 'wide' }];
const themeOptions = [{ label: 'Paper', value: 'paper' }, { label: 'Black', value: 'black' }, { label: 'Accent', value: 'lime' }];
const embedHeights: Record<string, number> = { compact: 540, standard: 700, tall: 860 };
const nestedAllowlist = [
  'HeaderLinkBar', 'FooterSitemap', 'LayoutContainer', 'EditorialHero', 'SplitFeature', 'TextBlock', 'ImageBlock', 'ButtonBlock', 'ExpandableGrid', 'ProjectGrid', 'GalleryBlock',
  'BeforeAfter', 'StickyStory', 'TimelineBlock', 'MarqueeBlock', 'ContactBlock', 'HeadingBlock', 'ParagraphBlock', 'EyebrowBlock', 'DividerBlock',
  'SpacerBlock', 'QuoteBlock', 'VideoBlock', 'LinkListBlock', 'StatsBlock', 'CreditsBlock', 'GitHubRepositoryBlock', 'CalendlyBlock', 'CustomCodeBlock',
  'FilmStripBlock', 'ContactSheetBlock', 'DirectorsSlateBlock', 'LensHeroBlock', 'ViewfinderBlock', 'StoryboardBlock', 'ReelShowcaseBlock', 'ColorGradeBlock', 'FilmStockBlock', 'EndCreditsBlock',
  'FlexRow', 'FlexColumn', 'InsetContainer', 'AspectRatio', 'Card', 'Callout', 'Badge', 'ButtonGroup', 'Breadcrumbs', 'Accordion', 'MediaText',
  'FeatureList', 'LogoCloud', 'AvatarGroup', 'MetricList', 'Checklist', 'SocialLinks', 'CodeSnippet', 'EmbedFrame', 'Notice',
  'DeveloperHeroBlock', 'CodeSnippetBlock', 'TerminalBlock', 'TechStackBlock', 'DeveloperFeaturesBlock', 'ApiEndpointBlock', 'ArchitectureBlock', 'ChangelogBlock',
  'OpenSourceBlock', 'DeveloperStatsBlock', 'DocsCalloutBlock', 'DeveloperCtaBlock',
];
const typeClass = (prefix: string, size = 'standard', tracking = 'tight') => `${prefix} ${prefix}--size-${size} ${prefix}--tracking-${tracking}`;
const sectionNameField = { type: 'text' as const, label: 'Section link name', description: 'Use this name in links like #photography.' };
const imagePosition = (crop?: string): CSSProperties => ({ objectPosition: crop || 'center center' });
const qolGapOptions = [{ label: 'Tight', value: 'tight' }, { label: 'Comfortable', value: 'comfortable' }, { label: 'Airy', value: 'airy' }];
const qolPaddingOptions = [{ label: 'None', value: 'none' }, { label: 'Compact', value: 'compact' }, { label: 'Generous', value: 'generous' }];
const qolRadiusOptions = [{ label: 'Sharp', value: 'sharp' }, { label: 'Soft', value: 'soft' }, { label: 'Round', value: 'round' }];
const qolToneOptions = [{ label: 'Paper', value: 'paper' }, { label: 'Black', value: 'black' }, { label: 'Accent', value: 'lime' }];

// Add the anchor to the block's existing root element so it does not introduce
// a layout wrapper around blocks that participate in grids or flex layouts.
function withSectionAnchor(render: (props: any) => ReactNode): any {
  return (props: any) => {
    const rendered = render(props);
    if (!isValidElement(rendered)) return rendered;
    const name = typeof props.name === 'string' ? props.name.trim() : '';
    const id = name || (typeof props.id === 'string' ? props.id : undefined);
    return cloneElement(rendered as ReactElement<any>, id ? { id } : undefined);
  };
}

function BeforeAfterView({ before, after, beforeAlt, afterAlt, beforeCrop, afterCrop, label }: { before: string; after: string; beforeAlt: string; afterAlt: string; beforeCrop?: string; afterCrop?: string; label: ReactNode }) {
  const [position, setPosition] = useState(50);
  return <section className="builder-compare"><div className="builder-compare__heading"><h2>{label}</h2><span>{position}%</span></div><div className="builder-compare__stage">
    <img src={before} alt={beforeAlt || ''} style={imagePosition(beforeCrop)} /><div className="builder-compare__after" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><img src={after} alt={afterAlt || ''} style={imagePosition(afterCrop)} /></div><span className="builder-compare__line" style={{ left: `${position}%` }} aria-hidden="true" />
  </div><label className="builder-compare__control"><span>Before</span><input aria-label="Compare before and after images" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} /><span>After</span></label></section>;
}

function HeadingPrimitive({ level, text, font, size, tracking, align }: { level: string; text: ReactNode; font: string; size: string; tracking: string; align: string }) {
  const Tag = (['h1', 'h2', 'h3'].includes(level) ? level : 'h2') as 'h1' | 'h2' | 'h3';
  return <Tag className={`builder-heading builder-heading--${size} builder-heading--tracking-${tracking} builder-align--${align}`} style={fontStyle(font)}>{text}</Tag>;
}

function videoEmbedUrl(rawUrl: string) {
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

function CalendlyWidget({ url, height, isEditing }: { url: string; height: number; isEditing: boolean }) {
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

function GitHubRepositoryView({ repoUrl, title, description, stats, topics, theme, isEditing }: { repoUrl: string; title: string; description: string; stats: string; topics: string; theme: string; isEditing: boolean }) {
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
  return <section className={`builder-github builder-theme--${theme}`}>
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

function ScrollFilmStrip({ title, stock, direction, frames, theme, isEditing }: { title: ReactNode; stock: ReactNode; direction: string; frames: FilmStripFrame[]; theme: string; isEditing: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollHeight, setScrollHeight] = useState<number>();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || direction === 'vertical' || isEditing) {
      setScrollHeight(undefined);
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
      distance = Math.max(0, track.scrollWidth - section.clientWidth);
      setScrollHeight(window.innerHeight + distance);
      requestUpdate();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(track);
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

  return <section ref={sectionRef} className={`builder-filmstrip builder-filmstrip--${direction}${isEditing ? ' builder-filmstrip--editing' : ''} builder-theme--${theme}`} style={scrollHeight ? { height: scrollHeight } : undefined}><div className="builder-filmstrip__sticky"><header><p className="builder-kicker">{stock}</p><h2>{title}</h2></header><div className="builder-filmstrip__track-viewport"><div className="builder-filmstrip__track" ref={trackRef}>{(frames || []).map((filmFrame, index) => <figure key={`${filmFrame.image}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><img src={filmFrame.image} alt={filmFrame.alt || ''} style={imagePosition(filmFrame.crop)} /><figcaption>{filmFrame.caption}</figcaption></figure>)}</div></div></div></section>;
}

// Puck component props intentionally remain open-ended: templates are user data,
// and each block validates/coerces only the fields it renders.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const builderConfig: Config<any> = {
  categories: {
    navigation: { title: 'Navigation', components: ['HeaderLinkBar', 'FooterSitemap'], defaultExpanded: true },
    primitives: { title: 'Building blocks', components: ['HeadingBlock', 'ParagraphBlock', 'EyebrowBlock', 'ImageBlock', 'ButtonBlock', 'DividerBlock', 'SpacerBlock'], defaultExpanded: true },
    layout: { title: 'Layouts & sections', components: ['LayoutContainer', 'EditorialHero', 'SplitFeature', 'TextBlock'], defaultExpanded: true },
    cinema: { title: 'Photo & cinema', components: ['FilmStripBlock', 'ContactSheetBlock', 'DirectorsSlateBlock', 'LensHeroBlock', 'ViewfinderBlock', 'StoryboardBlock', 'ReelShowcaseBlock', 'ColorGradeBlock', 'FilmStockBlock', 'EndCreditsBlock'], defaultExpanded: true },
    galleries: { title: 'Images & work', components: ['ExpandableGrid', 'ProjectGrid', 'GalleryBlock', 'ImageBlock', 'BeforeAfter'], defaultExpanded: true },
    storytelling: { title: 'Storytelling', components: ['StickyStory', 'TimelineBlock', 'QuoteBlock', 'VideoBlock', 'LinkListBlock', 'StatsBlock', 'CreditsBlock', 'MarqueeBlock', 'ContactBlock'], defaultExpanded: true },
    integrations: { title: 'Embeds & integrations', components: ['GitHubRepositoryBlock', 'CalendlyBlock', 'CustomCodeBlock'], defaultExpanded: true },
    qol: { title: 'Quality of life', components: ['FlexRow', 'FlexColumn', 'InsetContainer', 'AspectRatio', 'Card', 'Callout', 'Badge', 'ButtonGroup', 'Breadcrumbs', 'Accordion', 'MediaText', 'FeatureList', 'LogoCloud', 'AvatarGroup', 'MetricList', 'Checklist', 'SocialLinks', 'CodeSnippet', 'EmbedFrame', 'Notice'], defaultExpanded: true },
    developer: { title: 'Developer', components: ['DeveloperHeroBlock', 'CodeSnippetBlock', 'TerminalBlock', 'TechStackBlock', 'DeveloperFeaturesBlock', 'ApiEndpointBlock', 'ArchitectureBlock', 'ChangelogBlock', 'OpenSourceBlock', 'DeveloperStatsBlock', 'DocsCalloutBlock', 'DeveloperCtaBlock'], defaultExpanded: true },
  },
  components: {
    FlexRow: {
      label: 'Flex row',
      fields: {
        gap: { type: 'radio', label: 'Gap', options: qolGapOptions },
        wrap: { type: 'radio', label: 'Wrap items', options: [{ label: 'Wrap', value: 'wrap' }, { label: 'Single line', value: 'nowrap' }] },
        align: { type: 'radio', label: 'Vertical alignment', options: [{ label: 'Start', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' }, { label: 'Stretch', value: 'stretch' }] },
        justify: { type: 'radio', label: 'Horizontal distribution', options: [{ label: 'Start', value: 'start' }, { label: 'Between', value: 'between' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' }] },
        theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
        content: { type: 'slot', label: 'Row content', allow: nestedAllowlist },
      },
      defaultProps: { gap: 'comfortable', wrap: 'wrap', align: 'center', justify: 'start', theme: 'paper', content: [{ type: 'Badge', props: { text: 'New', tone: 'lime', size: 'small' } }, { type: 'ParagraphBlock', props: { text: 'A flexible row for controls, tags, or short bits of content.', font: 'inherit', size: 'small', align: 'left', width: 'normal' } }] },
      render: ({ gap, wrap, align, justify, theme, content: Content }) => <div className={`builder-flex-row builder-flex-row--gap-${gap} builder-flex-row--wrap-${wrap} builder-flex-row--align-${align} builder-flex-row--justify-${justify} builder-theme--${theme}`}>{Content ? <Content /> : null}</div>,
    },
    FlexColumn: {
      label: 'Flex column',
      fields: {
        gap: { type: 'radio', label: 'Gap', options: qolGapOptions },
        align: { type: 'radio', label: 'Horizontal alignment', options: [{ label: 'Start', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'End', value: 'end' }, { label: 'Stretch', value: 'stretch' }] },
        padding: { type: 'radio', label: 'Inner spacing', options: qolPaddingOptions },
        theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
        content: { type: 'slot', label: 'Column content', allow: nestedAllowlist },
      },
      defaultProps: { gap: 'comfortable', align: 'stretch', padding: 'compact', theme: 'paper', content: [{ type: 'HeadingBlock', props: { text: 'A calm stack.', level: 'h2', font: 'inherit', size: 'compact', tracking: 'tight', align: 'left' } }, { type: 'ParagraphBlock', props: { text: 'Use a column to keep related content together at any breakpoint.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' } }] },
      render: ({ gap, align, padding, theme, content: Content }) => <div className={`builder-flex-column builder-flex-column--gap-${gap} builder-flex-column--align-${align} builder-flex-column--pad-${padding} builder-theme--${theme}`}>{Content ? <Content /> : null}</div>,
    },
    InsetContainer: {
      label: 'Inset container',
      fields: {
        width: { type: 'radio', label: 'Content width', options: [{ label: 'Narrow', value: 'narrow' }, { label: 'Standard', value: 'standard' }, { label: 'Wide', value: 'wide' }] },
        padding: { type: 'radio', label: 'Outer spacing', options: qolPaddingOptions },
        align: { type: 'radio', label: 'Text alignment', options: alignOptions },
        theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
        content: { type: 'slot', label: 'Container content', allow: nestedAllowlist },
      },
      defaultProps: { width: 'standard', padding: 'generous', align: 'left', theme: 'paper', content: [{ type: 'ParagraphBlock', props: { text: 'An inset container gives a section a dependable reading measure.', font: 'inherit', size: 'lead', align: 'left', width: 'normal' } }] },
      render: ({ width, padding, align, theme, content: Content }) => <section className={`builder-inset builder-inset--width-${width} builder-inset--pad-${padding} builder-inset--${align} builder-theme--${theme}`}><div>{Content ? <Content /> : null}</div></section>,
    },
    AspectRatio: {
      label: 'Aspect ratio frame',
      fields: {
        ratio: { type: 'radio', label: 'Ratio', options: [{ label: 'Square', value: 'square' }, { label: 'Landscape', value: 'landscape' }, { label: 'Widescreen', value: 'wide' }, { label: 'Portrait', value: 'portrait' }] },
        overflow: { type: 'radio', label: 'Overflow', options: [{ label: 'Clip', value: 'clip' }, { label: 'Show', value: 'show' }] },
        theme: { type: 'radio', label: 'Theme', options: qolToneOptions },
        content: { type: 'slot', label: 'Frame content', allow: nestedAllowlist },
      },
      defaultProps: { ratio: 'landscape', overflow: 'clip', theme: 'black', content: [{ type: 'ImageBlock', props: { image: '/images/photo-1.jpg', alt: 'Framed portfolio image', caption: '', shape: 'landscape' } }] },
      render: ({ ratio, overflow, theme, content: Content }) => <div className={`builder-aspect-frame builder-aspect-frame--${ratio} builder-aspect-frame--overflow-${overflow} builder-theme--${theme}`}><div>{Content ? <Content /> : null}</div></div>,
    },
    Card: {
      label: 'Card',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow', contentEditable: true },
        title: { type: 'text', label: 'Title', contentEditable: true },
        body: { type: 'textarea', label: 'Body', contentEditable: true },
        actionLabel: { type: 'text', label: 'Action label', contentEditable: true }, actionUrl: { type: 'text', label: 'Action URL' },
        tone: { type: 'radio', label: 'Tone', options: qolToneOptions }, radius: { type: 'radio', label: 'Corners', options: qolRadiusOptions },
      },
      defaultProps: { eyebrow: '01 / Service', title: 'A useful card.', body: 'Keep a small idea, offer, or next step easy to scan.', actionLabel: 'Learn more', actionUrl: '#', tone: 'paper', radius: 'soft' },
      render: ({ eyebrow, title, body, actionLabel, actionUrl, tone, radius }) => <article className={`builder-card builder-theme--${tone} builder-card--radius-${radius}`}><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2><p>{body}</p>{actionLabel ? <a href={actionUrl || '#'}>{actionLabel}<span aria-hidden="true">↗</span></a> : null}</article>,
    },
    Callout: {
      label: 'Callout',
      fields: {
        label: { type: 'text', label: 'Label', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, body: { type: 'textarea', label: 'Message', contentEditable: true },
        actionLabel: { type: 'text', label: 'Action label', contentEditable: true }, actionUrl: { type: 'text', label: 'Action URL' }, tone: { type: 'radio', label: 'Tone', options: [{ label: 'Info', value: 'info' }, { label: 'Success', value: 'success' }, { label: 'Warning', value: 'warning' }] },
      },
      defaultProps: { label: 'Good to know', title: 'A small detail worth seeing.', body: 'Use a callout for context, a note, or a helpful next action.', actionLabel: '', actionUrl: '#', tone: 'info' },
      render: ({ label, title, body, actionLabel, actionUrl, tone }) => <aside className={`builder-callout builder-callout--${tone}`} role="note"><p className="builder-kicker">{label}</p><h2>{title}</h2><p>{body}</p>{actionLabel ? <a href={actionUrl || '#'}>{actionLabel} ↗</a> : null}</aside>,
    },
    Badge: {
      label: 'Badge / tag',
      fields: { text: { type: 'text', label: 'Text', contentEditable: true }, tone: { type: 'radio', label: 'Tone', options: qolToneOptions }, size: { type: 'radio', label: 'Size', options: [{ label: 'Small', value: 'small' }, { label: 'Standard', value: 'standard' }, { label: 'Large', value: 'large' }] } },
      defaultProps: { text: 'Available', tone: 'lime', size: 'standard' },
      render: ({ text, tone, size }) => <span className={`builder-badge builder-badge--${tone} builder-badge--${size}`}>{text}</span>,
    },
    ButtonGroup: {
      label: 'Button group',
      fields: {
        align: { type: 'radio', label: 'Alignment', options: alignOptions }, gap: { type: 'radio', label: 'Gap', options: qolGapOptions },
        buttons: { type: 'array', label: 'Buttons', min: 1, max: 6, arrayFields: { label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL' }, style: { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }, { label: 'Text', value: 'text' }] } }, defaultItemProps: (index) => ({ label: `Action ${index + 1}`, url: '#', style: index === 0 ? 'solid' : 'outline' }), getItemSummary: (item, index) => item.label || `Button ${(index || 0) + 1}` },
      },
      defaultProps: { align: 'left', gap: 'comfortable', buttons: [{ label: 'Start a project', url: '#contact', style: 'solid' }, { label: 'See the work', url: '#work', style: 'outline' }] },
      render: ({ align, gap, buttons }) => <div className={`builder-button-group builder-button-group--${align} builder-button-group--gap-${gap}`}>{(buttons || []).map((button: { label: string; url: string; style: string }, index: number) => <a className={`builder-button-group__button builder-button-group__button--${button.style}`} href={button.url || '#'} key={`${button.label}-${index}`}>{button.label}<span aria-hidden="true">↗</span></a>)}</div>,
    },
    Breadcrumbs: {
      label: 'Breadcrumbs',
      fields: { ariaLabel: { type: 'text', label: 'Navigation label' }, current: { type: 'text', label: 'Current page', contentEditable: true }, links: { type: 'array', label: 'Parent pages', min: 1, max: 6, arrayFields: { label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL' } }, defaultItemProps: (index) => ({ label: `Parent ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.label || `Parent ${(index || 0) + 1}` } },
      defaultProps: { ariaLabel: 'Breadcrumb', current: 'Current page', links: [{ label: 'Work', url: '#work' }, { label: 'Projects', url: '#projects' }] },
      render: ({ ariaLabel, current, links }) => <nav className="builder-breadcrumbs" aria-label={ariaLabel || 'Breadcrumb'}><ol>{(links || []).map((link: { label: string; url: string }, index: number) => <li key={`${link.label}-${index}`}><a href={link.url || '#'}>{link.label}</a><span aria-hidden="true">/</span></li>)}<li aria-current="page">{current}</li></ol></nav>,
    },
    Accordion: {
      label: 'Accordion / details',
      fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, items: { type: 'array', label: 'Details', min: 1, max: 12, arrayFields: { summary: { type: 'text', label: 'Summary' }, body: { type: 'textarea', label: 'Details' }, open: { type: 'radio', label: 'Open by default', options: [{ label: 'Closed', value: 'closed' }, { label: 'Open', value: 'open' }] } }, defaultItemProps: (index) => ({ summary: `Question ${index + 1}`, body: 'Add the supporting details here.', open: index === 0 ? 'open' : 'closed' }), getItemSummary: (item, index) => item.summary || `Details ${(index || 0) + 1}` } },
      defaultProps: { heading: 'Questions, answered.', items: [{ summary: 'What belongs here?', body: 'Use native details for FAQs, process notes, or progressive disclosure.', open: 'open' }, { summary: 'Can I add more?', body: 'Yes. Add or reorder rows from the sidebar.', open: 'closed' }] },
      render: ({ heading, items }) => <section className="builder-accordion"><h2>{heading}</h2><div>{(items || []).map((item: { summary: string; body: string; open: string }, index: number) => <details open={item.open === 'open'} key={`${item.summary}-${index}`}><summary>{item.summary}</summary><p>{item.body}</p></details>)}</div></section>,
    },
    MediaText: {
      label: 'Media + nested text',
      fields: { image: imageField('Media image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, side: { type: 'radio', label: 'Image side', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] }, ratio: { type: 'radio', label: 'Image ratio', options: [{ label: 'Square', value: 'square' }, { label: 'Landscape', value: 'landscape' }, { label: 'Portrait', value: 'portrait' }] }, content: { type: 'slot', label: 'Text content', allow: nestedAllowlist }, theme: { type: 'radio', label: 'Theme', options: qolToneOptions } },
      defaultProps: { image: '/images/photo-2.jpg', crop: 'center center', alt: 'Creative project detail', side: 'left', ratio: 'portrait', theme: 'paper', content: [{ type: 'HeadingBlock', props: { text: 'Pair image with context.', level: 'h2', font: 'inherit', size: 'standard', tracking: 'tight', align: 'left' } }, { type: 'ParagraphBlock', props: { text: 'A nested slot keeps the copy as editable as the image.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' } }] },
      render: ({ image, crop, alt, side, ratio, content: Content, theme }) => <section className={`builder-media-text builder-media-text--${side} builder-media-text--ratio-${ratio} builder-theme--${theme}`}><img src={image} alt={alt || ''} style={imagePosition(crop)} /><div>{Content ? <Content /> : null}</div></section>,
    },
    FeatureList: {
      label: 'Feature list',
      fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, intro: { type: 'textarea', label: 'Intro', contentEditable: true }, items: { type: 'array', label: 'Features', min: 1, max: 12, arrayFields: { title: { type: 'text', label: 'Title' }, body: { type: 'textarea', label: 'Description' }, marker: { type: 'text', label: 'Marker' } }, defaultItemProps: (index) => ({ title: `Feature ${index + 1}`, body: 'Describe a useful feature or promise.', marker: String(index + 1).padStart(2, '0') }), getItemSummary: (item, index) => item.title || `Feature ${(index || 0) + 1}` } },
      defaultProps: { heading: 'A clear set of capabilities.', intro: 'Make the important parts easy to scan.', items: [{ title: 'Thoughtful structure', body: 'Organize information with a deliberate rhythm.', marker: '01' }, { title: 'Flexible details', body: 'Give every item enough room to be understood.', marker: '02' }, { title: 'Ready to use', body: 'Turn the finished idea into an obvious next step.', marker: '03' }] },
      render: ({ heading, intro, items }) => <section className="builder-feature-list"><header><p className="builder-kicker">Features</p><h2>{heading}</h2><p>{intro}</p></header><ol>{(items || []).map((item: { title: string; body: string; marker: string }, index: number) => <li key={`${item.title}-${index}`}><span>{item.marker || String(index + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></li>)}</ol></section>,
    },
    LogoCloud: {
      label: 'Logo cloud',
      fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, logos: { type: 'array', label: 'Logos', min: 1, max: 16, arrayFields: { image: imageField('Logo image'), name: { type: 'text', label: 'Accessible name' }, url: { type: 'text', label: 'Link URL' } }, defaultItemProps: (index) => ({ image: '', name: `Partner ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.name || `Logo ${(index || 0) + 1}` } },
      defaultProps: { heading: 'Selected collaborators', logos: [{ image: '', name: 'Northstar Studio', url: '#' }, { image: '', name: 'Field Notes', url: '#' }, { image: '', name: 'Common Ground', url: '#' }] },
      render: ({ heading, logos }) => <section className="builder-logo-cloud"><h2>{heading}</h2><ul>{(logos || []).map((logo: { image: string; name: string; url: string }, index: number) => <li key={`${logo.name}-${index}`}><a href={logo.url || '#'} aria-label={logo.name || 'Collaborator'}>{logo.image ? <img src={logo.image} alt={logo.name || ''} /> : <span>{logo.name}</span>}</a></li>)}</ul></section>,
    },
    AvatarGroup: {
      label: 'Avatar group',
      fields: { label: { type: 'text', label: 'Group label', contentEditable: true }, people: { type: 'array', label: 'People', min: 1, max: 12, arrayFields: { image: imageField('Portrait'), name: { type: 'text', label: 'Name' }, url: { type: 'text', label: 'Profile URL' } }, defaultItemProps: (index) => ({ image: '', name: `Person ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.name || `Person ${(index || 0) + 1}` } },
      defaultProps: { label: 'Made with good people', people: [{ image: '/images/photo-3.jpg', name: 'Alex Morgan', url: '#' }, { image: '/images/photo-4.jpg', name: 'Sam Lee', url: '#' }, { image: '/images/photo-5.jpg', name: 'Jordan Kim', url: '#' }] },
      render: ({ label, people }) => <div className="builder-avatar-group"><p>{label}</p><ul>{(people || []).map((person: { image: string; name: string; url: string }, index: number) => <li key={`${person.name}-${index}`}><a href={person.url || '#'} aria-label={person.name || 'Contributor'}>{person.image ? <img src={person.image} alt={person.name || ''} /> : <span aria-hidden="true">{(person.name || '?').slice(0, 1)}</span>}</a></li>)}</ul></div>,
    },
    MetricList: {
      label: 'Metric list',
      fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, items: { type: 'array', label: 'Metrics', min: 1, max: 8, arrayFields: { value: { type: 'text', label: 'Value' }, label: { type: 'text', label: 'Label' }, detail: { type: 'text', label: 'Detail' } }, defaultItemProps: (index) => ({ value: '—', label: `Metric ${index + 1}`, detail: '' }), getItemSummary: (item, index) => item.label || `Metric ${(index || 0) + 1}` } },
      defaultProps: { heading: 'At a glance', items: [{ value: '12+', label: 'Years making', detail: 'and learning' }, { value: '48', label: 'Stories shipped', detail: 'across formats' }, { value: '03', label: 'Ways to work', detail: 'near or far' }] },
      render: ({ heading, items }) => <section className="builder-metric-list"><h2>{heading}</h2><dl>{(items || []).map((item: { value: string; label: string; detail: string }, index: number) => <div key={`${item.label}-${index}`}><dt>{item.value}</dt><dd><strong>{item.label}</strong>{item.detail ? <span>{item.detail}</span> : null}</dd></div>)}</dl></section>,
    },
    Checklist: {
      label: 'Checklist',
      fields: { heading: { type: 'text', label: 'Heading', contentEditable: true }, items: { type: 'array', label: 'Checklist items', min: 1, max: 12, arrayFields: { label: { type: 'text', label: 'Item' }, detail: { type: 'text', label: 'Detail' }, state: { type: 'radio', label: 'State', options: [{ label: 'To do', value: 'todo' }, { label: 'Done', value: 'done' }] } }, defaultItemProps: (index) => ({ label: `Checklist item ${index + 1}`, detail: '', state: 'todo' }), getItemSummary: (item, index) => item.label || `Item ${(index || 0) + 1}` } },
      defaultProps: { heading: 'A simple checklist', items: [{ label: 'Define the brief', detail: 'Align on the useful part first.', state: 'done' }, { label: 'Make the thing', detail: 'Give the idea a clear shape.', state: 'todo' }, { label: 'Share the result', detail: 'Make the next step obvious.', state: 'todo' }] },
      render: ({ heading, items }) => <section className="builder-checklist"><h2>{heading}</h2><ul>{(items || []).map((item: { label: string; detail: string; state: string }, index: number) => <li className={item.state === 'done' ? 'builder-checklist__item--done' : ''} key={`${item.label}-${index}`}><span aria-hidden="true">{item.state === 'done' ? '✓' : '○'}</span><div><strong>{item.label}</strong>{item.detail ? <p>{item.detail}</p> : null}</div></li>)}</ul></section>,
    },
    SocialLinks: {
      label: 'Social links',
      fields: { label: { type: 'text', label: 'Navigation label', contentEditable: true }, links: { type: 'array', label: 'Social links', min: 1, max: 12, arrayFields: { platform: { type: 'text', label: 'Platform' }, label: { type: 'text', label: 'Visible label' }, url: { type: 'text', label: 'URL' } }, defaultItemProps: (index) => ({ platform: `Social ${index + 1}`, label: `Follow on social ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.platform || `Social ${(index || 0) + 1}` } },
      defaultProps: { label: 'Elsewhere', links: [{ platform: 'Instagram', label: '@studio', url: '#' }, { platform: 'Are.na', label: 'Collected references', url: '#' }, { platform: 'Email', label: 'hello@example.com', url: 'mailto:hello@example.com' }] },
      render: ({ label, links }) => <nav className="builder-social-links" aria-label={label || 'Social links'}><p className="builder-kicker">{label}</p><ul>{(links || []).map((link: { platform: string; label: string; url: string }, index: number) => <li key={`${link.platform}-${index}`}><a href={link.url || '#'}><span>{link.platform}</span><strong>{link.label}</strong><span aria-hidden="true">↗</span></a></li>)}</ul></nav>,
    },
    CodeSnippet: {
      label: 'Code snippet',
      fields: { title: { type: 'text', label: 'Title', contentEditable: true }, language: { type: 'text', label: 'Language' }, code: { type: 'textarea', label: 'Code', contentEditable: true }, copyLabel: { type: 'text', label: 'Copy hint', contentEditable: true } },
      defaultProps: { title: 'A small useful snippet', language: 'CSS', code: '.thing {\n  display: grid;\n  gap: 1rem;\n}', copyLabel: 'Readable, editable, yours.' },
      render: ({ title, language, code, copyLabel }) => <figure className="builder-code-snippet"><figcaption><strong>{title}</strong><span>{language}</span></figcaption><pre><code>{code}</code></pre>{copyLabel ? <p>{copyLabel}</p> : null}</figure>,
    },
    EmbedFrame: {
      label: 'Embed frame',
      fields: { title: { type: 'text', label: 'Accessible frame title' }, url: { type: 'text', label: 'Embed URL' }, height: { type: 'radio', label: 'Height', options: [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Tall', value: 'tall' }] }, caption: { type: 'text', label: 'Caption', contentEditable: true } },
      defaultProps: { title: 'Embedded content', url: '', height: 'standard', caption: 'Embedded content' },
      render: ({ title, url, height, caption }) => <figure className={`builder-embed-frame builder-embed-frame--${height}`}>{url ? <iframe src={url} title={title || 'Embedded content'} loading="lazy" allowFullScreen /> : <div role="status">Add an embed URL in the sidebar.</div>}{caption ? <figcaption>{caption}</figcaption> : null}</figure>,
    },
    Notice: {
      label: 'Notice',
      fields: { title: { type: 'text', label: 'Title', contentEditable: true }, message: { type: 'textarea', label: 'Message', contentEditable: true }, tone: { type: 'radio', label: 'Tone', options: [{ label: 'Neutral', value: 'neutral' }, { label: 'Positive', value: 'positive' }, { label: 'Caution', value: 'caution' }] }, dismissible: { type: 'radio', label: 'Dismiss affordance', options: [{ label: 'None', value: 'none' }, { label: 'Show close hint', value: 'hint' }] } },
      defaultProps: { title: 'A quick note', message: 'Use a notice for a timely piece of context or a gentle heads-up.', tone: 'neutral', dismissible: 'none' },
      render: ({ title, message, tone, dismissible }) => <aside className={`builder-notice builder-notice--${tone}`} role="status"><div><strong>{title}</strong><p>{message}</p></div>{dismissible === 'hint' ? <span aria-label="Dismissible notice">×</span> : null}</aside>,
    },
    HeaderLinkBar: {
      label: 'Header / link bar',
      fields: {
        brand: { type: 'text', label: 'Brand name', contentEditable: true },
        brandUrl: { type: 'text', label: 'Brand link' },
        links: { type: 'array', label: 'Navigation links', min: 1, max: 8, arrayFields: { label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL or #anchor' } }, defaultItemProps: (index) => ({ label: `Section ${index + 1}`, url: '#' }), getItemSummary: (item, index) => item.label || `Link ${(index || 0) + 1}` },
        theme: { type: 'radio', label: 'Theme', options: themeOptions },
      },
      defaultProps: { brand: 'Studio Name', brandUrl: '#', links: [{ label: 'Work', url: '#work' }, { label: 'About', url: '#about' }, { label: 'Contact', url: '#contact' }], theme: 'paper' },
      render: ({ brand, brandUrl, links, theme }) => <header className={`builder-header-bar builder-theme--${theme}`}><a className="builder-header-bar__brand" href={brandUrl || '#'}>{brand}</a><nav aria-label="Primary navigation">{(links || []).map((link: { label: string; url: string }, index: number) => <a href={link.url || '#'} key={`${link.label}-${index}`}>{link.label}</a>)}</nav></header>,
    },
    FooterSitemap: {
      label: 'Footer / site map',
      fields: {
        eyebrow: { type: 'text', label: 'Small intro', contentEditable: true },
        brand: { type: 'text', label: 'Brand name', contentEditable: true },
        note: { type: 'textarea', label: 'Footer note', contentEditable: true },
        email: { type: 'text', label: 'Email address' },
        copyright: { type: 'text', label: 'Copyright line', contentEditable: true },
        theme: { type: 'radio', label: 'Theme', options: themeOptions },
        links: { type: 'array', label: 'Site map links', min: 1, max: 24, arrayFields: { section: { type: 'text', label: 'Group' }, label: { type: 'text', label: 'Label' }, url: { type: 'text', label: 'URL or #anchor' } }, defaultItemProps: (index) => ({ section: index < 3 ? 'Explore' : 'Connect', label: `Page ${index + 1}`, url: '#' }), getItemSummary: (item, index) => `${item.section || 'Links'} · ${item.label || `Link ${(index || 0) + 1}`}` },
      },
      defaultProps: { eyebrow: 'Stay in the loop', brand: 'Studio Name', note: 'Independent creative practice for images, stories, and ideas with a point of view.', email: 'hello@example.com', copyright: '© 2026 Studio Name', theme: 'black', links: [{ section: 'Explore', label: 'Work', url: '#work' }, { section: 'Explore', label: 'About', url: '#about' }, { section: 'Explore', label: 'Process', url: '#process' }, { section: 'Connect', label: 'Email', url: 'mailto:hello@example.com' }, { section: 'Connect', label: 'Instagram', url: '#' }] },
      render: ({ eyebrow, brand, note, email, copyright, theme, links }) => {
        const groups = (links || []).reduce((result: Record<string, { label: string; url: string }[]>, link: { section: string; label: string; url: string }) => {
          const section = link.section || 'Links';
          (result[section] ||= []).push(link);
          return result;
        }, {});
        return <footer className={`builder-footer-sitemap builder-theme--${theme}`}><div className="builder-footer-sitemap__intro"><p className="builder-kicker">{eyebrow}</p><p className="builder-footer-sitemap__brand">{brand}</p><p className="builder-footer-sitemap__note">{note}</p><a href={`mailto:${email}`}>{email} ↗</a></div><nav className="builder-footer-sitemap__links" aria-label="Site map">{(Object.entries(groups) as [string, { label: string; url: string }[]][]).map(([section, sectionLinks]) => <div key={section}><p>{section}</p>{sectionLinks.map((link, index) => <a href={link.url || '#'} key={`${link.label}-${index}`}>{link.label}<span aria-hidden="true">↗</span></a>)}</div>)}</nav><div className="builder-footer-sitemap__legal"><span>{copyright}</span><span>Built with Open Canvas</span></div></footer>;
      },
    },
    EditorialHero: {
      label: 'Editorial hero',
      fields: {
        eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, byline: { type: 'text', label: 'Byline', contentEditable: true },
        eyebrowFont: fontField('Intro font'), titleFont: fontField('Headline font'), bylineFont: fontField('Byline font'), titleSize: { type: 'select', label: 'Headline size', options: sizeOptions }, titleAlign: { type: 'radio', label: 'Headline alignment', options: alignOptions }, titleTracking: { type: 'select', label: 'Headline spacing', options: trackingOptions },
        image: imageField('Feature image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, theme: { type: 'radio', label: 'Theme', options: themeOptions },
      },
      defaultProps: { eyebrow: 'Independent creative practice', title: 'WORK WITH\nA POINT OF VIEW', byline: 'Film · Image · Design', eyebrowFont: 'inherit', titleFont: 'inherit', bylineFont: 'fraunces', titleSize: 'standard', titleAlign: 'left', titleTracking: 'tight', image: '/images/demo-hero.jpg', imageCrop: 'center center', imageAlt: 'Abstract creative studio composition', theme: 'paper' },
      render: ({ eyebrow, title, byline, eyebrowFont, titleFont, bylineFont, titleSize, titleAlign, titleTracking, image, imageCrop, imageAlt, theme }) => <section className={`builder-hero builder-theme--${theme} builder-align--${titleAlign}`}><div className="builder-hero__copy"><p className="builder-kicker" style={fontStyle(eyebrowFont)}>{eyebrow}</p><h1 className={typeClass('builder-hero-title', titleSize, titleTracking)} style={fontStyle(titleFont)}>{title}</h1><p className="builder-hero__byline" style={fontStyle(bylineFont)}>{byline}</p></div><img src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /></section>,
    },
    SplitFeature: {
      label: 'Split image + text',
      fields: { number: { type: 'text', label: 'Section number' }, title: { type: 'text', label: 'Title', contentEditable: true }, body: { type: 'textarea', label: 'Body', contentEditable: true }, titleFont: fontField('Title font'), bodyFont: fontField('Body font'), align: { type: 'radio', label: 'Text alignment', options: alignOptions }, image: imageField('Feature image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, imageSide: { type: 'radio', label: 'Image side', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { number: '001', title: 'A story in every frame', body: 'Use this flexible block for project introductions, services, or a short note about your process.', titleFont: 'inherit', bodyFont: 'inherit', align: 'left', image: '/images/demo-blue.jpg', imageCrop: 'center center', imageAlt: 'Abstract project artwork', imageSide: 'left', theme: 'paper' },
      render: ({ number, title, body, titleFont, bodyFont, align, image, imageCrop, imageAlt, imageSide, theme }) => <section className={`builder-split builder-split--${imageSide} builder-theme--${theme} builder-align--${align}`}><img src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /><div className="builder-split__copy"><span className="builder-number">{number}</span><h2 style={fontStyle(titleFont)}>{title}</h2><p style={fontStyle(bodyFont)}>{body}</p></div></section>,
    },
    LayoutContainer: {
      label: 'Nested layout container',
      fields: {
        columns: { type: 'radio', label: 'Columns on desktop', options: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }, { label: 'Four', value: 'four' }] }, ratio: { type: 'select', label: 'Column balance', options: [{ label: 'Even', value: 'even' }, { label: 'Wide first', value: 'wide-first' }, { label: 'Wide last', value: 'wide-last' }] }, gap: { type: 'radio', label: 'Gap', options: [{ label: 'None', value: 'none' }, { label: 'Tight', value: 'tight' }, { label: 'Airy', value: 'airy' }] }, padding: { type: 'radio', label: 'Outer spacing', options: [{ label: 'None', value: 'none' }, { label: 'Compact', value: 'compact' }, { label: 'Generous', value: 'generous' }] }, verticalAlign: { type: 'select', label: 'Vertical alignment', options: [{ label: 'Top', value: 'start' }, { label: 'Center', value: 'center' }, { label: 'Bottom', value: 'end' }, { label: 'Stretch', value: 'stretch' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions },
        first: { type: 'slot', label: 'First column', allow: nestedAllowlist }, second: { type: 'slot', label: 'Second column', allow: nestedAllowlist }, third: { type: 'slot', label: 'Third column', allow: nestedAllowlist }, fourth: { type: 'slot', label: 'Fourth column', allow: nestedAllowlist },
      },
      defaultProps: { columns: 'two', ratio: 'even', gap: 'tight', padding: 'compact', verticalAlign: 'start', theme: 'paper', first: [{ type: 'HeadingBlock', props: { text: 'Build a layout.', level: 'h2', font: 'inherit', size: 'standard', tracking: 'tight', align: 'left' } }, { type: 'ParagraphBlock', props: { text: 'Drag any block—including another container—into each column.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' } }], second: [{ type: 'ImageBlock', props: { image: '/images/photo-1.jpg', alt: 'Portfolio photograph', caption: 'Column two', shape: 'portrait' } }], third: [], fourth: [] },
      render: ({ columns, ratio, gap, padding, verticalAlign, theme, first: First, second: Second, third: Third, fourth: Fourth }) => <section className={`builder-container builder-container--${columns} builder-container--${ratio} builder-container--gap-${gap} builder-container--pad-${padding} builder-container--align-${verticalAlign} builder-theme--${theme}`}><div className="builder-container__cell"><First className="builder-container__dropzone" minEmptyHeight={220} /></div>{columns !== 'one' ? <div className="builder-container__cell"><Second className="builder-container__dropzone" minEmptyHeight={220} /></div> : null}{columns === 'three' || columns === 'four' ? <div className="builder-container__cell"><Third className="builder-container__dropzone" minEmptyHeight={220} /></div> : null}{columns === 'four' ? <div className="builder-container__cell"><Fourth className="builder-container__dropzone" minEmptyHeight={220} /></div> : null}</section>,
    },
    HeadingBlock: {
      label: 'Heading',
      fields: { text: { type: 'textarea', label: 'Heading', contentEditable: true }, level: { type: 'radio', label: 'Semantic level', options: [{ label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }] }, font: fontField('Font'), size: { type: 'select', label: 'Size', options: sizeOptions }, tracking: { type: 'select', label: 'Letter spacing', options: trackingOptions }, align: { type: 'radio', label: 'Alignment', options: alignOptions } },
      defaultProps: { text: 'A clear point of view.', level: 'h2', font: 'inherit', size: 'standard', tracking: 'tight', align: 'left' },
      render: (props) => <HeadingPrimitive {...(props as unknown as Parameters<typeof HeadingPrimitive>[0])} />,
    },
    ParagraphBlock: {
      label: 'Paragraph',
      fields: { text: { type: 'textarea', label: 'Text', contentEditable: true }, font: fontField('Font'), size: { type: 'radio', label: 'Size', options: [{ label: 'Small', value: 'small' }, { label: 'Standard', value: 'standard' }, { label: 'Lead', value: 'lead' }] }, align: { type: 'radio', label: 'Alignment', options: alignOptions }, width: { type: 'radio', label: 'Line length', options: [{ label: 'Narrow', value: 'narrow' }, { label: 'Normal', value: 'normal' }, { label: 'Wide', value: 'wide' }] } },
      defaultProps: { text: 'Use a paragraph block for flexible body copy inside a custom layout.', font: 'inherit', size: 'standard', align: 'left', width: 'normal' },
      render: ({ text, font, size, align, width }) => <p className={`builder-paragraph builder-paragraph--${size} builder-paragraph--${align} builder-paragraph--${width}`} style={fontStyle(font)}>{text}</p>,
    },
    EyebrowBlock: {
      label: 'Eyebrow / label',
      fields: { text: { type: 'text', label: 'Label', contentEditable: true }, font: fontField('Font'), align: { type: 'radio', label: 'Alignment', options: alignOptions }, rule: { type: 'radio', label: 'Rule', options: [{ label: 'None', value: 'none' }, { label: 'Above', value: 'above' }, { label: 'Below', value: 'below' }] } },
      defaultProps: { text: 'Selected work · 2026', font: 'inherit', align: 'left', rule: 'none' },
      render: ({ text, font, align, rule }) => <p className={`builder-eyebrow builder-eyebrow--${align} builder-eyebrow--rule-${rule}`} style={fontStyle(font)}>{text}</p>,
    },
    DividerBlock: {
      label: 'Divider',
      fields: { weight: { type: 'radio', label: 'Weight', options: [{ label: 'Hairline', value: 'hairline' }, { label: 'Medium', value: 'medium' }, { label: 'Bold', value: 'bold' }] }, width: { type: 'radio', label: 'Width', options: [{ label: 'Short', value: 'short' }, { label: 'Half', value: 'half' }, { label: 'Full', value: 'full' }] }, style: { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' }, { label: 'Dotted', value: 'dotted' }] } },
      defaultProps: { weight: 'hairline', width: 'full', style: 'solid' },
      render: ({ weight, width, style }) => <div className={`builder-divider builder-divider--${weight} builder-divider--${width} builder-divider--${style}`} role="separator" />,
    },
    SpacerBlock: {
      label: 'Spacer',
      fields: { size: { type: 'radio', label: 'Space', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }, { label: 'XL', value: 'xl' }] }, showGuide: { type: 'radio', label: 'Editor guide', options: [{ label: 'Subtle', value: 'subtle' }, { label: 'Hidden', value: 'hidden' }] } },
      defaultProps: { size: 'medium', showGuide: 'subtle' },
      render: ({ size, showGuide }) => <div className={`builder-spacer builder-spacer--${size} builder-spacer--${showGuide}`} aria-hidden="true" />,
    },
    QuoteBlock: {
      label: 'Pull quote',
      fields: { quote: { type: 'textarea', label: 'Quote', contentEditable: true }, attribution: { type: 'text', label: 'Attribution', contentEditable: true }, quoteFont: fontField('Quote font'), attributionFont: fontField('Attribution font'), size: { type: 'radio', label: 'Scale', options: [{ label: 'Quiet', value: 'quiet' }, { label: 'Feature', value: 'feature' }, { label: 'Monumental', value: 'monumental' }] }, align: { type: 'radio', label: 'Alignment', options: alignOptions }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { quote: 'The details are not the details. They make the work.', attribution: 'A creative principle', quoteFont: 'fraunces', attributionFont: 'inherit', size: 'feature', align: 'left', theme: 'paper' },
      render: ({ quote, attribution, quoteFont, attributionFont, size, align, theme }) => <blockquote className={`builder-quote builder-quote--${size} builder-quote--${align} builder-theme--${theme}`}><p style={fontStyle(quoteFont)}>“{quote}”</p><cite style={fontStyle(attributionFont)}>{attribution}</cite></blockquote>,
    },
    VideoBlock: {
      label: 'Video',
      fields: {
        source: { type: 'radio', label: 'Video source', options: [{ label: 'Upload', value: 'upload' }, { label: 'YouTube / Vimeo', value: 'embed' }] },
        video: videoField('Video file'), url: { type: 'text', label: 'YouTube or Vimeo URL' }, poster: imageField('Poster image'), posterCrop: cropField('Poster crop'),
        title: { type: 'text', label: 'Accessible title' }, caption: { type: 'text', label: 'Caption', contentEditable: true }, captionFont: fontField('Caption font'),
        ratio: { type: 'radio', label: 'Aspect ratio', options: [{ label: 'Cinema', value: 'cinema' }, { label: 'Widescreen', value: 'wide' }, { label: 'Square', value: 'square' }, { label: 'Portrait', value: 'portrait' }] },
        autoplay: { type: 'radio', label: 'Uploaded video autoplay', options: [{ label: 'Off', value: 'off' }, { label: 'On (muted)', value: 'on' }] },
        loop: { type: 'radio', label: 'Uploaded video loop', options: [{ label: 'Off', value: 'off' }, { label: 'On', value: 'on' }] },
        muted: { type: 'radio', label: 'Uploaded video sound', options: [{ label: 'Sound on', value: 'off' }, { label: 'Muted', value: 'on' }] },
        controls: { type: 'radio', label: 'Uploaded video controls', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] },
      },
      defaultProps: { source: 'upload', video: '', url: '', poster: '/images/demo-blue.jpg', posterCrop: 'center center', title: 'Featured project film', caption: 'Project film', captionFont: 'inherit', ratio: 'wide', autoplay: 'off', loop: 'off', muted: 'off', controls: 'show' },
      render: ({ source, video, url, poster, posterCrop, title, caption, captionFont, ratio, autoplay, loop, muted, controls }) => {
        const isUpload = source === 'upload';
        const embed = videoEmbedUrl(url);
        const player = isUpload
          ? (video ? <video src={video} poster={poster || undefined} style={imagePosition(posterCrop)} aria-label={title || 'Portfolio video'} autoPlay={autoplay === 'on'} loop={loop === 'on'} muted={muted === 'on' || autoplay === 'on'} controls={controls !== 'hide'} playsInline preload="metadata">Your browser does not support HTML video.</video> : <div className="builder-video__empty">Upload an MP4 or WebM video</div>)
          : (embed ? <iframe src={embed} title={title || 'Embedded video'} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /> : <div className="builder-video__empty">Paste a YouTube or Vimeo URL</div>);
        return <figure className={`builder-video builder-video--${ratio}`}>{player}{caption ? <figcaption style={fontStyle(captionFont)}>{caption}</figcaption> : null}</figure>;
      },
    },
    LinkListBlock: {
      label: 'Link list',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, font: fontField('Link font'), style: { type: 'radio', label: 'Style', options: [{ label: 'Index', value: 'index' }, { label: 'Buttons', value: 'buttons' }, { label: 'Minimal', value: 'minimal' }] }, links: { type: 'array', label: 'Links', min: 1, max: 12, arrayFields: { label: { type: 'text', label: 'Label' }, detail: { type: 'text', label: 'Detail' }, url: { type: 'text', label: 'URL' } }, defaultItemProps: (index) => ({ label: `Project ${index + 1}`, detail: 'Selected work', url: '#' }), getItemSummary: (item, index) => item.label || `Link ${(index || 0) + 1}` } },
      defaultProps: { eyebrow: 'Explore', font: 'inherit', style: 'index', links: [{ label: 'Cinematography', detail: 'Reel · 03:14', url: '#' }, { label: 'Photography', detail: 'Selected work', url: '#' }, { label: 'Illustration', detail: 'Sketchbook', url: '#' }] },
      render: ({ eyebrow, font, style, links }) => <nav className={`builder-link-list builder-link-list--${style}`} aria-label={typeof eyebrow === 'string' ? eyebrow : 'Selected links'}><p className="builder-kicker">{eyebrow}</p>{(links || []).map((item: { label: string; detail: string; url: string }, index: number) => <a href={item.url} key={`${item.label}-${index}`} style={fontStyle(font)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><em>{item.detail}</em><b aria-hidden="true">↗</b></a>)}</nav>,
    },
    StatsBlock: {
      label: 'Facts / stats',
      fields: { font: fontField('Number font'), align: { type: 'radio', label: 'Alignment', options: alignOptions }, theme: { type: 'radio', label: 'Theme', options: themeOptions }, items: { type: 'array', label: 'Facts', min: 1, max: 6, arrayFields: { value: { type: 'text', label: 'Value' }, label: { type: 'text', label: 'Label' } }, defaultItemProps: (index) => ({ value: `${index + 1}`, label: 'Creative fact' }), getItemSummary: (item, index) => item.label || `Fact ${(index || 0) + 1}` } },
      defaultProps: { font: 'space-grotesk', align: 'left', theme: 'paper', items: [{ value: '12+', label: 'Years making' }, { value: '48', label: 'Stories shipped' }, { value: '∞', label: 'Curiosity' }] },
      render: ({ font, align, theme, items }) => <dl className={`builder-stats builder-stats--${align} builder-theme--${theme}`}>{(items || []).map((item: { value: string; label: string }, index: number) => <div key={`${item.label}-${index}`}><dt style={fontStyle(font)}>{item.value}</dt><dd>{item.label}</dd></div>)}</dl>,
    },
    CreditsBlock: {
      label: 'Project credits',
      fields: { title: { type: 'text', label: 'Heading', contentEditable: true }, font: fontField('Credits font'), columns: { type: 'radio', label: 'Columns', options: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }] }, items: { type: 'array', label: 'Credits', min: 1, max: 20, arrayFields: { role: { type: 'text', label: 'Role' }, name: { type: 'text', label: 'Name' } }, defaultItemProps: (index) => ({ role: `Role ${index + 1}`, name: 'Name' }), getItemSummary: (item, index) => item.role || `Credit ${(index || 0) + 1}` } },
      defaultProps: { title: 'Credits', font: 'ibm-plex-mono', columns: 'two', items: [{ role: 'Creative direction', name: 'Studio Name' }, { role: 'Photography', name: 'Collaborator Name' }, { role: 'Music', name: 'Original score' }, { role: 'Year', name: '2026' }] },
      render: ({ title, font, columns, items }) => <section className={`builder-credits builder-credits--${columns}`}><h2>{title}</h2><dl>{(items || []).map((item: { role: string; name: string }, index: number) => <div key={`${item.role}-${index}`} style={fontStyle(font)}><dt>{item.role}</dt><dd>{item.name}</dd></div>)}</dl></section>,
    },
    TextBlock: {
      label: 'Text',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, heading: { type: 'text', label: 'Heading', contentEditable: true }, body: { type: 'textarea', label: 'Body', contentEditable: true }, eyebrowFont: fontField('Intro font'), headingFont: fontField('Heading font'), bodyFont: fontField('Body font'), headingSize: { type: 'select', label: 'Heading size', options: sizeOptions }, headingTracking: { type: 'select', label: 'Heading spacing', options: trackingOptions }, align: { type: 'radio', label: 'Alignment', options: alignOptions } },
      defaultProps: { eyebrow: 'A note from the studio', heading: 'Stories should feel human.', body: 'Add a short paragraph here. Click the text to edit it directly, or use the controls in the sidebar.', eyebrowFont: 'inherit', headingFont: 'inherit', bodyFont: 'inherit', headingSize: 'standard', headingTracking: 'tight', align: 'left' },
      render: ({ eyebrow, heading, body, eyebrowFont, headingFont, bodyFont, headingSize, headingTracking, align }) => <section className={`builder-text builder-text--${align}`}><p className="builder-kicker" style={fontStyle(eyebrowFont)}>{eyebrow}</p><h2 className={typeClass('builder-text-title', headingSize, headingTracking)} style={fontStyle(headingFont)}>{heading}</h2><p style={fontStyle(bodyFont)}>{body}</p></section>,
    },
    ImageBlock: {
      label: 'Image', fields: { image: imageField('Image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, caption: { type: 'text', label: 'Caption', contentEditable: true }, captionFont: fontField('Caption font'), shape: { type: 'radio', label: 'Shape', options: [{ label: 'Landscape', value: 'landscape' }, { label: 'Square', value: 'square' }, { label: 'Portrait', value: 'portrait' }, { label: 'Natural', value: 'natural' }] } },
      defaultProps: { image: '/images/photo-1.jpg', crop: 'center center', alt: 'Portfolio photograph', caption: 'Selected work', captionFont: 'inherit', shape: 'landscape' },
      render: ({ image, crop, alt, caption, captionFont, shape }) => <figure className={`builder-image builder-image--${shape}`}><img src={image} alt={alt || ''} style={imagePosition(crop)} /><figcaption style={fontStyle(captionFont)}>{caption}</figcaption></figure>,
    },
    ButtonBlock: {
      label: 'Button / link', fields: { label: { type: 'text', label: 'Button label', contentEditable: true }, href: { type: 'text', label: 'Link URL' }, labelFont: fontField('Button font'), style: { type: 'radio', label: 'Style', options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }, { label: 'Text link', value: 'text' }] }, align: { type: 'radio', label: 'Alignment', options: alignOptions } },
      defaultProps: { label: 'View project', href: '#', labelFont: 'inherit', style: 'solid', align: 'left' },
      render: ({ label, href, labelFont, style, align }) => <div className={`builder-button builder-button--${align}`}><a className={`builder-button__link builder-button__link--${style}`} href={href} style={fontStyle(labelFont)}>{label}<span aria-hidden="true">↗</span></a></div>,
    },
    ExpandableGrid: {
      label: 'Expandable image grid',
      fields: { number: { type: 'text', label: 'Section number' }, title: { type: 'text', label: 'Title', contentEditable: true }, intro: { type: 'textarea', label: 'Introduction', contentEditable: true }, titleFont: fontField('Title font'), introFont: fontField('Introduction font'), layout: { type: 'radio', label: 'Layout', options: [{ label: 'Editorial', value: 'editorial' }, { label: 'Uniform', value: 'uniform' }, { label: 'Filmstrip', value: 'filmstrip' }] }, density: { type: 'select', label: 'Grid density', options: [{ label: 'Large images', value: 'large' }, { label: 'Medium images', value: 'medium' }, { label: 'Small images', value: 'small' }] }, gap: { type: 'radio', label: 'Gap', options: [{ label: 'Tight', value: 'tight' }, { label: 'Comfortable', value: 'medium' }, { label: 'Airy', value: 'airy' }] }, items: { type: 'array', label: 'Images', min: 1, max: 24, arrayFields: { image: imageField('Image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, caption: { type: 'text', label: 'Caption' }, shape: { type: 'select', label: 'Grid shape', options: [{ label: 'Automatic', value: 'auto' }, { label: 'Wide', value: 'wide' }, { label: 'Tall', value: 'tall' }, { label: 'Large', value: 'large' }] } }, defaultItemProps: (index) => ({ image: `/images/photo-${(index % 10) + 1}.jpg`, crop: 'center center', alt: 'Portfolio photograph', caption: `Image ${index + 1}`, shape: 'auto' }), getItemSummary: (item, index) => item.caption || `Image ${(index || 0) + 1}` } },
      defaultProps: { number: '001', title: 'Selected work', intro: 'Add, remove, and reorder as many as 24 images. The grid will reflow automatically.', titleFont: 'inherit', introFont: 'inherit', layout: 'editorial', density: 'medium', gap: 'tight', items: [{ image: '/images/photo-1.jpg', crop: 'center center', alt: 'Portfolio photograph', caption: 'Portrait study', shape: 'large' }, { image: '/images/photo-2.jpg', crop: 'center center', alt: 'Portfolio photograph', caption: 'In motion', shape: 'tall' }, { image: '/images/photo-3.jpg', crop: 'center center', alt: 'Portfolio photograph', caption: 'On location', shape: 'auto' }, { image: '/images/photo-4.jpg', crop: 'center center', alt: 'Portfolio photograph', caption: 'Golden hour', shape: 'wide' }] },
      render: ({ number, title, intro, titleFont, introFont, layout, density, gap, items }) => <section className={`builder-flex-grid builder-flex-grid--${layout} builder-flex-grid--${density} builder-flex-grid--gap-${gap}`}><div className="builder-section-title"><div><span>{number}</span><h2 style={fontStyle(titleFont)}>{title}</h2></div><p style={fontStyle(introFont)}>{intro}</p></div><div className="builder-flex-grid__grid">{(items || []).map((item: { image: string; crop?: string; alt: string; caption: string; shape: string }, index: number) => <figure className={`builder-flex-grid__item builder-flex-grid__item--${item.shape}`} key={`${item.image}-${index}`}><img src={item.image} alt={item.alt || ''} style={imagePosition(item.crop)} /><figcaption><span>{String(index + 1).padStart(2, '0')}</span>{item.caption}</figcaption></figure>)}</div></section>,
    },
    ProjectGrid: {
      label: 'Two project cards', fields: { number: { type: 'text', label: 'Section number' }, title: { type: 'text', label: 'Section title', contentEditable: true }, intro: { type: 'textarea', label: 'Introduction', contentEditable: true }, titleFont: fontField('Title font'), introFont: fontField('Introduction font'), image1: imageField('First project image'), image1Crop: cropField('First image crop'), title1: { type: 'text', label: 'First project title', contentEditable: true }, url1: { type: 'text', label: 'First project link' }, image2: imageField('Second project image'), image2Crop: cropField('Second image crop'), title2: { type: 'text', label: 'Second project title', contentEditable: true }, url2: { type: 'text', label: 'Second project link' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { number: '001', title: 'Selected projects', intro: 'A few recent stories.', titleFont: 'inherit', introFont: 'inherit', image1: '/images/reel-cinematography.jpg', image1Crop: 'center center', title1: 'Project one', url1: '#', image2: '/images/reel-editing.jpg', image2Crop: 'center center', title2: 'Project two', url2: '#', theme: 'paper' },
      render: ({ number, title, intro, titleFont, introFont, image1, image1Crop, title1, url1, image2, image2Crop, title2, url2, theme }) => <section className={`builder-projects builder-theme--${theme}`}><div className="builder-section-title"><div><span>{number}</span><h2 style={fontStyle(titleFont)}>{title}</h2></div><p style={fontStyle(introFont)}>{intro}</p></div><div className="builder-projects__grid">{[{ image: image1, crop: image1Crop, title: title1, url: url1 }, { image: image2, crop: image2Crop, title: title2, url: url2 }].map((project, index) => <a href={project.url} key={`${project.title}-${index}`}><div><img src={project.image} alt="" style={imagePosition(project.crop)} /><span className="builder-play">▶</span></div><strong>{project.title}</strong><span>View project ↗</span></a>)}</div></section>,
    },
    GalleryBlock: {
      label: 'Six-image gallery', fields: { number: { type: 'text', label: 'Section number' }, title: { type: 'text', label: 'Title', contentEditable: true }, intro: { type: 'textarea', label: 'Introduction', contentEditable: true }, titleFont: fontField('Title font'), introFont: fontField('Introduction font'), image1: imageField('Image 1'), image1Crop: cropField('Image 1 crop'), image2: imageField('Image 2'), image2Crop: cropField('Image 2 crop'), image3: imageField('Image 3'), image3Crop: cropField('Image 3 crop'), image4: imageField('Image 4'), image4Crop: cropField('Image 4 crop'), image5: imageField('Image 5'), image5Crop: cropField('Image 5 crop'), image6: imageField('Image 6'), image6Crop: cropField('Image 6 crop') },
      defaultProps: { number: '001', title: 'Photography', intro: 'A selection of people, places, and changing light.', titleFont: 'inherit', introFont: 'inherit', image1: '/images/photo-1.jpg', image1Crop: 'center center', image2: '/images/photo-2.jpg', image2Crop: 'center center', image3: '/images/photo-3.jpg', image3Crop: 'center center', image4: '/images/photo-4.jpg', image4Crop: 'center center', image5: '/images/photo-5.jpg', image5Crop: 'center center', image6: '/images/photo-6.jpg', image6Crop: 'center center' },
      render: ({ number, title, intro, titleFont, introFont, image1, image1Crop, image2, image2Crop, image3, image3Crop, image4, image4Crop, image5, image5Crop, image6, image6Crop }) => <section className="builder-gallery"><div className="builder-section-title"><div><span>{number}</span><h2 style={fontStyle(titleFont)}>{title}</h2></div><p style={fontStyle(introFont)}>{intro}</p></div><div className="builder-gallery__grid">{[[image1, image1Crop], [image2, image2Crop], [image3, image3Crop], [image4, image4Crop], [image5, image5Crop], [image6, image6Crop]].map(([image, crop], index) => <img src={image} alt={`Gallery image ${index + 1}`} style={imagePosition(crop)} key={`${image}-${index}`} />)}</div></section>,
    },
    BeforeAfter: {
      label: 'Before / after slider', fields: { label: { type: 'text', label: 'Heading', contentEditable: true }, labelFont: fontField('Heading font'), before: imageField('Before image'), beforeCrop: cropField('Before image crop'), beforeAlt: { type: 'text', label: 'Before image description' }, after: imageField('After image'), afterCrop: cropField('After image crop'), afterAlt: { type: 'text', label: 'After image description' } },
      defaultProps: { label: 'From raw frame to final grade', labelFont: 'inherit', before: '/images/photo-3.jpg', beforeCrop: 'center center', beforeAlt: 'Original image', after: '/images/photo-4.jpg', afterCrop: 'center center', afterAlt: 'Final image' },
      render: ({ label, labelFont, before, beforeCrop, beforeAlt, after, afterCrop, afterAlt }) => <div style={fontStyle(labelFont)}><BeforeAfterView label={label} before={before} beforeCrop={beforeCrop} beforeAlt={beforeAlt} after={after} afterCrop={afterCrop} afterAlt={afterAlt} /></div>,
    },
    StickyStory: {
      label: 'Sticky project story', fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, body: { type: 'textarea', label: 'Story', contentEditable: true }, titleFont: fontField('Title font'), bodyFont: fontField('Body font'), image: imageField('Project image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, imageSide: { type: 'radio', label: 'Image side', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { eyebrow: 'Project note', title: 'Hold the image while the story unfolds.', body: 'A sticky visual creates a cinematic pause on larger screens while staying naturally stacked on mobile.', titleFont: 'inherit', bodyFont: 'inherit', image: '/images/photo-7.jpg', imageCrop: 'center center', imageAlt: 'Creative project still', imageSide: 'left', theme: 'paper' },
      render: ({ eyebrow, title, body, titleFont, bodyFont, image, imageCrop, imageAlt, imageSide, theme }) => <section className={`builder-sticky builder-sticky--${imageSide} builder-theme--${theme}`}><div className="builder-sticky__image"><img src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /></div><div className="builder-sticky__copy"><p className="builder-kicker">{eyebrow}</p><h2 style={fontStyle(titleFont)}>{title}</h2><p style={fontStyle(bodyFont)}>{body}</p></div></section>,
    },
    TimelineBlock: {
      label: 'Process timeline', fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, titleFont: fontField('Title font'), items: { type: 'array', label: 'Steps', min: 2, max: 8, arrayFields: { marker: { type: 'text', label: 'Marker' }, title: { type: 'text', label: 'Step title' }, detail: { type: 'textarea', label: 'Detail' } }, defaultItemProps: (index) => ({ marker: String(index + 1).padStart(2, '0'), title: 'New step', detail: 'Describe what happens here.' }), getItemSummary: (item, index) => item.title || `Step ${(index || 0) + 1}` } },
      defaultProps: { eyebrow: 'How it comes together', title: 'A process with room to wander.', titleFont: 'inherit', items: [{ marker: '01', title: 'Listen', detail: 'Find the human center of the story.' }, { marker: '02', title: 'Make', detail: 'Build, shoot, sketch, and experiment.' }, { marker: '03', title: 'Refine', detail: 'Shape every detail until it feels inevitable.' }] },
      render: ({ eyebrow, title, titleFont, items }) => <section className="builder-timeline"><p className="builder-kicker">{eyebrow}</p><h2 style={fontStyle(titleFont)}>{title}</h2><ol>{(items || []).map((item: { marker: string; title: string; detail: string }, index: number) => <li key={`${item.marker}-${index}`}><span>{item.marker}</span><h3>{item.title}</h3><p>{item.detail}</p></li>)}</ol></section>,
    },
    MarqueeBlock: {
      label: 'Kinetic marquee', fields: { text: { type: 'text', label: 'Marquee text', contentEditable: true }, font: fontField('Marquee font'), speed: { type: 'radio', label: 'Speed', options: [{ label: 'Slow', value: 'slow' }, { label: 'Medium', value: 'medium' }, { label: 'Fast', value: 'fast' }] }, direction: { type: 'radio', label: 'Direction', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { text: 'FILM · PHOTO · DESIGN · STORIES · ', font: 'inherit', speed: 'medium', direction: 'left', theme: 'lime' },
      render: ({ text, font, speed, direction, theme }) => <section className={`builder-marquee builder-marquee--${speed} builder-marquee--${direction} builder-theme--${theme}`} style={fontStyle(font)} aria-label={typeof text === 'string' ? text : 'Creative services'}><div aria-hidden="true"><span>{text}</span><span>{text}</span><span>{text}</span></div></section>,
    },
    FilmStripBlock: {
      label: 'Film strip',
      fields: { title: { type: 'text', label: 'Title', contentEditable: true }, stock: { type: 'text', label: 'Film stock label' }, direction: { type: 'radio', label: 'Strip direction', options: [{ label: 'Horizontal', value: 'horizontal' }, { label: 'Vertical', value: 'vertical' }] }, frames: { type: 'array', label: 'Frames', min: 2, max: 12, arrayFields: { image: imageField('Frame image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, caption: { type: 'text', label: 'Frame caption' } }, defaultItemProps: (index) => ({ image: `/images/photo-${(index % 10) + 1}.jpg`, crop: 'center center', alt: 'Film still', caption: `Frame ${String(index + 1).padStart(2, '0')}` }), getItemSummary: (item, index) => item.caption || `Frame ${(index || 0) + 1}` }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { title: 'Selected frames', stock: '35 MM · 500 T · ROLL 07', direction: 'horizontal', frames: [{ image: '/images/photo-1.jpg', alt: 'Cinematic portrait', caption: 'INT. STUDIO — DAWN' }, { image: '/images/photo-2.jpg', alt: 'Subject in motion', caption: 'TAKE 04 / A CAM' }, { image: '/images/photo-3.jpg', alt: 'Location detail', caption: 'EXT. COAST — 18:42' }, { image: '/images/photo-4.jpg', alt: 'Final film still', caption: 'ROLL 07 / 016' }], theme: 'black' },
      render: ({ title, stock, direction, frames, theme, puck }) => <ScrollFilmStrip title={title} stock={stock} direction={direction} frames={frames || []} theme={theme} isEditing={Boolean(puck?.isEditing)} />,
    },
    ContactSheetBlock: {
      label: 'Contact sheet',
      fields: { title: { type: 'text', label: 'Title', contentEditable: true }, roll: { type: 'text', label: 'Roll label' }, columns: { type: 'radio', label: 'Desktop columns', options: [{ label: 'Three', value: 'three' }, { label: 'Four', value: 'four' }, { label: 'Six', value: 'six' }] }, frames: { type: 'array', label: 'Contact prints', min: 3, max: 24, arrayFields: { image: imageField('Photograph'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, selected: { type: 'radio', label: 'Select frame', options: [{ label: 'No', value: 'no' }, { label: 'Circle it', value: 'yes' }] } }, defaultItemProps: (index) => ({ image: `/images/photo-${(index % 10) + 1}.jpg`, crop: 'center center', alt: 'Contact sheet photograph', selected: index === 0 ? 'yes' : 'no' }), getItemSummary: (_item, index) => `Exposure ${String((index || 0) + 1).padStart(2, '0')}` } },
      defaultProps: { title: 'Proofs / Lisbon', roll: 'ROLL 04 · 36 EXP · 2026', columns: 'four', frames: Array.from({ length: 8 }, (_, index) => ({ image: `/images/photo-${(index % 10) + 1}.jpg`, alt: `Contact sheet frame ${index + 1}`, selected: [1, 6].includes(index) ? 'yes' : 'no' })) },
      render: ({ title, roll, columns, frames }) => <section className={`builder-contact-sheet builder-contact-sheet--${columns}`}><header><h2>{title}</h2><p>{roll}</p></header><div>{(frames || []).map((frame: { image: string; crop?: string; alt: string; selected: string }, index: number) => <figure className={frame.selected === 'yes' ? 'is-selected' : ''} key={`${frame.image}-${index}`}><img src={frame.image} alt={frame.alt || ''} style={imagePosition(frame.crop)} /><figcaption>{String(index + 1).padStart(2, '0')}A</figcaption></figure>)}</div></section>,
    },
    DirectorsSlateBlock: {
      label: 'Director’s slate',
      fields: { production: { type: 'text', label: 'Production', contentEditable: true }, director: { type: 'text', label: 'Director' }, camera: { type: 'text', label: 'Camera' }, scene: { type: 'text', label: 'Scene' }, take: { type: 'text', label: 'Take' }, roll: { type: 'text', label: 'Roll' }, date: { type: 'text', label: 'Date' }, note: { type: 'textarea', label: 'Production note', contentEditable: true }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { production: 'A QUIET KIND OF LIGHT', director: 'DIRECTOR NAME', camera: 'DP NAME', scene: '24 B', take: '03', roll: 'A 007', date: '08 / 28 / 26', note: 'A graphic project opener for films, campaigns, and production diaries.', theme: 'paper' },
      render: ({ production, director, camera, scene, take, roll, date, note, theme }) => <section className={`builder-slate-section builder-theme--${theme}`}><div className="builder-slate"><div className="builder-slate__clap" aria-hidden="true"><i /><i /><i /><i /><i /></div><h2>{production}</h2><dl><div><dt>Scene</dt><dd>{scene}</dd></div><div><dt>Take</dt><dd>{take}</dd></div><div><dt>Roll</dt><dd>{roll}</dd></div><div><dt>Director</dt><dd>{director}</dd></div><div><dt>Camera</dt><dd>{camera}</dd></div><div><dt>Date</dt><dd>{date}</dd></div></dl></div><p>{note}</p></section>,
    },
    LensHeroBlock: {
      label: 'Lens / aperture hero',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, image: imageField('Lens image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, focalLength: { type: 'text', label: 'Focal length' }, aperture: { type: 'text', label: 'Aperture' }, iso: { type: 'text', label: 'ISO' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { eyebrow: 'Director of photography', title: 'LIGHT IS THE\nFIRST CHARACTER.', image: '/images/photo-5.jpg', imageCrop: 'center center', imageAlt: 'Portrait framed through a circular lens', focalLength: '50 MM', aperture: 'ƒ / 1.4', iso: 'ISO 800', theme: 'black' },
      render: ({ eyebrow, title, image, imageCrop, imageAlt, focalLength, aperture, iso, theme }) => <section className={`builder-lens-hero builder-theme--${theme}`}><div className="builder-lens-hero__copy"><p className="builder-kicker">{eyebrow}</p><h1>{title}</h1><div><span>{focalLength}</span><span>{aperture}</span><span>{iso}</span></div></div><figure className="builder-lens"><div className="builder-lens__glass"><img src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /></div><figcaption>{focalLength} · {aperture} · {iso}</figcaption></figure></section>,
    },
    ViewfinderBlock: {
      label: 'Camera viewfinder',
      fields: { image: imageField('Viewfinder image'), imageCrop: cropField(), alt: { type: 'text', label: 'Image description' }, label: { type: 'text', label: 'Shot label', contentEditable: true }, timecode: { type: 'text', label: 'Timecode' }, lens: { type: 'text', label: 'Lens readout' }, format: { type: 'radio', label: 'Frame format', options: [{ label: 'CinemaScope', value: 'scope' }, { label: 'Widescreen', value: 'wide' }, { label: 'Academy', value: 'academy' }] } },
      defaultProps: { image: '/images/photo-6.jpg', alt: 'Cinematic landscape in camera viewfinder', label: 'SHOT 08 · THE ARRIVAL', timecode: '01:24:08:12', lens: '35 MM · T2.8 · 24 FPS', format: 'scope' },
      render: ({ image, imageCrop, alt, label, timecode, lens, format }) => <figure className={`builder-viewfinder builder-viewfinder--${format}`}><div><img src={image} alt={alt || ''} style={imagePosition(imageCrop)} /><span className="builder-viewfinder__corners" aria-hidden="true" /><span className="builder-viewfinder__reticle" aria-hidden="true" /><b>REC ●</b><em>{timecode}</em></div><figcaption><span>{label}</span><span>{lens}</span></figcaption></figure>,
    },
    StoryboardBlock: {
      label: 'Storyboard sequence',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Sequence title', contentEditable: true }, panels: { type: 'array', label: 'Storyboard panels', min: 2, max: 12, arrayFields: { image: imageField('Panel image'), crop: cropField(), alt: { type: 'text', label: 'Image description' }, shot: { type: 'text', label: 'Shot number' }, action: { type: 'textarea', label: 'Action / camera note' } }, defaultItemProps: (index) => ({ image: `/images/photo-${(index % 10) + 1}.jpg`, crop: 'center center', alt: 'Storyboard frame', shot: `${index + 1}A`, action: 'Describe the action and camera move.' }), getItemSummary: (item, index) => item.shot || `Panel ${(index || 0) + 1}` } },
      defaultProps: { eyebrow: 'Sequence 03', title: 'The long way home', panels: [{ image: '/images/photo-7.jpg', alt: 'Wide establishing shot', shot: '03A · WS', action: 'Static. Hold for the figure to enter frame.' }, { image: '/images/photo-8.jpg', alt: 'Moving medium shot', shot: '03B · MS', action: 'Slow push. Subject turns toward the light.' }, { image: '/images/photo-9.jpg', alt: 'Close detail shot', shot: '03C · CU', action: 'Handheld detail. Cut on the sound cue.' }] },
      render: ({ eyebrow, title, panels }) => <section className="builder-storyboard"><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><div>{(panels || []).map((panel: { image: string; crop?: string; alt: string; shot: string; action: string }, index: number) => <figure key={`${panel.shot}-${index}`}><div><img src={panel.image} alt={panel.alt || ''} style={imagePosition(panel.crop)} /><span>{String(index + 1).padStart(2, '0')}</span></div><figcaption><strong>{panel.shot}</strong><p>{panel.action}</p></figcaption></figure>)}</div></section>,
    },
    ReelShowcaseBlock: {
      label: 'Showreel feature',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Reel title', contentEditable: true }, image: imageField('Poster image'), imageCrop: cropField(), imageAlt: { type: 'text', label: 'Image description' }, url: { type: 'text', label: 'Reel link' }, duration: { type: 'text', label: 'Duration' }, year: { type: 'text', label: 'Year' }, roles: { type: 'text', label: 'Roles' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { eyebrow: 'New reel', title: 'CINEMATOGRAPHY / 2026', image: '/images/reel-cinematography.jpg', imageCrop: 'center center', imageAlt: 'Cinematography showreel poster', url: '#', duration: '02:47', year: '2026', roles: 'NARRATIVE · COMMERCIAL · MUSIC', theme: 'black' },
      render: ({ eyebrow, title, image, imageCrop, imageAlt, url, duration, year, roles, theme }) => <section className={`builder-reel-showcase builder-theme--${theme}`}><header><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2></header><a href={url}><div><img src={image} alt={imageAlt || ''} style={imagePosition(imageCrop)} /><span className="builder-reel-showcase__play" aria-hidden="true">PLAY</span><i aria-hidden="true" /></div><footer><span>{roles}</span><span>{year}</span><span>{duration}</span></footer></a></section>,
    },
    ColorGradeBlock: {
      label: 'Color grade triptych',
      fields: { title: { type: 'text', label: 'Title', contentEditable: true }, image: imageField('Master image'), imageCrop: cropField(), alt: { type: 'text', label: 'Image description' }, firstLabel: { type: 'text', label: 'First look' }, secondLabel: { type: 'text', label: 'Second look' }, thirdLabel: { type: 'text', label: 'Third look' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { title: 'Three ways to hold the night.', image: '/images/photo-10.jpg', imageCrop: 'center center', alt: 'Night scene shown with three color grades', firstLabel: '01 · NEGATIVE', secondLabel: '02 · WORK PRINT', thirdLabel: '03 · FINAL GRADE', theme: 'paper' },
      render: ({ title, image, imageCrop, alt, firstLabel, secondLabel, thirdLabel, theme }) => <section className={`builder-color-grade builder-theme--${theme}`}><h2>{title}</h2><div>{[firstLabel, secondLabel, thirdLabel].map((label, index) => <figure className={`builder-color-grade__look builder-color-grade__look--${index + 1}`} key={`${label}-${index}`}><img src={image} alt={index === 0 ? (alt || '') : ''} style={imagePosition(imageCrop)} /><figcaption>{label}</figcaption></figure>)}</div></section>,
    },
    FilmStockBlock: {
      label: 'Film stock details',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Title', contentEditable: true }, stock: { type: 'text', label: 'Stock name' }, format: { type: 'text', label: 'Format' }, speed: { type: 'text', label: 'Speed' }, process: { type: 'text', label: 'Process' }, note: { type: 'textarea', label: 'Creative note', contentEditable: true }, accent: colorField('Label color') },
      defaultProps: { eyebrow: 'Capture notes', title: 'Built from grain, halation, and available light.', stock: 'VISION3 500T', format: '35 MM / 4 PERF', speed: 'EI 800', process: 'ECN-2 · +1 PUSH', note: 'Use this block for technical notes, equipment lists, or the small choices that shaped the image.', accent: '#f2c84b' },
      render: ({ eyebrow, title, stock, format, speed, process, note, accent }) => <section className="builder-film-stock"><div className="builder-film-stock__can" style={{ '--stock-accent': accent } as CSSProperties}><div className="builder-film-stock__label"><span>35 MM</span><b>{stock}</b><small>MOTION PICTURE FILM</small></div><i aria-hidden="true" /></div><div className="builder-film-stock__copy"><p className="builder-kicker">{eyebrow}</p><h2>{title}</h2><dl><div><dt>Stock</dt><dd>{stock}</dd></div><div><dt>Format</dt><dd>{format}</dd></div><div><dt>Exposure</dt><dd>{speed}</dd></div><div><dt>Process</dt><dd>{process}</dd></div></dl><p>{note}</p></div></section>,
    },
    EndCreditsBlock: {
      label: 'End credits',
      fields: { title: { type: 'text', label: 'Closing title', contentEditable: true }, subtitle: { type: 'text', label: 'Subtitle', contentEditable: true }, align: { type: 'radio', label: 'Alignment', options: alignOptions }, credits: { type: 'array', label: 'Credits', min: 2, max: 30, arrayFields: { role: { type: 'text', label: 'Role' }, name: { type: 'text', label: 'Name' } }, defaultItemProps: (index) => ({ role: `ROLE ${index + 1}`, name: 'COLLABORATOR NAME' }), getItemSummary: (item, index) => item.role || `Credit ${(index || 0) + 1}` } },
      defaultProps: { title: 'THE END', subtitle: 'A FILM BY YOUR STUDIO', align: 'center', credits: [{ role: 'DIRECTOR', name: 'YOUR NAME' }, { role: 'CINEMATOGRAPHER', name: 'COLLABORATOR NAME' }, { role: 'EDITOR', name: 'COLLABORATOR NAME' }, { role: 'COLORIST', name: 'COLLABORATOR NAME' }, { role: 'MUSIC', name: 'ORIGINAL SCORE' }] },
      render: ({ title, subtitle, align, credits }) => <section className={`builder-end-credits builder-end-credits--${align}`}><p>{subtitle}</p><h2>{title}</h2><dl>{(credits || []).map((credit: { role: string; name: string }, index: number) => <div key={`${credit.role}-${index}`}><dt>{credit.role}</dt><dd>{credit.name}</dd></div>)}</dl><span aria-hidden="true">●</span></section>,
    },
    CalendlyBlock: {
      label: 'Calendly scheduling',
      fields: {
        eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'text', label: 'Heading', contentEditable: true }, intro: { type: 'textarea', label: 'Supporting text', contentEditable: true },
        titleFont: fontField('Heading font'), introFont: fontField('Supporting text font'), schedulingUrl: { type: 'text', label: 'Calendly scheduling URL' },
        backgroundColor: colorField('Section / calendar background'), textColor: colorField('Text color'), primaryColor: colorField('Button / accent color'),
        hideDetails: { type: 'radio', label: 'Calendly profile details', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] },
        height: { type: 'radio', label: 'Calendar height', options: [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Tall', value: 'tall' }] },
      },
      defaultProps: { eyebrow: 'Let’s make something together', title: 'Choose a time that works.', intro: 'Book a short introduction call. No back-and-forth required.', titleFont: 'inherit', introFont: 'inherit', schedulingUrl: '', backgroundColor: '#f7f7f3', textColor: '#050505', primaryColor: '#d8ff00', hideDetails: 'hide', height: 'standard' },
      render: ({ eyebrow, title, intro, titleFont, introFont, schedulingUrl, backgroundColor, textColor, primaryColor, hideDetails, height, puck }) => {
        const url = buildCalendlyEmbedUrl(schedulingUrl || '', { backgroundColor, textColor, primaryColor, hideDetails: hideDetails === 'hide' });
        return <section className="builder-calendly" style={{ backgroundColor, color: textColor }}><header><p className="builder-kicker">{eyebrow}</p><h2 style={fontStyle(titleFont)}>{title}</h2><p style={fontStyle(introFont)}>{intro}</p></header>{url ? <CalendlyWidget url={url} height={embedHeights[height] || embedHeights.standard} isEditing={Boolean(puck?.isEditing)} /> : <div className="builder-calendly__empty">Add a Calendly scheduling link in the sidebar to show the calendar.</div>}</section>;
      },
    },
    GitHubRepositoryBlock: {
      label: 'GitHub repository',
      fields: {
        repoUrl: { type: 'text', label: 'GitHub repository URL' }, title: { type: 'text', label: 'Display heading', contentEditable: true },
        description: { type: 'radio', label: 'Description', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] }, stats: { type: 'radio', label: 'Repository statistics', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] }, topics: { type: 'radio', label: 'Topics', options: [{ label: 'Show', value: 'show' }, { label: 'Hide', value: 'hide' }] }, theme: { type: 'radio', label: 'Theme', options: themeOptions },
      },
      defaultProps: { repoUrl: '', title: '', description: 'show', stats: 'show', topics: 'show', theme: 'black' },
      render: ({ repoUrl, title, description, stats, topics, theme, puck }) => <GitHubRepositoryView repoUrl={repoUrl || ''} title={title || ''} description={description || 'show'} stats={stats || 'show'} topics={topics || 'show'} theme={theme || 'black'} isEditing={Boolean(puck?.isEditing)} />,
    },
    CustomCodeBlock: {
      label: 'Custom HTML / JS',
      fields: {
        title: { type: 'text', label: 'Accessible frame title' },
        code: { type: 'textarea', label: 'HTML, CSS, and JavaScript' },
        height: { type: 'radio', label: 'Frame height', options: [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Tall', value: 'tall' }] },
        frame: { type: 'radio', label: 'Outer spacing', options: [{ label: 'Framed', value: 'framed' }, { label: 'Full bleed', value: 'bleed' }] },
      },
      defaultProps: {
        title: 'Interactive custom artwork', height: 'standard', frame: 'framed',
        code: `<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; overflow: hidden; background: #050505; color: #f7f7f3; font: 700 clamp(32px, 10vw, 100px)/.9 system-ui, sans-serif; }
  .orb { position: fixed; width: 42vmin; aspect-ratio: 1; border-radius: 50%; background: #d8ff00; filter: blur(2px); mix-blend-mode: difference; }
</style>
<div class="orb"></div>
<div>MAKE<br>IT MOVE.</div>
<script>
  const orb = document.querySelector('.orb');
  addEventListener('pointermove', (event) => {
    orb.animate({ transform: \`translate(\${event.clientX - innerWidth / 2}px, \${event.clientY - innerHeight / 2}px)\` }, { duration: 700, fill: 'forwards' });
  });
</script>`,
      },
      render: ({ title, code, height, frame, puck }) => <section className={`builder-code builder-code--${frame}`}><div className={`builder-code__stage${puck?.isEditing ? ' builder-embed-stage--editing' : ''}`} style={{ height: embedHeights[height] || embedHeights.standard }}><iframe key={code} srcDoc={code} title={title || 'Custom interactive content'} sandbox="allow-forms allow-modals allow-scripts" allow="autoplay; fullscreen" referrerPolicy="no-referrer" />{puck?.isEditing ? <span className="builder-embed-stage__label">Sandboxed code preview · edit from the sidebar</span> : null}</div></section>,
    },
    DeveloperHeroBlock: {
      label: 'Developer hero',
      fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, body: { type: 'textarea', label: 'Supporting text', contentEditable: true }, ctaLabel: { type: 'text', label: 'Button label', contentEditable: true }, ctaUrl: { type: 'text', label: 'Button URL' }, status: { type: 'text', label: 'Status label', contentEditable: true }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { eyebrow: 'Independent software maker', title: 'MAKE THE INVISIBLE USEFUL.', body: 'I design and build calm, durable products for teams doing meaningful work.', ctaLabel: 'See the work ↗', ctaUrl: '#work', status: 'AVAILABLE FOR SELECT BUILDS', theme: 'black' },
      render: ({ eyebrow, title, body, ctaLabel, ctaUrl, status, theme }) => <section className={'builder-dev-hero builder-theme--' + theme}><div className="builder-dev-hero__grid"><p className="builder-kicker">{eyebrow}</p><span className="builder-dev-hero__status"><i />{status}</span></div><h1>{title}</h1><div className="builder-dev-hero__footer"><p>{body}</p><a href={ctaUrl || '#'}>{ctaLabel}</a></div></section>,
    },
    CodeSnippetBlock: {
      label: 'Code snippet',
      fields: { eyebrow: { type: 'text', label: 'Language label', contentEditable: true }, title: { type: 'text', label: 'Snippet title', contentEditable: true }, code: { type: 'textarea', label: 'Code', contentEditable: true }, filename: { type: 'text', label: 'Filename' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { eyebrow: 'TypeScript', title: 'A small boundary with a clear job.', filename: 'lib/format.ts', code: "export function formatName(name: string) {\\n  return name.trim().replace(/\\\\s+/g, ' ');\\n}", theme: 'black' },
      render: ({ eyebrow, title, code, filename, theme }) => <section className={'builder-dev-code builder-theme--' + theme}><header><span>{eyebrow}</span><strong>{filename}</strong></header><h2>{title}</h2><pre><code>{code}</code></pre></section>,
    },
    TerminalBlock: {
      label: 'Terminal session',
      fields: { title: { type: 'text', label: 'Terminal title' }, prompt: { type: 'text', label: 'Prompt' }, lines: { type: 'array', label: 'Terminal lines', min: 1, max: 16, arrayFields: { text: { type: 'text', label: 'Line' }, kind: { type: 'radio', label: 'Line type', options: [{ label: 'Command', value: 'command' }, { label: 'Output', value: 'output' }, { label: 'Success', value: 'success' }] } }, defaultItemProps: (index) => ({ text: index === 0 ? 'npm run build' : 'Build completed successfully.', kind: index === 0 ? 'command' : 'success' }), getItemSummary: (item, index) => item.text || 'Line ' + ((index || 0) + 1) } },
      defaultProps: { title: 'Local development', prompt: 'sam@studio:~/project$', lines: [{ text: 'npm run build', kind: 'command' }, { text: '▲ Compiled in 1.8s', kind: 'output' }, { text: 'Build completed successfully.', kind: 'success' }] },
      render: ({ title, prompt, lines }) => <section className="builder-dev-terminal"><header><span>{title}</span><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /></header><div><p className="builder-dev-terminal__prompt">{prompt}</p>{(lines || []).map((line: { text: string; kind: string }, index: number) => <p className={'builder-dev-terminal__line builder-dev-terminal__line--' + (line.kind || 'output')} key={line.text + '-' + index}><span>{line.kind === 'command' ? '›' : line.kind === 'success' ? '✓' : ' '}</span>{line.text}</p>)}</div></section>,
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
      defaultProps: { method: 'GET', path: '/v1/projects/:id', title: 'Read a project', description: 'Fetch the public project shape by its stable identifier.', response: '{\\n  \"id\": \"proj_7f2\",\\n  \"status\": \"active\"\\n}', auth: 'Public · rate limited', theme: 'paper' },
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
    ContactBlock: {
      label: 'Contact footer', fields: { eyebrow: { type: 'text', label: 'Small intro', contentEditable: true }, title: { type: 'textarea', label: 'Headline', contentEditable: true }, titleFont: fontField('Headline font'), align: { type: 'radio', label: 'Alignment', options: alignOptions }, email: { type: 'text', label: 'Email address' }, buttonLabel: { type: 'text', label: 'Button label', contentEditable: true }, buttonUrl: { type: 'text', label: 'Button URL' }, theme: { type: 'radio', label: 'Theme', options: themeOptions } },
      defaultProps: { eyebrow: 'Available for select projects', title: 'Let’s make something human.', titleFont: 'inherit', align: 'left', email: 'hello@example.com', buttonLabel: 'Start a conversation', buttonUrl: 'mailto:hello@example.com', theme: 'lime' },
      render: ({ eyebrow, title, titleFont, align, email, buttonLabel, buttonUrl, theme }) => <section className={`builder-contact builder-contact--${align} builder-theme--${theme}`}><p className="builder-kicker">{eyebrow}</p><h2 style={fontStyle(titleFont)}>{title}</h2><div><a href={`mailto:${email}`}>{email}</a><a href={buttonUrl}>{buttonLabel} ↗</a></div></section>,
    },
  },
  root: {
    fields: { title: { type: 'text', label: 'Browser title' }, favicon: imageField('Favicon (use a square image)'), socialTitle: { type: 'text', label: 'Social sharing title' }, socialDescription: { type: 'textarea', label: 'Social sharing description' }, socialImage: imageField('Social preview image (wide, ideally 1.91:1)'), socialImageAlt: { type: 'text', label: 'Social preview image description' }, displayFont: directFontField('Display / headline font'), bodyFont: directFontField('Body font'), accentFont: directFontField('Accent / caption font'), headingStyle: { type: 'radio', label: 'Heading weight', options: [{ label: 'Bold', value: 'bold' }, { label: 'Regular', value: 'classic' }, { label: 'Mixed', value: 'mixed' }] }, paperColor: colorField('Background color'), inkColor: colorField('Text color'), accentColor: colorField('Accent color'), contentWidth: { type: 'radio', label: 'Page width', options: [{ label: 'Focused', value: 'focused' }, { label: 'Standard', value: 'standard' }, { label: 'Full bleed', value: 'full' }] }, corners: { type: 'radio', label: 'Image corners', options: [{ label: 'Sharp', value: 'sharp' }, { label: 'Soft', value: 'soft' }, { label: 'Round', value: 'round' }] } },
    defaultProps: { title: 'Studio Name — Creative Portfolio', favicon: '/favicon.svg', socialTitle: 'Studio Name — Creative Portfolio', socialDescription: 'Selected creative work, process, and ways to collaborate.', socialImage: '/og.png', socialImageAlt: 'Studio Name creative portfolio social preview', displayFont: 'space-grotesk', bodyFont: 'inter', accentFont: 'fraunces', headingStyle: 'bold', paperColor: '#f7f7f3', inkColor: '#050505', accentColor: '#d8ff00', contentWidth: 'full', corners: 'sharp' },
    render: ({ children, displayFont = 'space-grotesk', bodyFont = 'inter', accentFont = 'fraunces', headingStyle = 'bold', paperColor = '#f7f7f3', inkColor = '#050505', accentColor = '#d8ff00', contentWidth = 'full', corners = 'sharp' }) => {
      const style = { '--site-paper': paperColor, '--site-ink': inkColor, '--site-accent': accentColor, '--font-display': FONT_FAMILIES[displayFont], '--font-body': FONT_FAMILIES[bodyFont], '--font-accent': FONT_FAMILIES[accentFont] } as CSSProperties;
      return <div className={`site-canvas site-heading--${headingStyle} site-width--${contentWidth} site-corners--${corners}`} style={style}>{children}</div>;
    },
  },
};

// Keep the section-name control and anchor behavior consistent across every
// current and future block registered above. Root settings are intentionally
// excluded because the root is the page canvas, not a linkable section.
for (const component of Object.values(builderConfig.components)) {
  component.fields = { name: sectionNameField, ...component.fields };
  component.render = withSectionAnchor(component.render);
}

export { starterData } from './templates';
