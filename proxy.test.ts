import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { proxy } from './proxy.ts';

test('serves a negotiated representation without forwarding visitor credentials', async () => {
  const previousFetch = globalThis.fetch;
  const previousOrigin = process.env.RENDER_ORIGIN;
  process.env.RENDER_ORIGIN = 'https://renderer.test';
  let received: Request | undefined;
  globalThis.fetch = async (input, init) => {
    received = new Request(input, init);
    return new Response('# Published page', { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
  };
  try {
    const response = await proxy(new NextRequest('https://site.test/work?private=1', { headers: { accept: 'text/markdown', authorization: 'Bearer visitor-secret' } }));
    assert.equal(await response.text(), '# Published page');
    assert.equal(response.headers.get('vary'), 'Accept, User-Agent');
    assert.equal(received?.url, 'https://renderer.test/content/work.md');
    assert.equal(received?.headers.get('authorization'), null);
    assert.equal(received?.headers.get('x-crawler-negotiated'), '1');
    assert.equal(received?.headers.get('x-crawler-original-path'), '/work');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) delete process.env.RENDER_ORIGIN;
    else process.env.RENDER_ORIGIN = previousOrigin;
  }
});

test('continues to the original HTML page when representation extraction fails', async () => {
  const previousFetch = globalThis.fetch;
  const previousOrigin = process.env.RENDER_ORIGIN;
  process.env.RENDER_ORIGIN = 'https://renderer.test';
  globalThis.fetch = async () => new Response('Could not render the published page.', { status: 502, headers: { 'content-type': 'text/plain' } });
  try {
    const response = await proxy(new NextRequest('https://site.test/work', { headers: { accept: 'text/markdown' } }));
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('vary'), 'Accept, User-Agent');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) delete process.env.RENDER_ORIGIN;
    else process.env.RENDER_ORIGIN = previousOrigin;
  }
});

test('continues to the original HTML page when the internal content route is unreachable', async () => {
  const previousFetch = globalThis.fetch;
  const previousOrigin = process.env.RENDER_ORIGIN;
  process.env.RENDER_ORIGIN = 'https://renderer.test';
  globalThis.fetch = async () => { throw new TypeError('connection refused'); };
  try {
    const response = await proxy(new NextRequest('https://site.test/', { headers: { 'user-agent': 'GPTBot/1.0' } }));
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('vary'), 'Accept, User-Agent');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) delete process.env.RENDER_ORIGIN;
    else process.env.RENDER_ORIGIN = previousOrigin;
  }
});

test('keeps AI crawler requests on the original HTML page without explicit Markdown negotiation', async () => {
  const previousFetch = globalThis.fetch;
  const previousOrigin = process.env.RENDER_ORIGIN;
  process.env.RENDER_ORIGIN = 'https://renderer.test';
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('AI crawler requests must not be rewritten without an explicit Markdown Accept header');
  };
  try {
    const response = await proxy(new NextRequest('https://site.test/work', { headers: { 'user-agent': 'GPTBot/1.0' } }));
    assert.equal(fetchCalled, false);
    assert.equal(response.headers.get('x-middleware-next'), '1');
    assert.equal(response.headers.get('vary'), 'Accept, User-Agent');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) delete process.env.RENDER_ORIGIN;
    else process.env.RENDER_ORIGIN = previousOrigin;
  }
});
