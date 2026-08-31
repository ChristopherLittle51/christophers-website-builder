const VALID_DAYS = [7, 30, 90] as const;

export function analyticsDays(value: string | null | undefined): number {
  const parsed = Number(value);
  return VALID_DAYS.includes(parsed as (typeof VALID_DAYS)[number]) ? parsed : 30;
}

export function classifyDevice(userAgent: string | null) {
  const value = (userAgent || '').toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(value)) return 'tablet' as const;
  if (/android|iphone|ipod|mobile|windows phone/.test(value)) return 'mobile' as const;
  return 'desktop' as const;
}
