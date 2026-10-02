import type { RaidInfo } from "@/app/types/RaidComposition";
import { BOSSES_BY_INSTANCE } from "@/app/types/RaidLog";

const RAID_OF_BOSS: [RegExp, string][] = [
  [/halion|saviana|zarithrian|baltharus/i, "RS"],
  [/anub'arak|northrend beasts|jaraxxus|faction champions|val'kyr/i, "ToGC"],
  [
    /marrowgar|deathwhisper|gunship|saurfang|festergut|rotface|putricide|blood prince|lana'thel|valithria|sindragosa|lich king/i,
    "ICC",
  ],
];

const INSTANCE_BY_SHORT: Record<string, string> = {
  ICC: "Icecrown Citadel",
  RS: "Ruby Sanctum",
  ToGC: "Trial of the Crusader",
};

/** Código corto de la instancia a la que pertenece un jefe ("ICC", "RS", "ToGC"). */
export function raidShort(boss: string) {
  return RAID_OF_BOSS.find(([re]) => re.test(boss))?.[1] ?? "Raid";
}

/** Jefes que registra la sincronización por instancia (en RS solo se sigue a Halion). */
export function instanceBosses(short: string) {
  if (short === "RS") return ["Halion"];
  return BOSSES_BY_INSTANCE[INSTANCE_BY_SHORT[short] ?? ""] ?? [];
}

export interface RaidSession {
  key: string;
  short: string;
  size: 10 | 25;
  /** Número de run de esa instancia en el día (RS los miércoles suele tener varias). */
  run: number;
  start: string;
  encounters: RaidInfo[];
}

/**
 * Agrupa los encuentros (un registro por jefe) de un día en raids: los
 * encuentros seguidos de la misma instancia forman una raid, y en cuanto un
 * jefe se repite empieza otra (cada kill de Halion es una run distinta).
 */
export function groupSessions(raids: RaidInfo[]): RaidSession[] {
  const sorted = [...raids].sort((a, b) => a.raid_time.localeCompare(b.raid_time));
  const sessions: RaidSession[] = [];
  sorted.forEach((r) => {
    const short = raidShort(r.boss_name);
    const last = sessions[sessions.length - 1];
    const sameRun =
      last && last.short === short && !last.encounters.some((e) => e.boss_name === r.boss_name);
    if (sameRun) last.encounters.push(r);
    else
      sessions.push({
        key: `${short}-${r.id}`,
        short,
        size: 25,
        run: sessions.filter((s) => s.short === short).length + 1,
        start: r.raid_time.slice(0, 5),
        encounters: [r],
      });
  });
  sessions.forEach((s) => {
    s.size = Math.max(0, ...s.encounters.map((e) => e.participants.length)) > 10 ? 25 : 10;
  });
  return sessions;
}

/** "RS 25", o "RS 25 · #2" cuando hay varias runs de la instancia ese día. */
export function sessionLabel(session: RaidSession, all: RaidSession[]) {
  const runs = all.filter((s) => s.short === session.short).length;
  return `${session.short} ${session.size}${runs > 1 ? ` · #${session.run}` : ""}`;
}
