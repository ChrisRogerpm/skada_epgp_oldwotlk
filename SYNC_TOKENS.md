# Tokens individuales para ScriptSkada

La API valida los tokens del sincronizador contra `public.sync_api_tokens`. El
token original nunca se guarda: solamente se persiste su hash SHA-256 y un
prefijo no secreto para identificarlo.

## Despliegue del servidor

1. Ejecutar `supabase_sync_api_tokens_migration.sql` en el SQL Editor de
   Supabase.
2. Renombrar temporalmente la variable de Vercel
   `NEXT_PUBLIC_SYNC_API_KEY` a `SYNC_API_KEY`, conservando su valor. Este es
   solamente el fallback para actualizar los clientes sin interrupciones.
3. Desplegar la aplicación. Esta versión escribe mediante `service_role`.
4. Después de confirmar el despliegue, ejecutar
   `supabase_public_read_rls_migration.sql`. No invertir estos dos pasos: una
   versión antigua del servidor no puede sincronizar con RLS activo.
5. Crear un token por oficial o instalación:

   ```powershell
   npm run sync-token -- create --name "PC de Christian" --officer "Christian"
   ```

   El comando lee `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de
   `.env.local`. El token completo se muestra una sola vez.

6. Configurar cada token en su instalación correspondiente de ScriptSkada.
7. Confirmar el uso con `npm run sync-token -- list` y comprobar
   `last_used_at`.
8. Cuando todas las instalaciones estén migradas, eliminar `SYNC_API_KEY` de
   Vercel y desplegar nuevamente. No debe existir ninguna variable llamada
   `NEXT_PUBLIC_SYNC_API_KEY`.

Para revocar un token:

```powershell
npm run sync-token -- revoke --prefix "sync_abcd12345678"
```

También se puede usar `--id <uuid>`.

## Contrato para ScriptSkada

El formato de las peticiones, los endpoints y las respuestas no cambian. El
cliente debe:

1. Dejar de usar un API key global compilado o compartido.
2. Leer el token individual desde configuración o almacenamiento seguro local.
3. Enviar `Authorization: Bearer <TOKEN_INDIVIDUAL>` en todas las peticiones.
4. Continuar enviando `x-officer-name`. Si el token fue creado con
   `--officer`, el valor debe coincidir, ignorando mayúsculas y minúsculas.
5. Tratar `401` como token inválido, expirado, revocado, con scope insuficiente
   o asignado a otro oficial. No debe reintentar indefinidamente un `401`.
6. Mantener sin cambios `Content-Type`, `Content-Encoding: gzip`, payloads y
   procesamiento de respuestas.

Scopes reconocidos:

| Scope                   | Endpoint                         |
| ----------------------- | -------------------------------- |
| `skada:write`           | `POST /api/skada/sync`           |
| `roster:write`          | `POST /api/epgproster/sync`      |
| `raidcomposition:write` | `POST /api/raidcomposition/sync` |
| `blacklist:write`       | `POST /api/listanegra/sync`      |
| `epgp:write`            | `POST /api/epgp/sync`            |
| `raid-items:write`      | `POST /api/epgp/sync-raid-items` |
| `rules:read`            | `GET /api/epgp/rules`            |
| `*`                     | Todos los anteriores             |

Si no se pasa `--scopes` al crear un token, se asigna `*`. Para limitarlo:

```powershell
npm run sync-token -- create --name "Solo EPGP" --officer "Christian" --scopes "epgp:write,rules:read"
```
