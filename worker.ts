/**
 * Cloudflare Worker — API backend for abcgulf.com
 * Handles read/write of site config and licenses via KV.
 *
 * Environment bindings (set in wrangler.toml or Cloudflare Dashboard):
 *   SITE_DATA   — KV namespace
 *   ADMIN_TOKEN — secret string for write access (set via: wrangler secret put ADMIN_TOKEN)
 */

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  SITE_DATA?: KVNamespace;
  ADMIN_TOKEN?: string;
  ASSETS: Fetcher;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
};

// SHA-256 hash of default PIN "2030"
const DEFAULT_ADMIN_HASH = '8e1f192fe25ad49be764c3f55c68beb32f7aa66f85344e026b76cfaaa1d3d88a';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function isAdmin(request: Request, env: Env): boolean {
  const token = request.headers.get('X-Admin-Token') ?? '';
  if (!token) return false;
  if (env.ADMIN_TOKEN && token === env.ADMIN_TOKEN) return true;
  return token === DEFAULT_ADMIN_HASH;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── API routes ────────────────────────────────────────────
    if (url.pathname.startsWith('/api/')) {
      // If KV is not yet bound in Cloudflare, provide graceful fallback
      if (!env.SITE_DATA) {
        if (request.method === 'GET') {
          return json(url.pathname === '/api/licenses' ? [] : null);
        }
        return json(
          {
            ok: false,
            error: 'KV_NOT_BOUND',
            message: 'Cloudflare KV namespace (SITE_DATA) is not bound yet.',
          },
          503,
        );
      }

      // GET /api/config
      if (url.pathname === '/api/config' && request.method === 'GET') {
        const val = await env.SITE_DATA.get('config');
        if (!val) return json(null, 404);
        return json(JSON.parse(val));
      }

      // POST /api/config  (admin only)
      if (url.pathname === '/api/config' && request.method === 'POST') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const body = await request.json();
        await env.SITE_DATA.put('config', JSON.stringify(body));
        return json({ ok: true });
      }

      // GET /api/licenses
      if (url.pathname === '/api/licenses' && request.method === 'GET') {
        const val = await env.SITE_DATA.get('licenses');
        if (!val) return json([]);
        return json(JSON.parse(val));
      }

      // POST /api/licenses  (admin only) — upsert single license
      if (url.pathname === '/api/licenses' && request.method === 'POST') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const record = (await request.json()) as { id: string };
        const existing: unknown[] = JSON.parse((await env.SITE_DATA.get('licenses')) ?? '[]');
        const idx = existing.findIndex((l: unknown) => (l as { id: string }).id === record.id);
        if (idx >= 0) {
          existing[idx] = record;
        } else {
          existing.unshift(record);
        }
        await env.SITE_DATA.put('licenses', JSON.stringify(existing));
        return json({ ok: true });
      }

      // DELETE /api/licenses/:id  (admin only)
      const delMatch = url.pathname.match(/^\/api\/licenses\/(.+)$/);
      if (delMatch && request.method === 'DELETE') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const id = decodeURIComponent(delMatch[1]);
        const existing: unknown[] = JSON.parse((await env.SITE_DATA.get('licenses')) ?? '[]');
        const updated = existing.filter((l: unknown) => (l as { id: string }).id !== id);
        await env.SITE_DATA.put('licenses', JSON.stringify(updated));
        return json({ ok: true });
      }

      // GET /api/files/:filename  (serve uploaded license documents)
      const fileMatch = url.pathname.match(/^\/api\/files\/(.+)$/);
      if (fileMatch && request.method === 'GET') {
        const fileKey = decodeURIComponent(fileMatch[1]);
        const fileData = await env.SITE_DATA.get(`file:${fileKey}`);
        if (!fileData) return json({ error: 'File not found' }, 404);

        if (fileData.startsWith('data:')) {
          const commaIdx = fileData.indexOf(',');
          const header = fileData.slice(5, commaIdx);
          const mime = header.split(';')[0] || 'application/pdf';
          const isBase64 = header.includes(';base64');
          const payload = fileData.slice(commaIdx + 1);

          if (isBase64) {
            const binary = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
            return new Response(binary, {
              headers: {
                ...CORS,
                'Content-Type': mime,
                'Content-Disposition': `inline; filename="${fileKey}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            });
          }
          return new Response(decodeURIComponent(payload), {
            headers: {
              ...CORS,
              'Content-Type': mime,
              'Content-Disposition': `inline; filename="${fileKey}"`,
            },
          });
        }

        return new Response(fileData, {
          headers: {
            ...CORS,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${fileKey}"`,
          },
        });
      }

      // POST /api/upload  (admin only - uploads a file to Cloudflare KV)
      if (url.pathname === '/api/upload' && request.method === 'POST') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const body = (await request.json()) as { filename?: string; dataUrl?: string };
        if (!body.filename || !body.dataUrl) {
          return json({ error: 'Missing filename or dataUrl' }, 400);
        }
        const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileId = `${Date.now()}-${safeName}`;
        await env.SITE_DATA.put(`file:${fileId}`, body.dataUrl);
        return json({ ok: true, url: `/api/files/${fileId}`, fileId });
      }

      return json({ error: 'Not found' }, 404);
    }

    // ── Static assets ─────────────────────────────────────────
    const res = await env.ASSETS.fetch(request);
    if (url.pathname.startsWith('/licenses/') || url.pathname.endsWith('.pdf')) {
      const headers = new Headers(res.headers);
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', 'inline');
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }
    return res;
  },
};
