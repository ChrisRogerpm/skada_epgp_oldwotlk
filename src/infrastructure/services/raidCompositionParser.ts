import { formatPeruTime } from './skadaParser'; // Reusing formatPeruTime

const BOSS_MAPPING: any = {
  "The Lich King": "The Lich King",
  "El Rey Exánime": "The Lich King",
  "Rey Exánime": "The Lich King",
  "Halion": "Halion",
  "Halion the Twilight Destroyer": "Halion",
  "Halion el Destructor Crepuscular": "Halion",
  "Deathbringer Saurfang": "Deathbringer Saurfang",
  "Libramorte Colmillosauro": "Deathbringer Saurfang",
  "Festergut": "Festergut",
  "Panzachancro": "Festergut",
  "Professor Putricide": "Professor Putricide",
  "Profesor Putricidio": "Professor Putricide",
  "XT-002 Deconstructor": "XT-002 Deconstructor",
  "Desarmador XA-002": "XT-002 Deconstructor",
  "Yogg-Saron": "Yogg-Saron",
};

export function normalizeBossName(name: string) {
  if (!name) return name;
  const cleanName = name.replace(/\s+\(\d+\)$/, "").trim();
  for (const [key, value] of Object.entries(BOSS_MAPPING)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return value as string;
    }
  }
  return cleanName;
}

const TARGET_BOSSES = Object.keys(BOSS_MAPPING);

export function parseRaidCompositionText(content: string, fileOwner?: string) {
  const encounters: any[] = [];
  const blocks = content.split(/\n\t\{/);

  for (const block of blocks) {
    const nameMatch = block.match(/\["name"\]\s*=\s*"(.*)"/);
    const startMatch = block.match(/\["endtime"\]\s*=\s*([0-9]+)/);
    const diffMatch = block.match(/\["(?:difficulty|raid_difficulty|mode|diff)"\]\s*=\s*(?:([0-9]+)|"(.*)")/);

    if (!nameMatch || !startMatch) continue;

    const name = nameMatch[1];
    const endtime = parseInt(startMatch[1], 10);
    let difficulty = 0;
    let diffString = "";

    if (diffMatch) {
      if (diffMatch[1]) difficulty = parseInt(diffMatch[1], 10);
      else if (diffMatch[2]) diffString = diffMatch[2];
    }

    const actors = [];
    const actorsSectionMatch = block.match(/\["actors"\]\s*=\s*\{([\s\S]*?)\n\t\t\}/);
    if (actorsSectionMatch) {
      const actorsContent = actorsSectionMatch[1];
      const actorRegex = /\["([^"]+)"\]\s*=\s*\{([\s\S]*?)\n\t\t\t\}/g;
      let actorMatch;
      while ((actorMatch = actorRegex.exec(actorsContent)) !== null) {
        const actorName = actorMatch[1];
        const actorData = actorMatch[2];

        const classM = actorData.match(/\["class"\]\s*=\s*"(.*)"/);
        const groupM = actorData.match(/\["subgroup"\]\s*=\s*([0-9]+)/);

        const isOwner = fileOwner && actorName.toLowerCase() === fileOwner.toLowerCase();

        if (classM && (groupM || isOwner)) {
          actors.push({
            name: actorName,
            class: classM[1],
            group: groupM ? parseInt(groupM[1], 10) : -1,
          });
        }
      }
    }

    const isTargetBoss = TARGET_BOSSES.some((b) => name.includes(b));
    const isUlduarBoss = ["XT-002 Deconstructor", "Desarmador XA-002", "Yogg-Saron"].some((b) => name.includes(b));
    
    const is25H = difficulty === 4 || diffString === "25h" || diffString === "25 Heroic" || diffString === "25 heroico";
    const is25N = difficulty === 2 || diffString === "25n" || diffString === "25 Normal" || diffString === "25 normal" || diffString === "25 Player" || diffString === "25 Jugadores" || diffString === "25";

    const isValidDifficulty = isUlduarBoss ? (is25H || is25N) : is25H;

    const peruTime = formatPeruTime(endtime);
    const isAfterSeven = peruTime.hour >= 19;
    const hasEnoughActors = actors.length > 1;

    if (isTargetBoss && isValidDifficulty && hasEnoughActors && isAfterSeven) {
      const normalizedName = normalizeBossName(name);
      // Construct HH:MM:SS since formatPeruTime only returned hour as a number
      const d = new Date(endtime * 1000);
      d.setUTCHours(d.getUTCHours() - 5);
      const peruTimeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;

      encounters.push({
        name: normalizedName,
        endtime,
        endtimeReal: peruTimeStr,
        actors,
        peruDate: peruTime.isoDate,
        peruTime: peruTimeStr,
      });
    }
  }

  encounters.sort((a, b) => a.endtime - b.endtime);

  const bossGroups = new Map();
  for (const enc of encounters) {
    const key = `${enc.peruDate}|${enc.name}`;
    if (!bossGroups.has(key)) bossGroups.set(key, []);
    bossGroups.get(key).push(enc);
  }

  const results = [];
  for (const group of bossGroups.values()) {
    const firstEnc = group[0];
    const isLK = ["The Lich King", "El Rey Exánime", "Rey Exánime"].some((n) => firstEnc.name.includes(n));

    if (isLK && group.length > 1) {
      results.push(group[group.length - 2]);
    } else {
      results.push(group[group.length - 1]);
    }
  }

  return results;
}
