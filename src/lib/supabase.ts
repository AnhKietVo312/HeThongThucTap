import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const fetchWithSupabaseTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(15_000);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
};

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment configuration');
}

// Standard Supabase client (frontend / public anon access)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithSupabaseTimeout },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Admin Supabase client with Service Role Key (API routes / server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  global: { fetch: fetchWithSupabaseTimeout },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** Server-side client accessor. The service key must never enter browser bundles. */
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

/**
 * Storage helpers for HUIT Internship Management
 * Bucket 'public-uploads': avatars, news images
 * Bucket 'private-uploads': student CVs, internship final reports
 */
export const BUCKETS = {
  PUBLIC: 'public-uploads',
  PRIVATE: 'private-uploads',
} as const;

export async function uploadPublicFile(
  path: string,
  file: File | Blob | Buffer | Uint8Array,
  contentType?: string
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKETS.PUBLIC)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKETS.PUBLIC)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function uploadPrivateFile(
  path: string,
  file: File | Blob | Buffer | Uint8Array,
  contentType?: string
): Promise<{ path: string } | { error: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKETS.PRIVATE)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { error: error.message };
    }

    return { path: data.path };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export async function getPrivateFileSignedUrl(
  path: string,
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string } | { error: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKETS.PRIVATE)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      return { error: error.message };
    }

    return { signedUrl: data.signedUrl };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to generate signed url' };
  }
}

export function getPublicFileUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKETS.PUBLIC).getPublicUrl(path);
  return data.publicUrl;
}
