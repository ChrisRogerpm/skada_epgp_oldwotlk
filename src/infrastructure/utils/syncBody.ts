import { gunzipSync } from "zlib";

/**
 * Reads a sync request body, transparently gunzipping it when the client
 * sends `Content-Encoding: gzip`, and parses it as JSON.
 * Returns null for an empty body.
 */
export async function readSyncPayload<T = any>(request: Request): Promise<T | null> {
  const raw = Buffer.from(await request.arrayBuffer());
  if (raw.length === 0) return null;

  const isGzip = request.headers.get("content-encoding") === "gzip";
  const jsonText = isGzip ? gunzipSync(raw).toString("utf-8") : raw.toString("utf-8");
  if (!jsonText || jsonText.trim() === "") return null;

  return JSON.parse(jsonText) as T;
}
