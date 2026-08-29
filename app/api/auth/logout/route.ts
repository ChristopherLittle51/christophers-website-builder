import { expiredSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const response = new Response(null, { status: 303, headers: { location: '/login' } });
  response.headers.set('set-cookie', expiredSessionCookie(request));
  return response;
}
