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

export const cinemaTemplate: Data = {
  root: root('Field Notes — Director & Photographer', '#f2c84b', 'space-grotesk', 'dm-sans'),
  content: [
    { type: 'LensHeroBlock', props: { id: 'cinema-lens', eyebrow: 'Director of photography', title: 'LIGHT IS THE\nFIRST CHARACTER.', image: '/images/photo-5.jpg', imageAlt: 'Portrait framed through a circular lens', focalLength: '50 MM', aperture: 'ƒ / 1.4', iso: 'ISO 800', theme: 'black' } },
    { type: 'DirectorsSlateBlock', props: { id: 'cinema-slate', production: 'A QUIET KIND OF LIGHT', director: 'DIRECTOR NAME', camera: 'DP NAME', scene: '24 B', take: '03', roll: 'A 007', date: '08 / 28 / 26', note: 'A graphic opener for the production story, treatment, or case study.', theme: 'paper' } },
    { type: 'ReelShowcaseBlock', props: { id: 'cinema-reel', eyebrow: 'New reel', title: 'CINEMATOGRAPHY / 2026', image: '/images/reel-cinematography.jpg', imageAlt: 'Cinematography showreel poster', url: '#', duration: '02:47', year: '2026', roles: 'NARRATIVE · COMMERCIAL · MUSIC', theme: 'black' } },
    { type: 'FilmStripBlock', props: { id: 'cinema-strip', title: 'Selected frames', stock: '35 MM · 500 T · ROLL 07', direction: 'horizontal', frames: [{ image: '/images/photo-1.jpg', alt: 'Cinematic portrait', caption: 'INT. STUDIO — DAWN' }, { image: '/images/photo-2.jpg', alt: 'Subject in motion', caption: 'TAKE 04 / A CAM' }, { image: '/images/photo-3.jpg', alt: 'Location detail', caption: 'EXT. COAST — 18:42' }, { image: '/images/photo-4.jpg', alt: 'Final film still', caption: 'ROLL 07 / 016' }], theme: 'black' } },
    { type: 'ContactSheetBlock', props: { id: 'cinema-contacts', title: 'Proofs / Lisbon', roll: 'ROLL 04 · 36 EXP · 2026', columns: 'four', frames: Array.from({ length: 8 }, (_, index) => ({ image: `/images/photo-${index + 1}.jpg`, alt: `Contact sheet frame ${index + 1}`, selected: [1, 6].includes(index) ? 'yes' : 'no' })) } },
    { type: 'ViewfinderBlock', props: { id: 'cinema-viewfinder', image: '/images/photo-6.jpg', alt: 'Cinematic landscape in camera viewfinder', label: 'SHOT 08 · THE ARRIVAL', timecode: '01:24:08:12', lens: '35 MM · T2.8 · 24 FPS', format: 'scope' } },
    { type: 'StoryboardBlock', props: { id: 'cinema-storyboard', eyebrow: 'Sequence 03', title: 'The long way home', panels: [{ image: '/images/photo-7.jpg', alt: 'Wide establishing shot', shot: '03A · WS', action: 'Static. Hold for the figure to enter frame.' }, { image: '/images/photo-8.jpg', alt: 'Moving medium shot', shot: '03B · MS', action: 'Slow push. Subject turns toward the light.' }, { image: '/images/photo-9.jpg', alt: 'Close detail shot', shot: '03C · CU', action: 'Handheld detail. Cut on the sound cue.' }] } },
    { type: 'ColorGradeBlock', props: { id: 'cinema-grade', title: 'Three ways to hold the night.', image: '/images/photo-10.jpg', alt: 'Night scene shown with three color grades', firstLabel: '01 · NEGATIVE', secondLabel: '02 · WORK PRINT', thirdLabel: '03 · FINAL GRADE', theme: 'paper' } },
    { type: 'FilmStockBlock', props: { id: 'cinema-stock', eyebrow: 'Capture notes', title: 'Built from grain, halation, and available light.', stock: 'VISION3 500T', format: '35 MM / 4 PERF', speed: 'EI 800', process: 'ECN-2 · +1 PUSH', note: 'Use this block for technical notes, equipment lists, or the small choices that shaped the image.', accent: '#f2c84b' } },
    { type: 'EndCreditsBlock', props: { id: 'cinema-credits', title: 'THE END', subtitle: 'A FILM BY YOUR STUDIO', align: 'center', credits: [{ role: 'DIRECTOR', name: 'YOUR NAME' }, { role: 'CINEMATOGRAPHER', name: 'COLLABORATOR NAME' }, { role: 'EDITOR', name: 'COLLABORATOR NAME' }, { role: 'COLORIST', name: 'COLLABORATOR NAME' }, { role: 'MUSIC', name: 'ORIGINAL SCORE' }] } },
  ],
};

export const templates = [
  { id: 'portfolio', name: 'Creative portfolio', description: 'A balanced home for multidisciplinary work.', data: portfolioTemplate },
  { id: 'minimal', name: 'Minimal work index', description: 'A quiet, scalable image-first archive.', data: minimalTemplate },
  { id: 'case-study', name: 'Project case study', description: 'Tell one project story from brief through outcome.', data: caseStudyTemplate },
  { id: 'expressive', name: 'Expressive studio', description: 'A kinetic, editorial home for experiments and bold work.', data: expressiveTemplate },
  { id: 'cinema', name: 'Director’s treatment', description: 'Ten production-inspired blocks for photography and moving image.', data: cinemaTemplate },
] as const;

export const starterData = portfolioTemplate;
