export type GitHubRepositoryRef = {
  owner: string;
  repo: string;
};

/** Accepts a GitHub repository URL or the compact owner/repository form. */
export function parseGitHubRepository(value: string): GitHubRepositoryRef | null {
  const raw = value.trim();
  if (!raw) return null;

  let path = raw;
  if (/^https?:\/\//i.test(raw) || /^github\.com\//i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (url.hostname.toLowerCase() !== 'github.com' && url.hostname.toLowerCase() !== 'www.github.com') return null;
      path = url.pathname;
    } catch {
      return null;
    }
  }

  const parts = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length !== 2 || parts.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part))) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function formatGitHubCount(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatGitHubDate(value: string | null | undefined) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}
