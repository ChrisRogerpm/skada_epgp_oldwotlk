import { Redis } from '@upstash/redis';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// Fallback in-memory cache
const memoryCache = new Map<string, CacheEntry<any>>();

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn("Could not initialize Redis client, falling back to memory cache.");
}

/**
 * Obtiene o establece datos en el caché.
 * Si Redis está configurado (Upstash), lo usa como caché persistente y distribuida.
 * En caso contrario, usa una caché en memoria (volátil en Vercel).
 * 
 * @param key Clave única para la consulta
 * @param fetcher Función que obtiene los datos si no están en caché
 * @param ttl Time To Live en milisegundos (por defecto 5 minutos)
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const now = Date.now();

  if (redis) {
    try {
      const cached = await redis.get<CacheEntry<T>>(key);
      if (cached && now - cached.timestamp < ttl) {
        return cached.data;
      }
      
      const freshData = await fetcher();
      await redis.set(key, { data: freshData, timestamp: now }, { ex: Math.floor(ttl / 1000) });
      return freshData;
    } catch (err) {
      console.error("Redis error:", err);
      // Fallback a ejecutar la función directamente en caso de fallo de Redis
      return await fetcher();
    }
  }

  // Comportamiento original: Caché en memoria
  const cached = memoryCache.get(key);
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }

  const freshData = await fetcher();
  memoryCache.set(key, { data: freshData, timestamp: now });
  return freshData;
}

/**
 * Limpia una entrada específica del caché
 */
export async function invalidateCache(key: string) {
  if (redis) {
    await redis.del(key);
  }
  memoryCache.delete(key);
}

/**
 * Limpia todo el caché en memoria (y en Redis si aplica)
 */
export async function clearCache() {
  if (redis) {
    await redis.flushdb();
  }
  memoryCache.clear();
}

