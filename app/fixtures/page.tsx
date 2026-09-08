import { notFound } from 'next/navigation';
import EditorClient from '../edit/EditorClient';
import FixtureGallery from './FixtureGallery';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Component verification gallery', robots: { index: false, follow: false } };

export default async function Fixtures({ searchParams }: { searchParams: Promise<{ component?: string; mode?: string; stress?: string }> }) {
  if (process.env.COMPONENT_FIXTURES !== '1') notFound();
  const params = await searchParams;
  if (params.mode === 'studio') return <EditorClient editorName="Editor regression" />;
  return <FixtureGallery selected={params.component} editor={params.mode === 'editor'} stress={params.stress === '1'} />;
}
