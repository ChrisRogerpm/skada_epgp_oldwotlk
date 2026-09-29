import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const KNOWN_SCOPES = [
  "skada:write",
  "roster:write",
  "raidcomposition:write",
  "blacklist:write",
  "epgp:write",
  "raid-items:write",
  "rules:read",
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseOptions(values) {
  const options = {};
  for (let index = 0; index < values.length; index += 1) {
    const argument = values[index];
    if (!argument.startsWith("--")) fail(`Argumento inesperado: ${argument}`);
    const key = argument.slice(2);
    const value = values[index + 1];
    if (!value || value.startsWith("--")) fail(`Falta el valor de --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    fail("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeScopes(rawScopes) {
  const scopes = rawScopes
    ? rawScopes
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean)
    : ["*"];
  const invalidScopes = scopes.filter((scope) => scope !== "*" && !KNOWN_SCOPES.includes(scope));
  if (invalidScopes.length > 0) {
    fail(`Scopes desconocidos: ${invalidScopes.join(", ")}`);
  }
  return [...new Set(scopes)];
}

async function createToken(options) {
  if (!options.name)
    fail("Uso: create --name <nombre> [--officer <nombre>] [--scopes <lista>] [--expires <ISO>]");

  const rawToken = `sync_${randomBytes(32).toString("base64url")}`;
  const tokenHash = createHash("sha256").update(rawToken, "utf8").digest("hex");
  const tokenPrefix = rawToken.slice(0, 17);
  const expiresAt = options.expires ? new Date(options.expires) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    fail("--expires debe ser una fecha ISO valida, por ejemplo 2027-12-31T23:59:59Z");
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sync_api_tokens")
    .insert({
      name: options.name.trim(),
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      officer_name: options.officer?.trim() || null,
      scopes: normalizeScopes(options.scopes),
      expires_at: expiresAt?.toISOString() || null,
    })
    .select("id, name, token_prefix, officer_name, scopes, expires_at, created_at")
    .single();

  if (error) fail(`No se pudo crear el token: ${error.message}`);
  console.table([data]);
  console.log("\nTOKEN (se muestra una sola vez):");
  console.log(rawToken);
  console.log("\nGuardalo en el almacen seguro de ScriptSkada; la base solo conserva su hash.");
}

async function listTokens() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sync_api_tokens")
    .select(
      "id, name, token_prefix, officer_name, scopes, expires_at, revoked_at, last_used_at, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) fail(`No se pudieron listar los tokens: ${error.message}`);
  console.table(data);
}

async function revokeToken(options) {
  if (!options.id && !options.prefix) {
    fail("Uso: revoke --id <uuid> o revoke --prefix <prefijo>");
  }
  const supabase = getAdminClient();
  let query = supabase
    .from("sync_api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .select("id, name, token_prefix, revoked_at");
  query = options.id ? query.eq("id", options.id) : query.eq("token_prefix", options.prefix);
  const { data, error } = await query;
  if (error) fail(`No se pudo revocar el token: ${error.message}`);
  if (!data?.length) fail("No se encontro ningun token con ese identificador.");
  console.table(data);
}

const [command, ...rawOptions] = process.argv.slice(2);
const options = parseOptions(rawOptions);

if (command === "create") await createToken(options);
else if (command === "list") await listTokens();
else if (command === "revoke") await revokeToken(options);
else {
  fail(
    "Uso: npm run sync-token -- <create|list|revoke> [opciones]\n" +
      `Scopes disponibles: *, ${KNOWN_SCOPES.join(", ")}`,
  );
}
