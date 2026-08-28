'use client';

import { Render, type Data } from '@puckeditor/core';
import { builderConfig } from '@/lib/site-builder';

export default function PublishedPage({ data }: { data: Data }) {
  return <main><Render config={builderConfig} data={data} /></main>;
}
