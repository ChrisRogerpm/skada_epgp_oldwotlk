/**
 * Colores representativos de las clases de World of Warcraft
 * Mantenidos para una visualización consistente en todo el portal.
 */
export const CLASS_COLORS: Record<string, string> = {
  WARRIOR: "bg-[#C79C6E] text-white",
  PALADIN: "bg-[#F58CBA] text-white",
  HUNTER: "bg-[#ABD473] text-black",
  ROGUE: "bg-[#FFF569] text-black",
  PRIEST: "bg-[#FFFFFF] text-black",
  DEATHKNIGHT: "bg-[#C41F3B] text-white",
  SHAMAN: "bg-[#0070DE] text-white",
  MAGE: "bg-[#69CCF0] text-black",
  WARLOCK: "bg-[#9482C9] text-white",
  MONK: "bg-[#00FF96] text-black",
  DRUID: "bg-[#FF7D0A] text-white",
  DEMONHUNTER: "bg-[#A330C9] text-white",
};

/**
 * Colores Hexadecimales de las clases
 */
export const CLASS_HEX: Record<string, string> = {
  WARRIOR: "#C79C6E",
  PALADIN: "#F58CBA",
  HUNTER: "#ABD473",
  ROGUE: "#FFF569",
  PRIEST: "#FFFFFF",
  DEATHKNIGHT: "#C41F3B",
  SHAMAN: "#0070DE",
  MAGE: "#69CCF0",
  WARLOCK: "#9482C9",
  DRUID: "#FF7D0A",
};

/**
 * Iconos de clases (URLs de Wowhead/Blizzard)
 */
export const CLASS_ICONS: Record<string, string> = {
  WARRIOR: "https://wow.zamimg.com/images/wow/icons/small/classicon_warrior.jpg",
  PALADIN: "https://wow.zamimg.com/images/wow/icons/small/classicon_paladin.jpg",
  HUNTER: "https://wow.zamimg.com/images/wow/icons/small/classicon_hunter.jpg",
  ROGUE: "https://wow.zamimg.com/images/wow/icons/small/classicon_rogue.jpg",
  PRIEST: "https://wow.zamimg.com/images/wow/icons/small/classicon_priest.jpg",
  DEATHKNIGHT: "https://wow.zamimg.com/images/wow/icons/small/classicon_deathknight.jpg",
  SHAMAN: "https://wow.zamimg.com/images/wow/icons/small/classicon_shaman.jpg",
  MAGE: "https://wow.zamimg.com/images/wow/icons/small/classicon_mage.jpg",
  WARLOCK: "https://wow.zamimg.com/images/wow/icons/small/classicon_warlock.jpg",
  DRUID: "https://wow.zamimg.com/images/wow/icons/small/classicon_druid.jpg",
};

/**
 * URLs de iconos por defecto
 */
export const DEFAULT_ICONS = {
  UNKNOWN: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
  BONUS: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
  PENALTY: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
};

/**
 * Configuración de la hermandad
 */
export const GUILD_CONFIG = {
  NAME: "Old Legends",
  DEFAULT_RAID: "Icecrown Citadel",
};

/**
 * Marcas de Icecrown Citadel (52028/52029/52030): el addon/EPGP las registra
 * todas bajo un mismo id genérico ("Marca de santificación"), pero en el
 * juego son 3 variantes distintas según el tipo de armadura de la clase que
 * las gana. Acá se deriva el nombre real a partir de la clase del ganador.
 */
export const ICC_MARCA_TYPES_BY_CLASS: Record<string, { id_item: number; name: string }> = {
  PALADIN: { id_item: 52030, name: "Marca de conquistador" },
  PRIEST: { id_item: 52030, name: "Marca de conquistador" },
  WARLOCK: { id_item: 52030, name: "Marca de conquistador" },

  ROGUE: { id_item: 52028, name: "Marca de vencedor" },
  DEATHKNIGHT: { id_item: 52028, name: "Marca de vencedor" },
  MAGE: { id_item: 52028, name: "Marca de vencedor" },
  DRUID: { id_item: 52028, name: "Marca de vencedor" },

  SHAMAN: { id_item: 52029, name: "Marca de protector" },
  WARRIOR: { id_item: 52029, name: "Marca de protector" },
  HUNTER: { id_item: 52029, name: "Marca de protector" },
};

export const ICC_MARCA_ITEM_IDS = new Set(
  Object.values(ICC_MARCA_TYPES_BY_CLASS).map((m) => m.id_item),
);

/**
 * Si el ítem es raid ICC y es una de las 3 Marcas, devuelve la variante real
 * (id_item + nombre) según la clase del ganador. `null` para cualquier otro
 * caso (no es Marca, no es ICC, o la clase no matchea ninguna variante).
 */
export function resolveMarcaType(
  raid: string | null | undefined,
  idItem: number,
  className: string | null | undefined,
): { id_item: number; name: string } | null {
  if (raid !== "ICC" || !ICC_MARCA_ITEM_IDS.has(idItem)) return null;
  return ICC_MARCA_TYPES_BY_CLASS[(className || "").toUpperCase()] ?? null;
}

/**
 * Devuelve el nombre a mostrar para un ítem: resuelto por clase si es una
 * Marca de ICC, o el nombre tal cual viene del catálogo en cualquier otro caso.
 */
export function resolveItemDisplayName(
  raid: string | null | undefined,
  idItem: number,
  className: string | null | undefined,
  fallbackName: string,
): string {
  return resolveMarcaType(raid, idItem, className)?.name ?? fallbackName;
}

/**
 * Devuelve el id_item real a usar en el link/tooltip de wowhead: resuelto
 * por clase si es una Marca de ICC, o el id_item tal cual en cualquier otro
 * caso. Así el hover muestra el tooltip del ítem correcto (Conquistador /
 * Vencedor / Protector) en vez de siempre el mismo (52029).
 */
export function resolveWowheadItemId(
  raid: string | null | undefined,
  idItem: number,
  className: string | null | undefined,
): number {
  return resolveMarcaType(raid, idItem, className)?.id_item ?? idItem;
}
