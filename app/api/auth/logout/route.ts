import { expiredSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.headers.set('set-cookie', expiredSessionCookie());
  return response;
}
