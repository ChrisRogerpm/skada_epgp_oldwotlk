"use client";

import { supabase } from "@/src/infrastructure/config/supabase";

/** fetch con el token de la sesión de Supabase (las rutas de admin lo exigen). */
export async function authedFetch(url: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
  });
}

/** authedFetch + JSON; lanza el `error` que devuelva la API. */
export async function adminJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await authedFetch(url, {
    ...init,
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data as T;
}
