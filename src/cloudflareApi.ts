/**
 * cloudflareApi.ts
 * Replaces Firebase Firestore — reads/writes site data via the
 * Cloudflare Worker API (/api/config and /api/licenses).
 *
 * The admin token is the SHA-256 hash of the PIN entered by the admin.
 * Write operations send the token in the X-Admin-Token header.
 */

import type { CompanyProfile, LicenseRecord } from './utils/siteStore';
import { DEFAULT_PROFILE } from './utils/siteStore';

/** Base URL for API — same origin in production, can override for local dev */
const API_BASE = '';

// ── Token management ───────────────────────────────────────────────────────

let _adminToken: string | null = null;

/**
 * Derive an admin token from the PIN by hashing it with SHA-256.
 * Called right after PIN verification succeeds.
 */
export async function deriveAndStoreAdminToken(pin: string): Promise<void> {
  const enc = new TextEncoder().encode(pin);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  const hex = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  _adminToken = hex;
}

export function clearAdminToken(): void {
  _adminToken = null;
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...((_adminToken) ? { 'X-Admin-Token': _adminToken } : {}),
  };
}

// ── Config (profile) ────────────────────────────────────────────────────────

export async function fetchSiteConfig(): Promise<CompanyProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    if (!res.ok) return null;
    return (await res.json()) as CompanyProfile;
  } catch {
    return null;
  }
}

export async function saveSiteConfig(profile: CompanyProfile): Promise<void> {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to save config');
  }
}

// ── Licenses ────────────────────────────────────────────────────────────────

export async function fetchLicenses(): Promise<LicenseRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/api/licenses`);
    if (!res.ok) return [];
    return (await res.json()) as LicenseRecord[];
  } catch {
    return [];
  }
}

export async function upsertLicense(record: LicenseRecord): Promise<void> {
  const res = await fetch(`${API_BASE}/api/licenses`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to save license');
  }
}

export async function deleteLicense(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/licenses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to delete license');
  }
}

export async function uploadLicenseFile(filename: string, dataUrl: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ filename, dataUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Failed to upload file to Cloudflare');
  }
  const data = (await res.json()) as { ok: boolean; url: string };
  return data.url;
}

// ── Live subscription (polling — replaces Firestore onSnapshot) ─────────────

export function subscribeToSiteData(callbacks: {
  onConfig: (profile: CompanyProfile, exists: boolean) => void;
  onLicenses: (licenses: LicenseRecord[], isEmpty: boolean) => void;
}): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;

    // Fetch config
    const cfg = await fetchSiteConfig();
    if (!cancelled) {
      callbacks.onConfig(cfg ?? DEFAULT_PROFILE, cfg !== null);
    }

    // Fetch licenses
    const lics = await fetchLicenses();
    if (!cancelled) {
      callbacks.onLicenses(lics, lics.length === 0);
    }
  };

  // Initial fetch
  void poll();

  // Poll every 30 seconds (admin changes appear quickly enough)
  const timer = setInterval(() => void poll(), 30_000);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
