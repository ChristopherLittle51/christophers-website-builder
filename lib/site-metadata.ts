import type { Data } from '@puckeditor/core';

export const DEFAULT_SITE_TITLE = 'Open Canvas — Creative Portfolio';
export const DEFAULT_SITE_DESCRIPTION = 'A visual portfolio made with Open Canvas Builder.';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeAssetUrl(value: unknown) {
  const candidate = text(value);
  if (!candidate) return '';
  if (candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\n') && !candidate.includes('\r')) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function getSiteMetadataSettings(data: Data) {
  const props = (data.root?.props || {}) as Record<string, unknown>;
  const browserTitle = text(props.title) || DEFAULT_SITE_TITLE;
  const socialTitle = text(props.socialTitle) || browserTitle;
  const socialDescription = text(props.socialDescription) || DEFAULT_SITE_DESCRIPTION;
  const socialImage = safeAssetUrl(props.socialImage) || '/og.png';

  return {
    browserTitle,
    socialTitle,
    socialDescription,
    socialImage,
    socialImageAlt: text(props.socialImageAlt) || `${socialTitle} social preview`,
    favicon: safeAssetUrl(props.favicon) || '/favicon.svg',
    usesDefaultSocialImage: socialImage === '/og.png',
    usesDefaultFavicon: (safeAssetUrl(props.favicon) || '/favicon.svg') === '/favicon.svg',
  };
}
