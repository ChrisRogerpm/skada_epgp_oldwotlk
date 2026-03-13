type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();

/**
 * Obtiene o establece datos en el caché en memoria del servidor.
 * @param key Clave única para la consulta
 * @param fetcher Función que obtiene los datos si no están en caché o han expirado
 * @param ttl Time To Live en milisegundos (por defecto 5 minutos)
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.timestamp < ttl) {
    // console.log(`[Cache] Hit for key: ${key}`);
    return cached.data as T;
  }

  // console.log(`[Cache] Miss for key: ${key}. Fetching fresh data...`);
  const freshData = await fetcher();
  cache.set(key, { data: freshData, timestamp: now });
  return freshData;
}

/**
 * Limpia una entrada específica del caché
 */
export function invalidateCache(key: string) {
  cache.delete(key);
}

/**
 * Limpia todo el caché
 */
export function clearCache() {
  cache.clear();
}
