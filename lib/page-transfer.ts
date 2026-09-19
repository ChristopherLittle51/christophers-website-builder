import type { Data } from '@puckeditor/core';

export const PAGE_EXPORT_FORMAT = 'open-canvas-page' as const;
export const PAGE_EXPORT_VERSION = 1 as const;

export type PageExport = {
  format: typeof PAGE_EXPORT_FORMAT;
  formatVersion: typeof PAGE_EXPORT_VERSION;
  title: string;
  slug: string;
  data: Data;
};

export function isBuilderData(value: unknown): value is Data {
  if (!value || typeof value !== 'object') return false;
  const data = value as { content?: unknown; root?: unknown };
  return Array.isArray(data.content) && !!data.root && typeof data.root === 'object';
}

export function makePageExport(title: string, slug: string, data: Data): PageExport {
  return {
    format: PAGE_EXPORT_FORMAT,
    formatVersion: PAGE_EXPORT_VERSION,
    title,
    slug,
    data,
  };
}

export function parsePageExport(value: unknown): PageExport | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as {
    format?: unknown;
    formatVersion?: unknown;
    title?: unknown;
    slug?: unknown;
    data?: unknown;
  };

  if (candidate.format !== PAGE_EXPORT_FORMAT || candidate.formatVersion !== PAGE_EXPORT_VERSION || !isBuilderData(candidate.data)) return null;

  return {
    format: PAGE_EXPORT_FORMAT,
    formatVersion: PAGE_EXPORT_VERSION,
    title: typeof candidate.title === 'string' ? candidate.title.trim().slice(0, 120) : '',
    slug: typeof candidate.slug === 'string' ? candidate.slug : '',
    data: candidate.data,
  };
}
