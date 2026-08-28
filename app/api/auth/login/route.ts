import { createSession, sessionCookie, verifyAdminPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get('password') || '');
  const raw = String(form.get('returnTo') || '/edit');
  const returnTo = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/edit';
  if (!verifyAdminPassword(password)) return NextResponse.redirect(new URL(`/login?error=1&returnTo=${encodeURIComponent(returnTo)}`, request.url), 303);
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.headers.set('set-cookie', sessionCookie(createSession()));
  return response;
}
