import { createSession, sessionCookie, verifyAdminPassword } from '@/lib/auth';

export const runtime = 'nodejs';

function redirect(location: string) {
  return new Response(null, { status: 303, headers: { location } });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get('password') || '');
  const raw = String(form.get('returnTo') || '/edit');
  const returnTo = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/edit';
  if (!verifyAdminPassword(password)) return redirect(`/login?error=1&returnTo=${encodeURIComponent(returnTo)}`);
  const response = redirect(returnTo);
  response.headers.set('set-cookie', sessionCookie(createSession(), request));
  return response;
}
