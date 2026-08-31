import type { CSSProperties } from 'react';

/** The ten curated families available to every editable text surface. */
export const FONT_OPTIONS = [
  { label: 'Inter — precise sans', value: 'inter' },
  { label: 'Manrope — warm geometric', value: 'manrope' },
  { label: 'Space Grotesk — graphic sans', value: 'space-grotesk' },
  { label: 'DM Sans — clean editorial', value: 'dm-sans' },
  { label: 'Bricolage Grotesque — expressive', value: 'bricolage' },
  { label: 'Playfair Display — high contrast serif', value: 'playfair' },
  { label: 'Cormorant Garamond — artful serif', value: 'cormorant' },
  { label: 'Fraunces — character serif', value: 'fraunces' },
  { label: 'IBM Plex Mono — technical mono', value: 'ibm-plex-mono' },
  { label: 'Roboto — neutral sans', value: 'roboto' }, { label: 'Open Sans — open humanist', value: 'open-sans' },
  { label: 'Lato — polished sans', value: 'lato' }, { label: 'Montserrat — geometric display', value: 'montserrat' },
  { label: 'Oswald — condensed display', value: 'oswald' }, { label: 'Raleway — elegant sans', value: 'raleway' },
  { label: 'Libre Baskerville — book serif', value: 'libre-baskerville' }, { label: 'Source Code Pro — code mono', value: 'source-code-pro' },
  { label: 'Nunito — rounded sans', value: 'nunito' }, { label: 'Archivo — editorial grotesk', value: 'archivo' },
] as const;

export const FONT_FAMILIES: Record<string, string> = {
  inter: '"Inter Variable", Arial, sans-serif', manrope: '"Manrope Variable", Arial, sans-serif',
  'space-grotesk': '"Space Grotesk Variable", Arial, sans-serif', 'dm-sans': '"DM Sans Variable", Arial, sans-serif',
  bricolage: '"Bricolage Grotesque Variable", Arial, sans-serif', playfair: '"Playfair Display Variable", Georgia, serif',
  cormorant: '"Cormorant Garamond Variable", Georgia, serif', fraunces: '"Fraunces Variable", Georgia, serif',
  'ibm-plex-mono': '"IBM Plex Mono", ui-monospace, monospace',
  roboto: 'Roboto, Arial, sans-serif', 'open-sans': '"Open Sans", Arial, sans-serif', lato: 'Lato, Arial, sans-serif', montserrat: 'Montserrat, Arial, sans-serif',
  oswald: 'Oswald, Arial, sans-serif', raleway: 'Raleway, Arial, sans-serif', 'libre-baskerville': '"Libre Baskerville", Georgia, serif',
  'source-code-pro': '"Source Code Pro", ui-monospace, monospace', nunito: 'Nunito, Arial, sans-serif', archivo: 'Archivo, Arial, sans-serif',
};

export const FONT_WEIGHTS = [{ label: 'Regular', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semibold', value: '600' }, { label: 'Bold', value: '700' }, { label: 'Black', value: '800' }];
export const FONT_STYLES = [{ label: 'Upright', value: 'normal' }, { label: 'Italic', value: 'italic' }];
export const LETTER_SPACING = [{ label: 'Tight', value: '-0.04em' }, { label: 'Natural', value: 'normal' }, { label: 'Wide', value: '0.08em' }, { label: 'Custom', value: 'custom' }];
export const WORD_SPACING = [{ label: 'Tight', value: '-0.04em' }, { label: 'Natural', value: 'normal' }, { label: 'Wide', value: '0.16em' }, { label: 'Custom', value: 'custom' }];
export const LINE_HEIGHTS = [{ label: 'Tight', value: '0.95' }, { label: 'Natural', value: '1.3' }, { label: 'Relaxed', value: '1.6' }, { label: 'Custom', value: 'custom' }];
export const TEXT_DECORATIONS = [{ label: 'None', value: 'none' }, { label: 'Underline', value: 'underline' }, { label: 'Strike', value: 'line-through' }];
export const TEXT_TRANSFORMS = [{ label: 'As typed', value: 'none' }, { label: 'Uppercase', value: 'uppercase' }, { label: 'Lowercase', value: 'lowercase' }, { label: 'Capitalize', value: 'capitalize' }];
export const FONT_KERNING = [{ label: 'Browser default', value: 'auto' }, { label: 'Normal', value: 'normal' }, { label: 'None', value: 'none' }];

type Field = Record<string, unknown>;
const select = (label: string, options: readonly { label: string; value: string }[]) => ({ type: 'select' as const, label, options });

/** Reusable Puck controls. Prefix allows several independently styled text roles in one block. */
export const typographyFields = (prefix = '', label = 'Text') => {
  const key = (name: string) => `${prefix}${name[0].toUpperCase()}${name.slice(1)}`;
  return {
    [key('font')]: select(`${label} font`, [{ label: 'Use site default', value: 'inherit' }, ...FONT_OPTIONS]),
    [key('fontWeight')]: select(`${label} weight`, FONT_WEIGHTS),
    [key('fontStyle')]: select(`${label} style`, FONT_STYLES),
    [key('letterSpacing')]: select(`${label} letter spacing`, LETTER_SPACING),
    [key('wordSpacing')]: select(`${label} word spacing`, WORD_SPACING),
    [key('lineHeight')]: select(`${label} line spacing`, LINE_HEIGHTS),
    [key('textDecoration')]: select(`${label} decoration`, TEXT_DECORATIONS),
    [key('textTransform')]: select(`${label} case`, TEXT_TRANSFORMS),
    [key('fontKerning')]: select(`${label} kerning`, FONT_KERNING),
  } satisfies Record<string, Field>;
};

export type TypographyProps = { font?: string; fontWeight?: string; fontStyle?: string; letterSpacing?: string; wordSpacing?: string; lineHeight?: string; textDecoration?: string; textTransform?: string; fontKerning?: string };
export function typographyStyle(props: TypographyProps): CSSProperties {
  const style: CSSProperties = {};
  if (props.font && props.font !== 'inherit') style.fontFamily = FONT_FAMILIES[props.font];
  if (props.fontWeight) style.fontWeight = Number(props.fontWeight) as CSSProperties['fontWeight'];
  if (props.fontStyle) style.fontStyle = props.fontStyle as CSSProperties['fontStyle'];
  if (props.letterSpacing && props.letterSpacing !== 'custom') style.letterSpacing = props.letterSpacing;
  if (props.wordSpacing && props.wordSpacing !== 'custom') style.wordSpacing = props.wordSpacing;
  if (props.lineHeight && props.lineHeight !== 'custom') style.lineHeight = props.lineHeight;
  if (props.textDecoration) style.textDecoration = props.textDecoration;
  if (props.textTransform) style.textTransform = props.textTransform;
  if (props.fontKerning) style.fontKerning = props.fontKerning as CSSProperties['fontKerning'];
  return style;
}
