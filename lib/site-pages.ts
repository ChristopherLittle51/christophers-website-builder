import type { Data } from '@puckeditor/core';

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  draft: Data;
  published: Data | null;
};

export type PageSummary = Pick<SitePage, 'id' | 'slug' | 'title'>;

type LegacyDocument = {
  draft: Data;
  published: Data;
  pages?: SitePage[];
  homepageId?: string;
};

export function slugifyPage(value: string) {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function pageTitle(data: Data, fallback = 'Untitled page') {
  const title = data.root?.props && typeof data.root.props.title === 'string' ? data.root.props.title.trim() : '';
  return title || fallback;
}

export function toSitePages(document: LegacyDocument, fallback: Data) {
  if (document.pages?.length) {
    const pages = document.pages.map((page) => ({ ...page, slug: page.slug || 'home', title: page.title || pageTitle(page.draft) }));
    return { pages, homepageId: pages.some((page) => page.id === document.homepageId) ? document.homepageId! : pages[0].id };
  }
  const draft = document.draft || fallback;
  const published = document.published || fallback;
  return { pages: [{ id: 'home', slug: 'home', title: pageTitle(draft, 'Home'), draft, published }], homepageId: 'home' };
}

export function uniquePageSlug(requested: string, pages: Pick<SitePage, 'id' | 'slug'>[], exceptId?: string) {
  const base = slugifyPage(requested) || 'page';
  let candidate = base;
  let suffix = 2;
  while (candidate === 'analytics' || pages.some((page) => page.id !== exceptId && page.slug === candidate)) candidate = `${base}-${suffix++}`;
  return candidate;
}

export function summaries(pages: SitePage[]): PageSummary[] {
  return pages.map(({ id, slug, title }) => ({ id, slug, title }));
}
