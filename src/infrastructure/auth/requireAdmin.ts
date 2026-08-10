import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/infrastructure/config/supabaseAdmin';
import { getOrSetCache } from '@/src/infrastructure/cache/cache';

type RequireAdminResult = { userId: string; error?: undefined } | { userId?: undefined; error: NextResponse };

class RequireAdminError extends Error {
  constructor(public code: 'CONFIG_MISSING' | 'INVALID_TOKEN' | 'FORBIDDEN') {
    super(code);
  }
}

// auth.getUser(token) + el select a `profiles` son dos round-trips de red a
// Supabase SOLO para confirmar "sigue siendo el mismo admin de hace 30s".
// Se cachea ese resultado un rato corto (keyed por hash del token, nunca el
// token en claro) para que una racha de acciones admin (ej. registrar varios
// ítems de loot seguidos) no repita esa verificación en cada click.
const ADMIN_CHECK_TTL_MS = 30 * 1000;

async function verifyAdmin(token: string): Promise<string> {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    console.error('requireAdmin: cliente admin no configurado:', err);
    throw new RequireAdminError('CONFIG_MISSING');
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    throw new RequireAdminError('INVALID_TOKEN');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    throw new RequireAdminError('FORBIDDEN');
  }

  return userData.user.id;
}

export async function requireAdmin(request: Request): Promise<RequireAdminResult> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }

  const cacheKey = `admin_auth_${createHash('sha256').update(token).digest('hex')}`;

  try {
    const userId = await getOrSetCache(cacheKey, () => verifyAdmin(token), ADMIN_CHECK_TTL_MS);
    return { userId };
  } catch (err) {
    const code = err instanceof RequireAdminError ? err.code : 'INVALID_TOKEN';
    if (code === 'CONFIG_MISSING') {
      return {
        error: NextResponse.json(
          { error: 'Configuración del servidor incompleta: falta SUPABASE_SERVICE_ROLE_KEY' },
          { status: 500 },
        ),
      };
    }
    if (code === 'FORBIDDEN') {
      return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
    }
    return { error: NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 }) };
  }
}
