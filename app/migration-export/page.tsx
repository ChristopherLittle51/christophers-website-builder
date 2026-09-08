import { privatePageMetadata } from '@/lib/seo';
export const metadata = privatePageMetadata;
import { ExportClient } from './ExportClient';

export default function MigrationExportPage() {
  return <ExportClient />;
}
