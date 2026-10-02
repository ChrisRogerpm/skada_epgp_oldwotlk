import { describe, expect, it } from "vitest";
import {
  attributeLoot,
  rowsToPrune,
  type AttributionRaid,
  type AttributionLog,
} from "./raidItemsAttribution";

const squad = (names: string[]) =>
  names.map((player_name) => ({ player_name, player_class: "MAGE" }));

const log = (
  personaje: string,
  hour: string,
  descripcion: string,
  valor = -100,
  fecha = "01/10/2026",
): AttributionLog => ({
  fecha,
  hour,
  personaje,
  descripcion,
  valor,
});

describe("attributeLoot", () => {
  it("assigns each ICC drop to the boss killed just before it, not to every boss of the night", () => {
    const players = squad(["Ana", "Beto"]);
    const raids: AttributionRaid[] = [
      { id: "marrowgar", raid_date: "2026-10-01", raid_time: "20:05:00", participants: players },
      { id: "deathwhisper", raid_date: "2026-10-01", raid_time: "20:20:00", participants: players },
      { id: "lichking", raid_date: "2026-10-01", raid_time: "22:40:00", participants: players },
    ];
    const result = attributeLoot(raids, [
      log("Ana", "20:07:12", "Icecrown Citadel - Hoja (ID:50000)"),
      log("Beto", "22:43:00", "Icecrown Citadel - Agonía (ID:50001)"),
    ]);

    expect(result).toEqual([
      expect.objectContaining({ id_item: 50000, id_raids: "marrowgar", personaje: "Ana" }),
      expect.objectContaining({ id_item: 50001, id_raids: "lichking", personaje: "Beto" }),
    ]);
  });

  it("keeps several RS runs of the same day separate", () => {
    const raids: AttributionRaid[] = [
      {
        id: "halion-1",
        raid_date: "2026-10-01",
        raid_time: "20:30:00",
        participants: squad(["Ana", "Beto"]),
      },
      {
        id: "halion-2",
        raid_date: "2026-10-01",
        raid_time: "21:30:00",
        participants: squad(["Ana", "Ciro"]),
      },
    ];
    const result = attributeLoot(raids, [
      log("Ana", "20:33:00", "Ruby Sanctum - Sello (ID:54590)"),
      log("Ana", "21:34:00", "Ruby Sanctum - Anillo (ID:54576)"),
      log("Ciro", "21:35:00", "Ruby Sanctum - Capa (ID:54583)"),
    ]);

    expect(result.map((r) => [r.id_item, r.id_raids])).toEqual([
      [54590, "halion-1"],
      [54576, "halion-2"],
      [54583, "halion-2"],
    ]);
  });

  it("only considers encounters the winner took part in", () => {
    const raids: AttributionRaid[] = [
      {
        id: "run-ana",
        raid_date: "2026-10-01",
        raid_time: "20:30:00",
        participants: squad(["Ana"]),
      },
      {
        id: "run-beto",
        raid_date: "2026-10-01",
        raid_time: "21:00:00",
        participants: squad(["Beto"]),
      },
    ];
    const [item] = attributeLoot(raids, [
      log("Ana", "21:05:00", "Ruby Sanctum - Sello (ID:54590)"),
    ]);
    expect(item.id_raids).toBe("run-ana");
  });

  it("matches loot handed out after midnight to the kill of the previous day", () => {
    const raids: AttributionRaid[] = [
      { id: "late", raid_date: "2026-10-01", raid_time: "23:58:00", participants: squad(["Ana"]) },
    ];
    const [item] = attributeLoot(raids, [
      log("Ana", "00:04:00", "Icecrown Citadel - Hoja (ID:50000)", -100, "02/10/2026"),
    ]);
    expect(item.id_raids).toBe("late");
  });

  it("skips drops that were undone and logs without an item id", () => {
    const raids: AttributionRaid[] = [
      {
        id: "boss",
        raid_date: "2026-10-01",
        raid_time: "20:00:00",
        participants: squad(["Ana", "Beto"]),
      },
    ];
    const result = attributeLoot(raids, [
      log("Ana", "20:02:00", "Icecrown Citadel - Hoja (ID:50000)"),
      log("Ana", "20:03:00", "Undo: Icecrown Citadel - Hoja (ID:50000)", 100),
      log("Beto", "20:04:00", "Asistencia a raid", 50),
    ]);
    expect(result).toEqual([]);
  });

  it("does not duplicate the same delivery logged twice", () => {
    const raids: AttributionRaid[] = [
      { id: "boss", raid_date: "2026-10-01", raid_time: "20:00:00", participants: squad(["Ana"]) },
    ];
    const entry = log("Ana", "20:02:00", "Icecrown Citadel - Hoja (ID:50000)");
    expect(attributeLoot(raids, [entry, { ...entry }])).toHaveLength(1);
  });
});

describe("rowsToPrune", () => {
  const raids = [
    { id: "a", raid_date: "2026-10-01" },
    { id: "b", raid_date: "2026-10-01" },
  ];
  const desired = [{ id_item: 1, id_raids: "a", personaje: "Ana", class: null, valor: -10 }];

  it("removes copies of a delivery already assigned to another encounter that day", () => {
    const existing = [
      { id: 1, id_item: 1, id_raids: "a", personaje: "Ana", source: "sync" },
      { id: 2, id_item: 1, id_raids: "b", personaje: "Ana", source: "sync" },
    ];
    expect(rowsToPrune(existing, desired, raids, []).map((r) => r.id)).toEqual([2]);
  });

  it("removes undone deliveries but keeps rows with no EPGP evidence and manual rows", () => {
    const existing = [
      { id: 3, id_item: 2, id_raids: "a", personaje: "Beto", source: "sync" },
      { id: 4, id_item: 3, id_raids: "a", personaje: "Ciro", source: "sync" },
      { id: 5, id_item: 1, id_raids: "b", personaje: "Ana", source: "manual" },
    ];
    const logs = [log("Beto", "20:10:00", "Deshacer Hoja (ID:2)", 100)];
    expect(rowsToPrune(existing, desired, raids, logs).map((r) => r.id)).toEqual([3]);
  });
});
