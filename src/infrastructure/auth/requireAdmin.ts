import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/infrastructure/config/supabaseAdmin';

type RequireAdminResult = { userId: string; error?: undefined } | { userId?: undefined; error: NextResponse };

export async function requireAdmin(request: Request): Promise<RequireAdminResult> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    console.error('requireAdmin: cliente admin no configurado:', err);
    return {
      error: NextResponse.json(
        { error: 'Configuración del servidor incompleta: falta SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 },
      ),
    };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return { error: NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) };
  }

  return { userId: userData.user.id };
}
