/** Resolve the browser-facing origin after TLS termination at a reverse proxy.
 * The proxy must overwrite forwarded headers rather than preserve client values.
 */
export function analyticsRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host'))?.split(',')[0]?.trim();
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.slice(0, -1);
  if (!host || /[\s/\\@?#]/.test(host) || !['http', 'https'].includes(protocol)) return url.origin;
  try {
    const forwarded = new URL(`${protocol}://${host}`);
    // A host header must be an authority, never a URL, path or credentials.
    if (!forwarded.hostname) return url.origin;
    return forwarded.origin;
  } catch {
    return url.origin;
  }
}
