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
