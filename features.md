# Cambios necesarios en el API de Vercel

El cliente de escritorio (ScriptSkada) cambió su forma de enviar datos a los 5 endpoints de sync. Este documento describe exactamente qué cambió, para que puedas actualizar el lado servidor (tu repo de Next.js en Vercel) sin tener que leer el código del cliente.

## Por qué

Antes, el cliente mandaba el archivo `.lua` completo (o un bloque extraído) como texto plano. Algunos de esos archivos (`SkadaStorage.lua`) pesan 10-50MB, lo que arriesgaba pegar contra los límites de tamaño de body de las funciones serverless de Vercel y hacía el sync lento.

Ahora el cliente **parsea y filtra los datos localmente** (solo jefes objetivo, dificultad correcta, después de las 19:00 hora Perú) y manda un **JSON compacto comprimido con gzip**. El resultado: payloads de pocos KB en vez de decenas de MB.

## Qué cambió en cada request

Para los 5 endpoints, el request HTTP cambia así:

| | Antes | Ahora |
|---|---|---|
| `Content-Type` | `text/plain` | `application/json` |
| `Content-Encoding` | (no se enviaba) | `gzip` |
| Body | Texto crudo del `.lua` (o bloque extraído) | JSON gzipeado (bytes binarios, no texto) |
| `Authorization` | `Bearer <SYNC_API_KEY>` | Sin cambios |
| `x-officer-name` | Nombre del personaje/cuenta | Sin cambios |

Todo lo demás (URL base, autenticación, headers de identificación) sigue igual. Si un archivo no tiene datos relevantes que enviar, el cliente **no hace el request** (no vas a recibir arrays vacíos).

## Cómo leer el body en el servidor

El body ya no es JSON en texto plano — son bytes gzip que hay que descomprimir antes de parsear. El punto exacto depende de si usas App Router o Pages Router en Next.js:

### App Router (`app/api/.../route.ts`)

```ts
import { gunzipSync } from "zlib";

export async function POST(req: Request) {
  const raw = Buffer.from(await req.arrayBuffer());
  const isGzip = req.headers.get("content-encoding") === "gzip";
  const jsonText = isGzip ? gunzipSync(raw).toString("utf-8") : raw.toString("utf-8");
  const payload = JSON.parse(jsonText);

  const officer = req.headers.get("x-officer-name");
  // ... validar Authorization, procesar payload ...
}
```

### Pages Router (`pages/api/.../*.ts`)

Hay que desactivar el `bodyParser` automático (asume JSON de texto plano) y leer el stream crudo:

```ts
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);

  const isGzip = req.headers["content-encoding"] === "gzip";
  const jsonText = isGzip ? zlib.gunzipSync(raw).toString("utf-8") : raw.toString("utf-8");
  const payload = JSON.parse(jsonText);

  const officer = req.headers["x-officer-name"];
  // ... validar Authorization, procesar payload ...
}
```

Usa el que corresponda a tu proyecto (probablemente uno solo).

## Respuesta esperada

El cliente sigue esperando lo mismo que antes — no hace falta cambiar nada acá:

```json
{
  "message": "Sync successful",
  "uploaded": 12,
  "inserted": 12,
  "deleted": 0
}
```

Si algo falla, respondé con status != 2xx y (opcionalmente) `{ "error": "mensaje" }` — el cliente lo muestra en consola.

## Forma del JSON por endpoint

Antes el `.lua`/bloque crudo lo parseabas en el servidor. Ahora ese parseo ya lo hizo el cliente — el servidor solo necesita leer estos campos y escribirlos a la base de datos (probablemente reemplazando la lógica de parseo de Lua que tengas hoy por un simple mapeo de estos objetos a tus tablas).

### `POST /api/skada/sync` — encuentros de Skada

Body: array de encuentros.

```ts
interface SkadaEncounter {
  name: string;          // nombre del jefe, ya normalizado a inglés
  date: string;           // "YYYY-MM-DD", hora Perú
  endtime: number;        // timestamp Unix (segundos) del fin del encuentro
  peruHour: number;       // hora del día (0-23) en que terminó, hora Perú
  difficulty?: number;    // código de dificultad del addon (puede venir undefined)
  diffString?: string;    // string de dificultad alternativo (puede venir undefined)
  participants: SkadaParticipant[];
}

interface SkadaParticipant {
  character: string;
  class: string;   // ej. "MAGE", "DEATHKNIGHT" (nombre interno del addon, no traducido)
  talent: string;  // string crudo de distribución de talentos, ej. "51/5/15"
  damage: number;
  healing: number; // heal + absorb ya sumados
  time: number;    // segundos activo en el encuentro
}
```

Nota: ya **no** vienen íconos, nombre de rama de talento resuelto ("Frost", "Fire", etc.) ni números formateados ("1.2M") — eso ahora es responsabilidad del servidor/frontend, calculado a partir de `class`/`talent`/`damage` crudos.

#### Cobertura de jefes (`name`)

El cliente filtra y normaliza el `name` a su versión canónica en inglés antes de enviarlo (soporta clientes de WoW en inglés, español de España y español latinoamericano — todos llegan normalizados al mismo string en inglés). El contrato del JSON no cambió, pero la lista de jefes que ahora puede llegar creció para cubrir ICC + RS + ToC + Ulduar completos:

- **ICC** (sin cambios): Lord Marrowgar, Lady Deathwhisper, Icecrown Gunship Battle, Deathbringer Saurfang, Festergut, Rotface, Professor Putricide, Blood Prince Council, Blood-Queen Lana'thel, Valithria Dreamwalker, Sindragosa, The Lich King.
- **Ruby Sanctum** (nuevo: los 3 jefes de trash): Saviana Ragefire, General Zarithrian, Baltharus the Warborn, Halion.
- **Trial of the Crusader** (nuevo, raid completa): The Northrend Beasts, Lord Jaraxxus, Faction Champions, Twin Val'kyr, Anub'arak.
- **Ulduar** (nuevo, raid completa): Flame Leviathan, Ignis the Furnace Master, Razorscale, Steelbreaker, Runemaster Molgeim, Stormcaller Brundir, XT-002 Deconstructor, Kologarn, Auriaya, Hodir, Thorim, Freya, Mimiron, General Vezax, Yogg-Saron, Algalon the Observer.

**Importante:** si tu backend tiene en algún lado una lista/enum/tabla de jefes "válidos" (constraint de base de datos, tabla de referencia con íconos o loot, o el frontend que solo sabe renderizar ciertos jefes), hay que agregar estos jefes nuevos ahí también — si no, van a llegar como texto libre pero no van a mostrarse/procesarse del todo bien hasta que los des de alta.

### `POST /api/raidcomposition/sync` — composición de raid

Cobertura de jefes: a diferencia de `/api/skada/sync`, este endpoint sigue limitado a un subconjunto reducido de jefes "hito" (no toda ICC/RS/ToC/Ulduar): Deathbringer Saurfang, Festergut, Professor Putricide, XT-002 Deconstructor, Yogg-Saron, Halion, The Lich King y (nuevo) **Anub'arak** (ToC). Es una decisión intencional del cliente, no una limitación del API.

Body: array de encuentros.

```ts
interface RaidCompositionEncounter {
  name: string;         // nombre del jefe normalizado
  endtime: number;      // timestamp Unix
  endtimeReal: string;  // "HH:MM:SS" hora Perú
  peruDate: string;     // "YYYY-MM-DD"
  peruTime: string;     // "HH:MM:SS" (igual a endtimeReal)
  actors: RaidActor[];
}

interface RaidActor {
  name: string;
  class: string;
  group: number; // subgrupo de raid (1-8), o -1 si no se pudo determinar
}
```

### `POST /api/epgproster/sync` — roster de EPGP

Body: array de personajes principales con sus alts.

```ts
interface RosterPrincipal {
  main: string;       // nombre del personaje principal
  class: string;
  amount: number;     // prioridad/EPGP del roster
  alters: RosterAlter[];
}

interface RosterAlter {
  name: string;
  class: string;
}
```

### `POST /api/epgp/sync` — logs de EPGP

Body: array de entradas de log. **Ya viene filtrado** a los últimos `LOGS_TIME_LIMIT_MONTHS` (12 meses por defecto) — no asumas que es el historial completo.

```ts
interface EPGPLogEntry {
  personaje: string;
  descripcion: string;
  valor: number;
  EP: number;
  fecha: string;          // "DD/MM/YYYY"
  hour: string;           // "HH:MM:SS"
  raw_timestamp: number;  // timestamp Unix ya ajustado a hora Perú
}
```

### `POST /api/listanegra/sync` — lista negra (IgnoreMore)

Body: array de jugadores ignorados.

```ts
interface IgnoreEntry {
  name: string;
  reason: string | null;
}
```

## Checklist para actualizar cada endpoint

1. Cambiar el parsing del body: gunzip + `JSON.parse` en vez de recibir texto plano (ver snippets arriba).
2. Reemplazar la lógica que parseaba el `.lua`/bloque Lua por un mapeo directo de los campos del JSON de arriba a tus tablas/inserts.
3. Mantener la respuesta `{ uploaded, inserted, deleted, message }` igual que antes.
4. Probar con un payload real: podés generar uno corriendo `npm start` en ScriptSkada contra tus archivos de WoW — vas a ver en consola el tamaño de cada payload (`📦 [personaje] Payload: X KB → gzip: Y KB`) antes de que se envíe.

## Referencia de tipos

Los tipos exactos están en [`src/types.ts`](../src/types.ts) del repo de ScriptSkada si necesitás copiarlos literal (por ejemplo para generar tipos TS del lado servidor también).
