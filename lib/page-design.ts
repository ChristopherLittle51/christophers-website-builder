import type { CSSProperties } from 'react';
import type { Data } from '@puckeditor/core';
import { FONT_FAMILIES } from './typography.ts';

const headingStyles = new Set(['bold', 'classic', 'mixed']);
const contentWidths = new Set(['focused', 'standard', 'full']);
const cornerStyles = new Set(['sharp', 'soft', 'round']);

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function choice(value: unknown, allowed: Set<string>, fallback: string) {
  return typeof value === 'string' && allowed.has(value) ? value : fallback;
}

export type PageDesign = { style: CSSProperties; className: string };

export function pageDesignFromProps(props: Record<string, unknown>): PageDesign {
  const paperColor = text(props.paperColor, '#f7f7f3');
  const inkColor = text(props.inkColor, '#050505');
  const accentColor = text(props.accentColor, '#d8ff00');
  const displayFont = text(props.displayFont, 'space-grotesk');
  const bodyFont = text(props.bodyFont, 'inter');
  const accentFont = text(props.accentFont, 'fraunces');
  const headingStyle = choice(props.headingStyle, headingStyles, 'bold');
  const contentWidth = choice(props.contentWidth, contentWidths, 'full');
  const corners = choice(props.corners, cornerStyles, 'sharp');

  const style = {
    '--site-paper': paperColor,
    '--site-ink': inkColor,
    '--site-accent': accentColor,
    '--font-display': FONT_FAMILIES[displayFont] || FONT_FAMILIES['space-grotesk'],
    '--font-body': FONT_FAMILIES[bodyFont] || FONT_FAMILIES.inter,
    '--font-accent': FONT_FAMILIES[accentFont] || FONT_FAMILIES.fraunces,
    background: paperColor,
    color: inkColor,
    fontFamily: FONT_FAMILIES[bodyFont] || FONT_FAMILIES.inter,
  } as CSSProperties;

  return {
    style,
    className: `site-heading--${headingStyle} site-width--${contentWidth} site-corners--${corners}`,
  };
}

export function pageDesign(data: Data): PageDesign {
  return pageDesignFromProps((data.root?.props || {}) as Record<string, unknown>);
}
