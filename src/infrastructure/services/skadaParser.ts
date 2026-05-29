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

export const TARGET_BOSSES = [
  "Lord Marrowgar", "Lord Tuétano", "Lady Deathwhisper", "Lady Susurramuerte",
  "Icecrown Gunship Battle", "Batalla aérea en Corona de Hielo", "Batalla Aérea",
  "Deathbringer Saurfang", "Libramorte Colmillosauro", "Festergut", "Panzachancro",
  "Rotface", "Caraputrea", "Professor Putricide", "Profesor Putricidio",
  "Blood Prince Council", "Consejo de Príncipes de Sangre", "Blood-Queen Lana'thel",
  "Reina de Sangre Lana'thel", "Valithria Dreamwalker", "Valithria Caminasueños",
  "Sindragosa", "The Lich King", "El Rey Exánime", "Rey Exánime", "Halion",
  "Halion the Twilight Destroyer", "Halion el Destructor Crepuscular",
  "XT-002 Deconstructor", "Desarmador XA-002", "Yogg-Saron"
];

export const BOSS_TRANSLATIONS: any = {
  "Lord Tuétano": "Lord Marrowgar", "Lady Susurramuerte": "Lady Deathwhisper",
  "Batalla aérea en Corona de Hielo": "Icecrown Gunship Battle", "Batalla Aérea": "Icecrown Gunship Battle",
  "Libramorte Colmillosauro": "Deathbringer Saurfang", Panzachancro: "Festergut", Caraputrea: "Rotface",
  "Profesor Putricidio": "Professor Putricide", "Consejo de Príncipes de Sangre": "Blood Prince Council",
  "Reina de Sangre Lana'thel": "Blood-Queen Lana'thel", "Valithria Caminasueños": "Valithria Dreamwalker",
  "El Rey Exánime": "The Lich King", "Rey Exánime": "The Lich King",
  "Halion the Twilight Destroyer": "Halion", "Halion el Destructor Crepuscular": "Halion",
  "Desarmador XA-002": "XT-002 Deconstructor",
};

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
// PARSER
// ============================================================================

export function parseSkadaText(content: string) {
  const lines = content.split('\n');
  const encounters: any[] = [];
  let depth = 0;
  let currentEncounter: any = null;
  let inActorsPhase = false;
  let actorsDepth = -1;
  let currentActor: any = null;
  let actorDepth = -1;

  for (const line of lines) {
    const prevDepth = depth;
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;

    if (prevDepth === 1 && depth === 2) {
      currentEncounter = { name: "Unknown", mobname: "", endtime: 0, damage: [] };
      inActorsPhase = false;
    }

    if (currentEncounter) {
      let match;
      if (depth === 2) {
        if ((match = line.match(/\["name"\]\s*=\s*"(.*)",/))) currentEncounter.name = match[1];
        else if ((match = line.match(/\["mobname"\]\s*=\s*"(.*)",/))) currentEncounter.mobname = match[1];
        else if ((match = line.match(/\["endtime"\]\s*=\s*([0-9]+),/))) currentEncounter.endtime = parseInt(match[1], 10);
        else if ((match = line.match(/\["(?:difficulty|raid_difficulty|mode|diff)"\]\s*=\s*(?:([0-9]+)|"(.*)"),/))) {
          if (match[1]) currentEncounter.difficulty = parseInt(match[1], 10);
          else if (match[2]) currentEncounter.diffString = match[2];
        }
      }

      if (!inActorsPhase && line.match(/\["actors"\]\s*=\s*\{/)) {
        inActorsPhase = true;
        actorsDepth = depth;
      } else if (inActorsPhase && depth < actorsDepth) {
        inActorsPhase = false;
      }

      if (inActorsPhase) {
        if (prevDepth === actorsDepth && depth === actorsDepth + 1) {
          if ((match = line.match(/\["(.*)"\]\s*=\s*\{/))) {
            currentActor = { name: match[1], class: "UNKNOWN", talent: "Unknown", amount: 0, heal: 0, absorb: 0, time: 0 };
            actorDepth = depth;
          }
        }
        if (currentActor) {
          if (depth === actorDepth) {
            if ((match = line.match(/\["class"\]\s*=\s*"(.*)",/))) currentActor.class = match[1];
            else if ((match = line.match(/\["talent"\]\s*=\s*"(.*)",/))) currentActor.talent = match[1];
            else if ((match = line.match(/\["damage"\]\s*=\s*([0-9]+),/))) currentActor.amount = parseInt(match[1], 10);
            else if ((match = line.match(/\["heal"\]\s*=\s*([0-9]+),/))) currentActor.heal = parseInt(match[1], 10);
            else if ((match = line.match(/\["absorb"\]\s*=\s*([0-9]+),/))) currentActor.absorb = parseInt(match[1], 10);
            else if ((match = line.match(/\["time"\]\s*=\s*([0-9.]+),/))) currentActor.time = parseFloat(match[1]);
          }
          if (depth < actorDepth) {
            if (currentActor.amount > 0 || currentActor.heal + currentActor.absorb > 0) {
              currentEncounter.damage.push({ ...currentActor });
            }
            currentActor = null;
            actorDepth = -1;
          }
        }
      }
    }

    if (prevDepth === 2 && depth === 1 && currentEncounter) {
      const validParticipants = currentEncounter.damage.filter((a: any) => !EXCLUDED_CLASSES.has(a.class));
      if (validParticipants.length > 0) {
        const damageList = validParticipants
          .filter((a: any) => a.amount > 0)
          .sort((a: any, b: any) => b.amount - a.amount)
          .map((actor: any, index: number) => {
            const talent = resolveTalentBranch(actor.class, actor.talent);
            const dps = actor.time > 0 ? actor.amount / actor.time : 0;
            return {
              Rank: index + 1, Character: actor.name, Class: actor.class,
              Talent: talent, Icon: resolveIconUrl(actor.class, talent),
              Amount: formatNumber(actor.amount), DPS: formatNumber(dps),
            };
          });

        const healingList = validParticipants
          .map((actor: any) => ({ ...actor, totalHealing: actor.heal + actor.absorb }))
          .filter((a: any) => a.totalHealing > 0)
          .sort((a: any, b: any) => b.totalHealing - a.totalHealing)
          .slice(0, 4)
          .map((actor: any, index: number) => {
            const talent = resolveTalentBranch(actor.class, actor.talent);
            return {
              Rank: index + 1, Character: actor.name, Class: actor.class,
              Talent: talent, Icon: resolveIconUrl(actor.class, talent),
              Amount: formatNumber(actor.totalHealing),
            };
          });

        let bossName = currentEncounter.mobname || currentEncounter.name;
        if (BOSS_TRANSLATIONS[bossName]) bossName = BOSS_TRANSLATIONS[bossName];

        const peruTime = formatPeruTime(currentEncounter.endtime);

        encounters.push({
          name: bossName,
          date: peruTime.isoDate,
          endtime: currentEncounter.endtime,
          peruHour: peruTime.hour,
          difficulty: currentEncounter.difficulty,
          diffString: currentEncounter.diffString,
          Damage: damageList,
          Healing: healingList,
        });
      }
      currentEncounter = null;
    }
  }

  const relevant = encounters
    .filter((e) => {
      if (!TARGET_BOSSES.includes(e.name)) return false;
      const isUlduarBoss = ["XT-002 Deconstructor", "Desarmador XA-002", "Yogg-Saron"].includes(e.name);
      const is25H = e.difficulty === 4 || e.diffString === "25h";
      const is25N = e.difficulty === 2 || e.diffString === "25n" || e.diffString === "25" || e.diffString === "25 Player" || e.diffString === "25 Jugadores";
      const isValidDifficulty = isUlduarBoss ? (is25H || is25N) : is25H;
      if (!isValidDifficulty) return false;
      if (e.peruHour < 19) return false;
      return true;
    })
    .sort((a, b) => a.endtime - b.endtime);

  const bossGroups = new Map();
  for (const enc of relevant) {
    if (!bossGroups.has(enc.name)) bossGroups.set(enc.name, []);
    bossGroups.get(enc.name).push(enc);
  }

  const results = [];
  for (const [name, encs] of bossGroups) {
    if (name === "The Lich King" && encs.length > 1) {
      results.push(encs[encs.length - 2]);
    } else {
      results.push(encs[encs.length - 1]);
    }
  }
  return results;
}

export function generateSkadaEncounterId(item: any) {
  const key = `${item.date}|${item.name}|${item.difficulty || 0}`;
  return crypto.createHash("md5").update(key).digest("hex");
}
