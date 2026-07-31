import crypto from 'crypto';
import { resolveIconUrl } from './skadaParser';

// =============================================================================
// ROSTER SYNC PAYLOAD (JSON ya parseado por el cliente)
// =============================================================================

export interface RosterAlterPayload {
  name: string;
  class: string;
}

export interface RosterPrincipalPayload {
  main: string;
  class: string;
  amount: number;
  alters: RosterAlterPayload[];
}

export function buildRosterRecords(payload: RosterPrincipalPayload[]) {
  return payload
    .map((p) => ({
      main: p.main,
      class: p.class,
      amount: p.amount,
      icon: resolveIconUrl(p.class, "Unknown"),
      alters: (p.alters || []).map((a) => ({
        name: a.name,
        class: a.class,
        icon: resolveIconUrl(a.class, "Unknown"),
      })),
    }))
    .sort((a, b) => b.amount - a.amount);
}

// =============================================================================
// LOGS SYNC PAYLOAD (JSON ya parseado por el cliente)
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

export const generateLogId = (e: EPGPLogEntry) => {
  const key = `${e.raw_timestamp}|${e.personaje}|${e.descripcion}|${e.valor}|${e.EP}`;
  return crypto.createHash("md5").update(key).digest("hex");
};
