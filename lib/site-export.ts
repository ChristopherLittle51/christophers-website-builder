import type { AnalyticsEvent } from './analytics-types';
import type { Data } from '@puckeditor/core';
import type { SitePage } from './site-pages';

export const SITE_EXPORT_FORMAT = 'open-canvas-site-export' as const;
export const SITE_EXPORT_VERSION = 1 as const;

export type ExportedSiteDocument = {
  published: Data;
  draft: Data;
  pages?: SitePage[];
  homepageId?: string;
  version: number;
  updatedAt: string | null;
  updatedBy: string;
};

export type ExportedMediaAsset = {
  id: string;
  objectKey: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  createdBy: string;
};

export type SiteExportManifest = {
  format: typeof SITE_EXPORT_FORMAT;
  formatVersion: typeof SITE_EXPORT_VERSION;
  exportedAt: string;
  document: ExportedSiteDocument;
  media: Array<ExportedMediaAsset & { downloadPath: string }>;
  analyticsEvents: AnalyticsEvent[];
};
