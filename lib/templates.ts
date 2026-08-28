import type { Data } from '@puckeditor/core';

const root = (title: string, accentColor: string, displayFont = 'space-grotesk', bodyFont = 'inter') => ({
  props: {
    title,
    favicon: '/favicon.svg',
    socialTitle: title,
    socialDescription: 'Selected creative work, process, and ways to collaborate.',
    socialImage: '/og.png',
    socialImageAlt: `${title} social preview`,
    displayFont,
    bodyFont,
    accentFont: 'ibm-plex-mono',
    headingStyle: 'bold',
    paperColor: '#f7f7f3',
    inkColor: '#050505',
    accentColor,
    contentWidth: 'full',
    corners: 'sharp',
  },
});

export const portfolioTemplate: Data = {
  root: root('Studio Name — Creative Portfolio', '#d8ff00'),
  content: [
    { type: 'EditorialHero', props: { id: 'hero-portfolio', eyebrow: 'Independent creative practice', title: 'WORK WITH\nA POINT OF VIEW', byline: 'Film · Image · Design', image: '/images/demo-hero.jpg', imageAlt: 'Abstract creative studio composition', theme: 'paper' } },
    { type: 'TextBlock', props: { id: 'intro-portfolio', eyebrow: 'About the practice', heading: 'Make the idea impossible to ignore.', body: 'Use this space for a short, specific point of view. Then build the page from modular work, story, process, and contact blocks.', align: 'left' } },
    { type: 'ProjectGrid', props: { id: 'projects-portfolio', number: '001', title: 'Featured work', intro: 'A pair of projects with enough room to breathe.', image1: '/images/demo-coral.jpg', title1: 'Campaign direction', url1: '#', image2: '/images/demo-blue.jpg', title2: 'Moving image study', url2: '#', theme: 'paper' } },
    { type: 'ExpandableGrid', props: { id: 'gallery-portfolio', number: '002—007', title: 'Selected images', intro: 'Add, remove, and reorder images. The grid reflows at every size.', layout: 'editorial', density: 'medium', gap: 'tight', items: [
      { image: '/images/demo-hero.jpg', alt: 'Abstract composition', caption: 'Direction', shape: 'large' },
      { image: '/images/demo-blue.jpg', alt: 'Blue abstract composition', caption: 'Motion', shape: 'tall' },
      { image: '/images/demo-coral.jpg', alt: 'Coral abstract composition', caption: 'Identity', shape: 'auto' },
      { image: '/images/demo-lime.jpg', alt: 'Lime abstract composition', caption: 'Editorial', shape: 'wide' },
    ] } },
    { type: 'ContactBlock', props: { id: 'contact-portfolio', eyebrow: 'Available for thoughtful collaborations', title: 'Bring the good idea.', email: 'hello@example.com', buttonLabel: 'Start a project', buttonUrl: 'mailto:hello@example.com', theme: 'lime' } },
  ],
};

export const minimalTemplate: Data = {
  root: root('Studio Name — Selected Work', '#ff633f', 'cormorant', 'dm-sans'),
  content: [
    { type: 'HeadingBlock', props: { id: 'minimal-heading', text: 'Selected work, 2024—2026', level: 'h1', font: 'cormorant', size: 'oversized', tracking: 'tight', align: 'left' } },
      { type: 'ParagraphBlock', props: { id: 'minimal-copy', text: 'A quiet, image-first index for photographers, artists, directors, and independent studios.', font: 'dm-sans', size: 'lead', align: 'left', width: 'narrow' } },
    { type: 'ExpandableGrid', props: { id: 'minimal-grid', number: '001—012', title: 'Index', intro: 'A uniform contact sheet that can grow with the work.', layout: 'uniform', density: 'small', gap: 'medium', items: [
      { image: '/images/demo-hero.jpg', alt: 'Work sample one', caption: 'Project One', shape: 'auto' },
      { image: '/images/demo-blue.jpg', alt: 'Work sample two', caption: 'Project Two', shape: 'auto' },
      { image: '/images/demo-coral.jpg', alt: 'Work sample three', caption: 'Project Three', shape: 'auto' },
      { image: '/images/demo-lime.jpg', alt: 'Work sample four', caption: 'Project Four', shape: 'auto' },
    ] } },
    { type: 'ContactBlock', props: { id: 'minimal-contact', eyebrow: 'Commissions and collaborations', title: 'Let’s make the next one.', email: 'hello@example.com', buttonLabel: 'Email the studio', buttonUrl: 'mailto:hello@example.com', theme: 'paper' } },
  ],
};

export const caseStudyTemplate: Data = {
  root: root('Project Title — Case Study', '#ff7c98', 'fraunces', 'manrope'),
  content: [
    { type: 'EditorialHero', props: { id: 'case-hero', eyebrow: 'Case study · 2026', title: 'ONE IDEA,\nFULLY REALIZED', byline: 'Direction · Design · Production', image: '/images/demo-coral.jpg', imageAlt: 'Abstract project key art', theme: 'paper' } },
    { type: 'LayoutContainer', props: { id: 'case-layout', columns: 'two', ratio: 'wide-first', gap: 'airy', padding: 'generous', verticalAlign: 'start', theme: 'paper', first: [
      { type: 'HeadingBlock', props: { id: 'case-heading', text: 'The brief', level: 'h2', font: 'fraunces', size: 'large', tracking: 'tight', align: 'left' } },
      { type: 'ParagraphBlock', props: { id: 'case-body', text: 'Explain the problem, your point of view, and the constraint that made the result interesting.', font: 'manrope', size: 'lead', align: 'left', width: 'wide' } },
    ], second: [
      { type: 'StatsBlock', props: { id: 'case-stats', font: 'space-grotesk', align: 'left', items: [{ value: '06', label: 'weeks' }, { value: '3×', label: 'engagement' }, { value: '12', label: 'deliverables' }], theme: 'lime' } },
    ], third: [], fourth: [] } },
    { type: 'BeforeAfter', props: { id: 'case-compare', label: 'Drag to compare the starting point and final frame.', labelFont: 'fraunces', before: '/images/demo-blue.jpg', beforeAlt: 'Project before image', after: '/images/demo-lime.jpg', afterAlt: 'Project after image' } },
    { type: 'TimelineBlock', props: { id: 'case-process', eyebrow: 'Process', title: 'A clear path, with room for instinct.', titleFont: 'fraunces', items: [
      { marker: '01', title: 'Listen', detail: 'Find the emotional and practical center of the brief.' },
      { marker: '02', title: 'Make', detail: 'Test quickly, keep what has energy, and build the system.' },
      { marker: '03', title: 'Refine', detail: 'Edit toward the clearest and most memorable version.' },
    ] } },
    { type: 'ContactBlock', props: { id: 'case-contact', eyebrow: 'Next project', title: 'Make the next one together.', email: 'hello@example.com', buttonLabel: 'Get in touch', buttonUrl: 'mailto:hello@example.com', theme: 'lime' } },
  ],
};

export const expressiveTemplate: Data = {
  root: root('Studio Name — Experiments', '#55e6ff', 'bricolage', 'dm-sans'),
  content: [
    { type: 'MarqueeBlock', props: { id: 'expressive-marquee', text: 'IMAGE · MOTION · TYPE · SOUND · FEELING · ', font: 'bricolage', speed: 'slow', direction: 'left', theme: 'lime' } },
    { type: 'StickyStory', props: { id: 'expressive-story', eyebrow: 'A held moment', title: 'Let one image slow the page down.', body: 'On a large screen the image stays in view as the story moves. On a phone it becomes a clean natural stack.', titleFont: 'bricolage', bodyFont: 'dm-sans', image: '/images/demo-blue.jpg', imageAlt: 'Abstract blue studio artwork', imageSide: 'right', theme: 'black' } },
    { type: 'QuoteBlock', props: { id: 'expressive-quote', quote: 'Useful can still be strange, tactile, and full of personality.', attribution: 'Studio principle', quoteFont: 'fraunces', attributionFont: 'ibm-plex-mono', size: 'monumental', align: 'center', theme: 'paper' } },
    { type: 'ContactBlock', props: { id: 'expressive-contact', eyebrow: 'Your next experiment', title: 'Give it a memorable shape.', email: 'hello@example.com', buttonLabel: 'Start a conversation', buttonUrl: 'mailto:hello@example.com', theme: 'lime' } },
  ],
};

export const templates = [
  { id: 'portfolio', name: 'Creative portfolio', description: 'A balanced home for multidisciplinary work.', data: portfolioTemplate },
  { id: 'minimal', name: 'Minimal work index', description: 'A quiet, scalable image-first archive.', data: minimalTemplate },
  { id: 'case-study', name: 'Project case study', description: 'Tell one project story from brief through outcome.', data: caseStudyTemplate },
  { id: 'expressive', name: 'Expressive studio', description: 'A kinetic, editorial home for experiments and bold work.', data: expressiveTemplate },
] as const;

export const starterData = portfolioTemplate;
