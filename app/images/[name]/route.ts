const palettes: Record<string, [string, string, string]> = {
  'demo-blue.jpg': ['#071a38', '#55e6ff', '#f7f7f3'],
  'demo-coral.jpg': ['#2e1220', '#ff7c98', '#ffd8b8'],
  'demo-lime.jpg': ['#050505', '#d8ff00', '#f7f7f3'],
  'demo-hero.jpg': ['#ece7de', '#111111', '#ff633f'],
};

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const fallback = Object.values(palettes);
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  const colors = palettes[name] || fallback[hash % fallback.length];
  const [background, foreground, accent] = colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100" role="img" aria-label="Abstract demo artwork">
    <rect width="1600" height="1100" fill="${background}"/>
    <circle cx="1260" cy="210" r="390" fill="${foreground}"/>
    <path d="M0 920L760 140l420 960H0z" fill="${accent}"/>
    <rect x="840" y="520" width="540" height="360" rx="24" fill="none" stroke="${foreground}" stroke-width="34" transform="rotate(-8 1110 700)"/>
    <text x="72" y="1020" fill="${foreground}" font-family="Arial,sans-serif" font-size="52" font-weight="700" letter-spacing="8">REPLACE WITH YOUR WORK</text>
  </svg>`;
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable' } });
}
