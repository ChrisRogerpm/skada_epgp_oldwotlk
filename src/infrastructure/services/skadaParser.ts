import crypto from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

export const ICON_BASE_URL = "https://wow.zamimg.com/images/wow/icons/large/";

export const CLASS_ICONS: any = {
  "Death Knight": {
    icon: "spell_deathknight_classicon",
    specs: { Blood: "spell_deathknight_bloodpresence", Frost: "spell_deathknight_frostpresence", Unholy: "spell_deathknight_unholypresence" },
  },
  Druid: {
    icon: "classicon_druid",
    specs: { Balance: "spell_nature_starfall", Feral: "ability_racial_bearform", Restoration: "spell_nature_healingtouch" },
  },
  Hunter: {
    icon: "classicon_hunter",
    specs: { "Beast Mastery": "ability_hunter_beasttaming", Marksmanship: "ability_hunter_focusedaim", Survival: "ability_hunter_swiftstrike" },
  },
  Mage: {
    icon: "classicon_mage",
    specs: { Arcane: "spell_holy_magicalsentry", Fire: "spell_fire_firebolt02", Frost: "spell_frost_frostbolt02" },
  },
  Paladin: {
    icon: "classicon_paladin",
    specs: { Holy: "spell_holy_holybolt", Protection: "spell_holy_devotionaura", Retribution: "spell_holy_auraoflight" },
  },
  Priest: {
    icon: "classicon_priest",
    specs: { Discipline: "spell_holy_wordfortitude", Holy: "spell_holy_guardianspirit", Shadow: "spell_shadow_shadowwordpain" },
  },
  Rogue: {
    icon: "classicon_rogue",
    specs: { Assassination: "ability_rogue_eviscerate", Combat: "ability_backstab", Subtlety: "ability_stealth" },
  },
  Shaman: {
    icon: "classicon_shaman",
    specs: { Elemental: "spell_nature_lightning", Enhancement: "spell_nature_lightningshield", Restoration: "spell_nature_magicimmunity" },
  },
  Warlock: {
    icon: "classicon_warlock",
    specs: { Affliction: "spell_shadow_deathcoil", Demonology: "spell_shadow_metamorphosis", Destruction: "spell_shadow_rainoffire" },
  },
  Warrior: {
    icon: "classicon_warrior",
    specs: { Arms: "ability_warrior_savageblow", Fury: "ability_warrior_innerrage", Protection: "ability_warrior_defensivestance" },
  },
};

export const CLASS_NAME_MAP: any = {
  DEATHKNIGHT: "Death Knight", DRUID: "Druid", HUNTER: "Hunter",
  MAGE: "Mage", PALADIN: "Paladin", PRIEST: "Priest", ROGUE: "Rogue",
  SHAMAN: "Shaman", WARLOCK: "Warlock", WARRIOR: "Warrior",
};

export const TALENT_TREES: any = {
  DEATHKNIGHT: ["Blood", "Frost", "Unholy"], DRUID: ["Balance", "Feral Combat", "Restoration"],
  HUNTER: ["Beast Mastery", "Marksmanship", "Survival"], MAGE: ["Arcane", "Fire", "Frost"],
  PALADIN: ["Holy", "Protection", "Retribution"], PRIEST: ["Discipline", "Holy", "Shadow"],
  ROGUE: ["Assassination", "Combat", "Subtlety"], SHAMAN: ["Elemental", "Enhancement", "Restoration"],
  WARLOCK: ["Affliction", "Demonology", "Destruction"], WARRIOR: ["Arms", "Fury", "Protection"],
};

export const EXCLUDED_CLASSES = new Set(["BOSS", "MONSTER"]);

// ============================================================================
// HELPERS
// ============================================================================

export function resolveTalentBranch(className: string, talentString: string) {
  if (!talentString || talentString === "Unknown") return "Unknown";
  const parts = talentString.split("/").map(Number);
  if (parts.length !== 3) return talentString;
  const maxPoints = Math.max(...parts);
  const dominantIndex = parts.indexOf(maxPoints);
  const branches = TALENT_TREES[className];
  return branches?.[dominantIndex] ?? talentString;
}

export function resolveIconUrl(luaClassName: string, talentBranch: string) {
  const readableClass = CLASS_NAME_MAP[luaClassName] ?? luaClassName;
  let specKey = talentBranch;
  if (talentBranch === "Feral Combat") specKey = "Feral";

  const classData = CLASS_ICONS[readableClass] || CLASS_ICONS[luaClassName];
  if (!classData) return null;

  const iconName = classData.specs?.[specKey] ?? classData.icon;
  return `${ICON_BASE_URL}${iconName}.jpg`;
}

export function formatNumber(num: number) {
  if (num >= 1_000_000) return `${+(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${+(num / 1_000).toFixed(2)}K`;
  return `${+num.toFixed(2)}`;
}

export function formatPeruTime(timestamp: number) {
  const utcDate = new Date(timestamp * 1000);
  const peruDate = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dd = pad(peruDate.getUTCDate());
  const mm = pad(peruDate.getUTCMonth() + 1);
  const yyyy = peruDate.getUTCFullYear();
  const hhNum = peruDate.getUTCHours();
  
  return {
    date: `${dd}/${mm}/${yyyy}`,
    isoDate: `${yyyy}-${mm}-${dd}`,
    hour: hhNum,
  };
}

// ============================================================================
// SYNC PAYLOAD (JSON ya parseado por el cliente)
// ============================================================================

export interface SkadaParticipantPayload {
  character: string;
  class: string;
  talent: string;
  damage: number;
  healing: number;
  time: number;
}

export interface SkadaEncounterPayload {
  name: string;
  date: string;
  endtime: number;
  peruHour: number;
  difficulty?: number;
  diffString?: string;
  participants: SkadaParticipantPayload[];
}

export function buildSkadaEncounterRecord(encounter: SkadaEncounterPayload) {
  const validParticipants = (encounter.participants || []).filter(
    (p) => !EXCLUDED_CLASSES.has(p.class),
  );

  const damageList = validParticipants
    .filter((p) => p.damage > 0)
    .sort((a, b) => b.damage - a.damage)
    .map((p, index) => {
      const talent = resolveTalentBranch(p.class, p.talent);
      const dps = p.time > 0 ? p.damage / p.time : 0;
      return {
        Rank: index + 1,
        Character: p.character,
        Class: p.class,
        Talent: talent,
        Icon: resolveIconUrl(p.class, talent),
        Amount: formatNumber(p.damage),
        DPS: formatNumber(dps),
      };
    });

  const healingList = validParticipants
    .filter((p) => p.healing > 0)
    .sort((a, b) => b.healing - a.healing)
    .slice(0, 4)
    .map((p, index) => {
      const talent = resolveTalentBranch(p.class, p.talent);
      return {
        Rank: index + 1,
        Character: p.character,
        Class: p.class,
        Talent: talent,
        Icon: resolveIconUrl(p.class, talent),
        Amount: formatNumber(p.healing),
      };
    });

  return {
    name: encounter.name,
    date: encounter.date,
    endtime: encounter.endtime,
    peruHour: encounter.peruHour,
    difficulty: encounter.difficulty,
    diffString: encounter.diffString,
    Damage: damageList,
    Healing: healingList,
  };
}

export function generateSkadaEncounterId(item: any) {
  const key = `${item.date}|${item.name}|${item.difficulty || 0}|${item.endtime}`;
  return crypto.createHash("md5").update(key).digest("hex");
}
