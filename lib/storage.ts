import 'server-only';

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Data } from '@puckeditor/core';
import type { SitePage } from './site-pages';

export type SiteDocument = {
  published: Data;
  draft: Data;
  pages?: SitePage[];
  homepageId?: string;
  version: number;
  updatedAt: string | null;
  updatedBy: string;
};

export type MediaAsset = {
  id: string;
  objectKey: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  createdBy: string;
};

export type MediaRead = {
  body: ReadableStream<Uint8Array>;
  contentLength: number;
  etag: string;
};

export type ByteSlice = { start: number; end: number };

interface StorageDriver {
  getSite(): Promise<SiteDocument | null>;
  putSite(document: SiteDocument): Promise<void>;
  putMedia(asset: MediaAsset, body: ReadableStream<Uint8Array>): Promise<void>;
  getMedia(id: string): Promise<MediaAsset | null>;
  readMedia(asset: MediaAsset, range?: ByteSlice): Promise<MediaRead | null>;
}

function safeRelativeKey(value: string) {
  const normalized = path.posix.normalize(value).replace(/^\/+/, '');
  if (!normalized || normalized.startsWith('..')) throw new Error('Unsafe storage key');
  return normalized;
}

class FileStorage implements StorageDriver {
  private root = process.env.DATA_DIR
    ? path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR)
    : path.join(process.cwd(), 'data');

  private resolve(key: string) {
    const target = path.resolve(this.root, safeRelativeKey(key));
    if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) throw new Error('Unsafe storage path');
    return target;
  }

  private async readJson<T>(key: string): Promise<T | null> {
    try {
      return JSON.parse(await readFile(this.resolve(key), 'utf8')) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private async writeJson(key: string, value: unknown) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, target);
  }

  getSite() {
    return this.readJson<SiteDocument>('documents/home.json');
  }

  putSite(document: SiteDocument) {
    return this.writeJson('documents/home.json', document);
  }

  async putMedia(asset: MediaAsset, body: ReadableStream<Uint8Array>) {
    const target = this.resolve(asset.objectKey);
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    await pipeline(Readable.fromWeb(body as never), createWriteStream(temporary, { mode: 0o600 }));
    await rename(temporary, target);
    await this.writeJson(`media-meta/${asset.id}.json`, asset);
  }

  getMedia(id: string) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) return Promise.resolve(null);
    return this.readJson<MediaAsset>(`media-meta/${id}.json`);
  }

  async readMedia(asset: MediaAsset, range?: ByteSlice): Promise<MediaRead | null> {
    const target = this.resolve(asset.objectKey);
    try {
      const info = await stat(target);
      const body = Readable.toWeb(createReadStream(target, range ? { start: range.start, end: range.end } : undefined)) as ReadableStream<Uint8Array>;
      return {
        body,
        contentLength: range ? range.end - range.start + 1 : info.size,
        etag: `"${createHash('sha1').update(`${info.size}:${info.mtimeMs}`).digest('hex')}"`,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
}

class S3Storage implements StorageDriver {
  private bucket: string;
  private prefix: string;
  private client: S3Client;

  constructor() {
    this.bucket = required('S3_BUCKET');
    this.prefix = (process.env.S3_PREFIX || 'open-canvas').replace(/^\/+|\/+$/g, '');
    this.client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      } : undefined,
    });
  }

  private key(key: string) {
    return `${this.prefix}/${safeRelativeKey(key)}`;
  }

  private async readJson<T>(key: string): Promise<T | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.key(key) }));
      if (!result.Body) return null;
      return JSON.parse(await result.Body.transformToString()) as T;
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw error;
    }
  }

  private async writeJson(key: string, value: unknown) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.key(key),
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json',
    }));
  }

  getSite() {
    return this.readJson<SiteDocument>('documents/home.json');
  }

  putSite(document: SiteDocument) {
    return this.writeJson('documents/home.json', document);
  }

  async putMedia(asset: MediaAsset, body: ReadableStream<Uint8Array>) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.key(asset.objectKey),
      Body: Readable.fromWeb(body as never),
      ContentLength: asset.size,
      ContentType: asset.contentType,
    }));
    await this.writeJson(`media-meta/${asset.id}.json`, asset);
  }

  getMedia(id: string) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) return Promise.resolve(null);
    return this.readJson<MediaAsset>(`media-meta/${id}.json`);
  }

  async readMedia(asset: MediaAsset, range?: ByteSlice): Promise<MediaRead | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.key(asset.objectKey),
        Range: range ? `bytes=${range.start}-${range.end}` : undefined,
      }));
      if (!result.Body) return null;
      return {
        body: result.Body.transformToWebStream() as ReadableStream<Uint8Array>,
        contentLength: result.ContentLength ?? (range ? range.end - range.start + 1 : asset.size),
        etag: result.ETag || `"${asset.id}"`,
      };
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw error;
    }
  }
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required when STORAGE_DRIVER=s3`);
  return value;
}

function isMissingObject(error: unknown) {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate?.name === 'NoSuchKey' || candidate?.name === 'NotFound' || candidate?.$metadata?.httpStatusCode === 404;
}

let singleton: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (!singleton) singleton = process.env.STORAGE_DRIVER === 's3' ? new S3Storage() : new FileStorage();
  return singleton;
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
