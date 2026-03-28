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
