"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Renderiza `children` solo en el cliente. Las vistas que leen la URL con
 * useSearchParams hidratan tarde (dentro de Suspense) y para entonces React
 * Query puede tener datos que el HTML del servidor no tenía; así se evita el
 * desajuste de hidratación.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? children : fallback;
}
