# 🚀 Roadmap de Mejoras - Old Legends Portal

Este documento detalla las mejoras técnicas y de funcionalidades identificadas para optimizar el portal de gestión EPGP y Logs de Raid.

## 🏗️ 1. Arquitectura y Rendimiento
- [x] **Implementar TanStack Query (React Query):** Sustituir los `useEffect` manuales en `useRaidLogs.ts` y otros hooks por una gestión de estado profesional.
    - *Beneficio:* Caché automática, manejo de estados de carga/error nativo y eliminación de "race conditions".
- [x] **Caché Persistente con Redis (Upstash):** Migrar `lib/cache.ts` de memoria local a una solución persistente (híbrido).
    - *Beneficio:* La caché no se borrará cuando las instancias de Vercel se reinicien (requiere credenciales de Upstash).
- [x] **Paginación en API de Logs:** Implementar `limit` y `offset` en las consultas de Supabase en `/api/logs`.
    - *Beneficio:* Mejora la velocidad de carga conforme la base de datos de encuentros crezca.

## 🔒 2. Seguridad y Limpieza
- [x] **Eliminar Firebase:** Se ha removido la configuración de `lib/firebase.ts` y la dependencia del proyecto.
- [x] **Limpieza de Dependencias:** El proyecto ahora utiliza exclusivamente Supabase.
- [x] **Control de Acceso (RBAC):** Se ha implementado verificación de roles en el Panel de Administración consultando la tabla `profiles`. (Se incluye `supabase_rbac_migration.sql` para configurar la BD).

## 🎨 3. Experiencia de Usuario (UX/UI)
- [x] **Visualización de Datos (Gráficos):** Añadir gráficos de barras/líneas para comparar Damage/Healing entre bosses.
    - *Sugerencia:* Usar la librería `Tremor` o `Recharts`.
- [x] **Skeleton Loaders:** Reemplazar el spinner de carga en `LogsTable.tsx` por skeletons que simulen las filas de la tabla.
- [x] **Búsqueda con Debounce:** Implementar un retraso (300ms) en el filtro de búsqueda para evitar filtrados innecesarios en tiempo real.

## 🛠️ 4. Calidad de Código
- [x] **Validación con Zod:** Crear esquemas de validación para las respuestas de las APIs.
    - *Beneficio:* Evita errores en el frontend si los datos de Supabase vienen incompletos o con formatos inesperados.
- [x] **Centralización de Constantes:** Se ha creado `lib/constants.ts` y refactorizado `LogRow.tsx`.
- [x] **Optimización de Imágenes:** Unificar el uso del componente `next/image` en todo el proyecto para mejorar el LCP (Largest Contentful Paint).

## ✨ 5. Nuevas Funcionalidades
- [ ] **Historial EPGP:** Crear una vista detallada por personaje que muestre la evolución de sus puntos (ganancias por raid y gastos en items).
- [x] **Integración con Discord:** Se ha creado `lib/discord.ts` con funciones listas para disparar Webhooks de notificaciones.
- [x] **Exportación a CSV/JSON:** Añadir botones para descargar los datos de las tablas para uso administrativo externo.

---
*Documento generado automáticamente por Gemini CLI.*
