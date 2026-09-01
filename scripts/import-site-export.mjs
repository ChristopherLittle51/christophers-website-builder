import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
const manifestPath = args.get('--manifest');
const originValue = args.get('--origin');
const dataDirValue = args.get('--data-dir');
if (!manifestPath || !originValue || !dataDirValue) {
  console.error('Usage: npm run import:site -- --manifest <export.json> --origin <https://site.example> --data-dir <directory>');
  process.exit(2);
}

const manifest = JSON.parse(await readFile(path.resolve(manifestPath), 'utf8'));
if (manifest.format !== 'open-canvas-site-export' || manifest.formatVersion !== 1 || !manifest.document || !Array.isArray(manifest.media) || !Array.isArray(manifest.analyticsEvents)) {
  throw new Error('Unsupported or invalid site export manifest.');
}
const origin = new URL(originValue);
if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Origin must use HTTP or HTTPS.');
const dataDir = path.resolve(dataDirValue);

function targetFor(relativeKey) {
  const normalized = path.posix.normalize(relativeKey).replace(/^\/+/, '');
  if (!normalized || normalized.startsWith('..')) throw new Error(`Unsafe export path: ${relativeKey}`);
  const target = path.resolve(dataDir, normalized);
  if (target !== dataDir && !target.startsWith(`${dataDir}${path.sep}`)) throw new Error(`Unsafe export path: ${relativeKey}`);
  return target;
}

async function atomicJson(relativeKey, value) {
  const target = targetFor(relativeKey);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.part`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
}

async function download(asset) {
  const target = targetFor(asset.objectKey);
  try {
    const current = await stat(target);
    if (current.size === asset.size) return { status: 'kept', size: current.size };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.part`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const url = new URL(asset.downloadPath, origin);
      if (url.origin !== origin.origin || !url.pathname.startsWith('/api/media/')) throw new Error(`Unsafe media URL for ${asset.id}`);
      const response = await fetch(url, { headers: { accept: asset.contentType } });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} for ${url.pathname}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, { mode: 0o600 }));
      const downloaded = await stat(temporary);
      if (downloaded.size !== asset.size) throw new Error(`Size mismatch for ${asset.id}: expected ${asset.size}, received ${downloaded.size}`);
      await rename(temporary, target);
      return { status: 'downloaded', size: downloaded.size };
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    }
  }
  throw lastError;
}

await atomicJson('documents/home.json', manifest.document);
for (const asset of manifest.media) {
  await atomicJson(`media-meta/${asset.id}.json`, {
    id: asset.id,
    objectKey: asset.objectKey,
    filename: asset.filename,
    contentType: asset.contentType,
    size: asset.size,
    createdAt: asset.createdAt,
    createdBy: asset.createdBy,
  });
}
for (const event of manifest.analyticsEvents) await atomicJson(`analytics/events/${event.createdAt.slice(0, 10)}/${event.id}.json`, event);

let next = 0;
let downloaded = 0;
let kept = 0;
let totalBytes = 0;
const workers = Array.from({ length: Math.min(4, Math.max(1, manifest.media.length)) }, async () => {
  while (next < manifest.media.length) {
    const asset = manifest.media[next++];
    const result = await download(asset);
    totalBytes += result.size;
    if (result.status === 'downloaded') downloaded += 1;
    else kept += 1;
    console.log(`[${downloaded + kept}/${manifest.media.length}] ${result.status} ${asset.filename}`);
  }
});
await Promise.all(workers);

const documentHash = createHash('sha256').update(await readFile(targetFor('documents/home.json'))).digest('hex');
console.log(JSON.stringify({ dataDir, media: manifest.media.length, downloaded, kept, totalBytes, analyticsEvents: manifest.analyticsEvents.length, documentSha256: documentHash }, null, 2));
