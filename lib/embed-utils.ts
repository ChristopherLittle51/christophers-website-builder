export type CalendlyEmbedOptions = {
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  hideDetails: boolean;
};

function colorValue(value: string) {
  const normalized = value.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : '';
}

export function buildCalendlyEmbedUrl(rawUrl: string, options: CalendlyEmbedOptions) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'https:' || (url.hostname !== 'calendly.com' && !url.hostname.endsWith('.calendly.com'))) return '';

    url.hash = '';
    if (options.hideDetails) {
      url.searchParams.set('hide_landing_page_details', '1');
      url.searchParams.set('hide_event_type_details', '1');
    } else {
      url.searchParams.delete('hide_landing_page_details');
      url.searchParams.delete('hide_event_type_details');
    }

    const colors = [
      ['background_color', colorValue(options.backgroundColor)],
      ['text_color', colorValue(options.textColor)],
      ['primary_color', colorValue(options.primaryColor)],
    ];
    for (const [name, value] of colors) {
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }

    return url.toString();
  } catch {
    return '';
  }
}
