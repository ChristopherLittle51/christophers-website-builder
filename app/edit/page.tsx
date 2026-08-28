import { SESSION_COOKIE, verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EditorClient from './EditorClient';
import './editor.css';

export const dynamic = 'force-dynamic';

export default async function EditPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(token)) redirect('/login?returnTo=/edit');
  return <EditorClient editorName="Creator" />;
}
