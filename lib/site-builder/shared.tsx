'use client';

import type { CustomFieldRender } from '@puckeditor/core';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { FONT_FAMILIES, FONT_OPTIONS } from '../typography';

type MediaFieldProps = { label: string; value: string; onChange: (value: string) => void; readOnly?: boolean; kind: 'image' | 'video' };

export function MediaUpload({ label, value, onChange, readOnly, kind }: MediaFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const isVideo = kind === 'video';
  const upload = async (file?: File) => {
    if (!file || readOnly) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/media', { method: 'POST', body: formData });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Upload failed');
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : `Could not upload this ${kind}.`);
    } finally {
      setUploading(false);
    }
  };

  return <label className="image-field" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }}>
    <span className="image-field__label">{label}</span>
    {value ? (isVideo ? <video src={value} aria-label="Current video upload" muted playsInline preload="metadata" /> : <img src={value} alt="Current upload" />) : <span className="image-field__empty">Drop {isVideo ? 'an MP4 or WebM video' : 'an image'} here</span>}
    <span className="image-field__action" aria-live="polite">{uploading ? 'Uploading…' : `Choose ${kind}`}</span>
    <input type="file" accept={isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif'} disabled={readOnly || uploading} onChange={(event) => void upload(event.target.files?.[0])} />
    {error ? <span className="image-field__error" role="alert">{error}</span> : null}
  </label>;
}

export const fontField = (label: string) => ({ type: 'select' as const, label, options: [{ label: 'Use site default', value: 'inherit' }, ...FONT_OPTIONS] });
export const directFontField = (label: string) => ({ type: 'select' as const, label, options: FONT_OPTIONS });
export const fontStyle = (font?: string): CSSProperties => font && font !== 'inherit' ? { fontFamily: FONT_FAMILIES[font] } : {};
export const imageField = (label: string) => ({ type: 'custom' as const, render: (({ value, onChange, readOnly }) => <MediaUpload label={label} kind="image" value={value || ''} onChange={onChange} readOnly={readOnly} />) as CustomFieldRender<string> });
export const videoField = (label: string) => ({ type: 'custom' as const, render: (({ value, onChange, readOnly }) => <MediaUpload label={label} kind="video" value={value || ''} onChange={onChange} readOnly={readOnly} />) as CustomFieldRender<string> });
export const cropOptions = [
  { label: 'Top left', value: 'left top' }, { label: 'Top', value: 'center top' }, { label: 'Top right', value: 'right top' },
  { label: 'Left', value: 'left center' }, { label: 'Center', value: 'center center' }, { label: 'Right', value: 'right center' },
  { label: 'Bottom left', value: 'left bottom' }, { label: 'Bottom', value: 'center bottom' }, { label: 'Bottom right', value: 'right bottom' },
];
export const cropField = (label = 'Photo crop') => ({ type: 'radio' as const, label, options: cropOptions });
export const colorField = (label: string) => ({ type: 'custom' as const, render: (({ value, onChange, readOnly }) => <label className="color-field"><span>{label}</span><div><input type="color" value={value || '#000000'} disabled={readOnly} onChange={(event) => onChange(event.target.value)} /><input type="text" value={value || ''} disabled={readOnly} onChange={(event) => onChange(event.target.value)} aria-label={`${label} hex value`} /></div></label>) as CustomFieldRender<string> });

export const alignOptions = [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }];
export const sizeOptions = [{ label: 'Compact', value: 'compact' }, { label: 'Standard', value: 'standard' }, { label: 'Oversized', value: 'oversized' }];
export const trackingOptions = [{ label: 'Tight', value: 'tight' }, { label: 'Natural', value: 'natural' }, { label: 'Wide', value: 'wide' }];
export const themeOptions = [{ label: 'Paper', value: 'paper' }, { label: 'Black', value: 'black' }, { label: 'Accent', value: 'lime' }];
export const qolGapOptions = [{ label: 'Tight', value: 'tight' }, { label: 'Comfortable', value: 'comfortable' }, { label: 'Airy', value: 'airy' }];
export const qolPaddingOptions = [{ label: 'None', value: 'none' }, { label: 'Compact', value: 'compact' }, { label: 'Generous', value: 'generous' }];
export const qolRadiusOptions = [{ label: 'Sharp', value: 'sharp' }, { label: 'Soft', value: 'soft' }, { label: 'Round', value: 'round' }];
export const qolToneOptions = themeOptions;
export const embedHeights: Record<string, number> = { compact: 540, standard: 700, tall: 860 };
export const typeClass = (prefix: string, size = 'standard', tracking = 'tight') => `${prefix} ${prefix}--size-${size} ${prefix}--tracking-${tracking}`;
export const sectionNameField = { type: 'text' as const, label: 'Section link name', description: 'Use this name in links like #photography.' };
export const imagePosition = (crop?: string): CSSProperties => ({ objectPosition: crop || 'center center' });
