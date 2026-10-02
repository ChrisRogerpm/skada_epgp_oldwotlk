import type { CSSProperties } from "react";

/**
 * Metadatos de clases de WotLK para la UI: nombre en español, color oficial,
 * variantes legibles sobre fondo claro/oscuro e ícono de zamimg.
 */
export type WowClassKey =
  | "DEATHKNIGHT"
  | "DRUID"
  | "HUNTER"
  | "MAGE"
  | "PALADIN"
  | "PRIEST"
  | "ROGUE"
  | "SHAMAN"
  | "WARLOCK"
  | "WARRIOR";

export interface WowClassMeta {
  key: WowClassKey;
  name: string;
  short: string;
  hex: string;
  /** Texto sobre fondo claro (el color oficial no siempre contrasta). */
  light: string;
  /** Texto sobre fondo oscuro. */
  dark: string;
  icon: string;
}

const ICON = "https://wow.zamimg.com/images/wow/icons/large/";

export const WOW_CLASSES: WowClassMeta[] = [
  {
    key: "DEATHKNIGHT",
    name: "Caballero de la Muerte",
    short: "DK",
    hex: "#C41F3B",
    light: "#B01A35",
    dark: "#FF5A73",
    icon: `${ICON}spell_deathknight_classicon.jpg`,
  },
  {
    key: "DRUID",
    name: "Druida",
    short: "Druida",
    hex: "#FF7D0A",
    light: "#C25A00",
    dark: "#FF9A3D",
    icon: `${ICON}classicon_druid.jpg`,
  },
  {
    key: "HUNTER",
    name: "Cazador",
    short: "Cazador",
    hex: "#ABD473",
    light: "#4F7A1F",
    dark: "#ABD473",
    icon: `${ICON}classicon_hunter.jpg`,
  },
  {
    key: "MAGE",
    name: "Mago",
    short: "Mago",
    hex: "#69CCF0",
    light: "#1A7FA6",
    dark: "#69CCF0",
    icon: `${ICON}classicon_mage.jpg`,
  },
  {
    key: "PALADIN",
    name: "Paladín",
    short: "Paladín",
    hex: "#F58CBA",
    light: "#C2397A",
    dark: "#F58CBA",
    icon: `${ICON}classicon_paladin.jpg`,
  },
  {
    key: "PRIEST",
    name: "Sacerdote",
    short: "Sacerdote",
    hex: "#FFFFFF",
    light: "#52525B",
    dark: "#F4F4F5",
    icon: `${ICON}classicon_priest.jpg`,
  },
  {
    key: "ROGUE",
    name: "Pícaro",
    short: "Pícaro",
    hex: "#FFF569",
    light: "#A16207",
    dark: "#FFF569",
    icon: `${ICON}classicon_rogue.jpg`,
  },
  {
    key: "SHAMAN",
    name: "Chamán",
    short: "Chamán",
    hex: "#0070DE",
    light: "#0060BF",
    dark: "#4DA3FF",
    icon: `${ICON}classicon_shaman.jpg`,
  },
  {
    key: "WARLOCK",
    name: "Brujo",
    short: "Brujo",
    hex: "#9482C9",
    light: "#6A55A8",
    dark: "#B3A4E6",
    icon: `${ICON}classicon_warlock.jpg`,
  },
  {
    key: "WARRIOR",
    name: "Guerrero",
    short: "Guerrero",
    hex: "#C79C6E",
    light: "#8A6236",
    dark: "#D9B48A",
    icon: `${ICON}classicon_warrior.jpg`,
  },
];

const BY_KEY = new Map(WOW_CLASSES.map((c) => [c.key, c]));

// Alias en inglés/español que llegan desde el addon, la BD o EPGP.
const ALIASES: Record<string, WowClassKey> = {
  DK: "DEATHKNIGHT",
  CABALLERODELAMUERTE: "DEATHKNIGHT",
  DRUIDA: "DRUID",
  CAZADOR: "HUNTER",
  MAGO: "MAGE",
  SACERDOTE: "PRIEST",
  PICARO: "ROGUE",
  CHAMAN: "SHAMAN",
  BRUJO: "WARLOCK",
  GUERRERO: "WARRIOR",
};

export const UNKNOWN_ICON = `${ICON}inv_misc_questionmark.jpg`;

export function normalizeClass(value: string | null | undefined): WowClassKey | null {
  if (!value) return null;
  const k = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (BY_KEY.has(k as WowClassKey)) return k as WowClassKey;
  return ALIASES[k] ?? null;
}

export function getClassMeta(value: string | null | undefined): WowClassMeta | null {
  const key = normalizeClass(value);
  return key ? BY_KEY.get(key)! : null;
}

/** Variables CSS que consume la utilidad `.text-class` de globals.css. */
export function classStyle(value: string | null | undefined): CSSProperties {
  const meta = getClassMeta(value);
  if (!meta) return {};
  return { "--cls": meta.hex, "--cls-fg": meta.light, "--cls-dark": meta.dark } as CSSProperties;
}

export const ITEM_QUALITY = {
  rare: "#0070DD",
  epic: "#A335EE",
  legendary: "#FF8000",
} as const;

export type ItemQuality = keyof typeof ITEM_QUALITY;

// Ítems legendarios conocidos de WotLK (fragmentos/arma de Agonía de Sombras, Val'anyr).
const LEGENDARY_IDS = new Set([49623, 50274, 46017, 45038]);

export function itemQuality(idItem: number | null | undefined): ItemQuality {
  return idItem && LEGENDARY_IDS.has(idItem) ? "legendary" : "epic";
}

export function itemUrl(idItem: number | null | undefined, name?: string) {
  if (idItem) return `https://wotlk.ultimowow.com/es/?item=${idItem}`;
  return `https://wotlk.ultimowow.com/es/?search=${encodeURIComponent(name ?? "")}`;
}

/** Vuelve a aplicar los tooltips de ultimowow tras renderizar enlaces nuevos. */
export function refreshWowheadLinks(delay = 100) {
  if (typeof window === "undefined") return;
  const power = (window as unknown as { $WowheadPower?: { refreshLinks: () => void } })
    .$WowheadPower;
  if (power) setTimeout(() => power.refreshLinks(), delay);
}

export function formatPoints(n: number) {
  return n.toLocaleString("es-PE");
}

export function formatSigned(n: number) {
  if (n > 0) return `+${formatPoints(n)}`;
  if (n < 0) return `−${formatPoints(Math.abs(n))}`;
  return "0";
}

/** "1.23M" / "45.6K" / "812" (formato del parser de Skada) → número. */
export function parseCompactNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const m = value.trim().match(/^([\d.,]+)\s*([KkMm])?$/);
  if (!m) return Number(value) || 0;
  const n = parseFloat(m[1].replace(",", "."));
  const mult = m[2]?.toUpperCase() === "M" ? 1_000_000 : m[2]?.toUpperCase() === "K" ? 1_000 : 1;
  return n * mult;
}

/** Fecha de hoy en Lima como YYYY-MM-DD. */
export function limaIsoDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isoToDmy(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function dmyToIso(dmy: string) {
  if (!dmy) return "";
  const [d, m, y] = dmy.split("/");
  return `${y}-${m}-${d}`;
}
