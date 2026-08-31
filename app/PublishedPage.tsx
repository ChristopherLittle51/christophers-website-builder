'use client';

import { Render, type Data } from '@puckeditor/core';
import { builderConfig } from '@/lib/site-builder';
import PageViewTracker from './PageViewTracker';

export default function PublishedPage({ data }: { data: Data }) {
  return <><PageViewTracker /><main><Render config={builderConfig} data={data} /></main></>;
}
