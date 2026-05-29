import crypto from 'crypto';
import { resolveIconUrl } from './skadaParser';

// =============================================================================
// ROSTER PARSING
// =============================================================================

export function extractRosterBlock(content: string) {
  const marker = '["roster_info"]';
  const startIndex = content.indexOf(marker);
  if (startIndex === -1) return null;

  const eqIndex = content.indexOf("=", startIndex);
  if (eqIndex === -1) return null;

  const openBrace = content.indexOf("{", eqIndex);
  if (openBrace === -1) return null;

  let depth = 0;
  for (let i = openBrace; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return content.slice(openBrace, i + 1);
      }
    }
  }
  return null;
}

export function parseRosterEntries(block: string) {
  const lines = block.split("\n");
  const entries: any[] = [];
  let current: string[] = [];

  for (let raw of lines) {
    let line = raw.trim();
    if (!line || line.startsWith("--")) continue;

    line = line
      .replace(/--\s*\[\d+\]/g, "")
      .replace(/--.*$/, "")
      .trim();
    if (!line) continue;

    const matches = [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    if (matches.length) current.push(...matches);

    if (/^\},?(\s*--.*)?$/.test(line)) {
      if (current.length >= 3) {
        const [name, clase, third] = current.slice(0, 3);
        entries.push({ name, clase, third });
      }
      current = [];
    }
  }

  return entries;
}

export function buildPrincipals(entries: any[]) {
  const principals = new Map();
  const isPrimary = (s: string) => /^-?\d+(?:,-?\d+)?$/.test(s);

  for (const e of entries) {
    if (isPrimary(e.third)) {
      const amount = parseInt(e.third.split(",")[0], 10);
      const icon = resolveIconUrl(e.clase, "Unknown");
      principals.set(e.name, {
        main: e.name,
        class: e.clase,
        amount,
        icon,
        alters: [],
      });
    }
  }

  for (const e of entries) {
    if (!isPrimary(e.third)) {
      const main = principals.get(e.third);
      if (main) {
        main.alters.push({
          name: e.name,
          class: e.clase,
          icon: resolveIconUrl(e.clase, "Unknown"),
        });
      }
    }
  }

  return Array.from(principals.values()).sort((a: any, b: any) => b.amount - a.amount);
}

// =============================================================================
// LOGS PARSING
// =============================================================================


export interface EPGPLogEntry {
  personaje: string;
  descripcion: string;
  valor: number | string;
  EP: number | string;
  fecha: string;
  hour: string;
  raw_timestamp: number;
}

export function formatPeruTime(timestamp: number) {
  const utcDate = new Date(timestamp * 1000);
  // Peru is UTC-5
  const peruDate = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dd = pad(peruDate.getUTCDate());
  const mm = pad(peruDate.getUTCMonth() + 1);
  const yyyy = peruDate.getUTCFullYear();
  const hhNum = peruDate.getUTCHours();
  const hh = pad(hhNum);
  const min = pad(peruDate.getUTCMinutes());
  const ss = pad(peruDate.getUTCSeconds());

  return {
    date: `${dd}/${mm}/${yyyy}`,
    time: `${hh}:${min}:${ss}`,
    isoDate: `${yyyy}-${mm}-${dd}`,
    hour: hhNum,
  };
}

function transforDate(timestamp: number) {
  // Ajuste en HORAS. 
  // Por defecto, formatPeruTime ya convierte un timestamp Unix puro a hora Perú.
  // Si el Addon guardó el tiempo en "Hora del Servidor", necesitamos sumarle o restarle
  // la cantidad "exacta" de horas para que coincida con Perú.
  const AJUSTE_HORAS = -6; 

  const date = new Date(timestamp * 1000);
  date.setHours(date.getHours() + AJUSTE_HORAS); 
  return Math.floor(date.getTime() / 1000);
}

export function extractLuaLogBlock(content: string, parentKey: string, childKey: string) {
  const startProfile = content.indexOf(`["${parentKey}"]`);
  if (startProfile === -1) return null;

  const logIndex = content.indexOf(`["${childKey}"]`, startProfile);
  if (logIndex === -1) return null;

  const eqIndex = content.indexOf("=", logIndex);
  const openBrace = content.indexOf("{", eqIndex);

  let depth = 0;
  let endPos = null;

  for (let i = openBrace; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endPos = i;
        break;
      }
    }
  }

  return endPos ? content.slice(openBrace, endPos + 1) : null;
}

export function parseLogEntries(block: string): EPGPLogEntry[] {
  const lines = block.split("\n");
  const entries: EPGPLogEntry[] = [];
  let current: any[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("--")) continue;

    line = line.replace(/--\s*\[\d+\]/g, "");

    const numberMatch = line.match(/^(-?\d+)/);
    if (numberMatch) {
      current.push(Number(numberMatch[1]));
    } else {
      const strMatch = line.match(/"([^"]*)"/);
      if (strMatch) current.push(strMatch[1]);
    }

    if (line.startsWith("},")) {
      if (current.length >= 5) {
        const [timestamp, epgp, personaje, descripcion, valor] = current;
        const adjustedTs = transforDate(timestamp);
        const { date, time } = formatPeruTime(adjustedTs);

        entries.push({
          personaje,
          descripcion,
          valor,
          EP: epgp,
          fecha: date,
          hour: time,
          raw_timestamp: adjustedTs,
        });
      }
      current = [];
    }
  }

  return entries;
}

export const generateLogId = (e: EPGPLogEntry) => {
  const key = `${e.raw_timestamp}|${e.personaje}|${e.descripcion}|${e.valor}|${e.EP}`;
  return crypto.createHash("md5").update(key).digest("hex");
};
