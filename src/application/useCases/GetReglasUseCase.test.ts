import { describe, expect, it, vi } from "vitest";
import { GetReglasUseCase } from "./GetReglasUseCase";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoRow, ReglaPuntoRow } from "@/src/domain/entities/Reglas";

function makeUseCase(loteo: ReglaLoteoRow[], puntos: ReglaPuntoRow[]) {
  const repository: IReglasRepository = {
    getLoteo: async () => loteo,
    getPuntos: async () => puntos,
    createLoteo: vi.fn(),
    updateLoteo: vi.fn(),
    deleteLoteo: vi.fn(),
    createPunto: vi.fn(),
    updatePunto: vi.fn(),
    deletePunto: vi.fn(),
  };
  return new GetReglasUseCase(repository);
}

describe("GetReglasUseCase", () => {
  it("returns empty sections when there are no rows", async () => {
    const useCase = makeUseCase([], []);
    const result = await useCase.execute();

    expect(result).toEqual([
      { "Reglas de Loteo": [] },
      { Beneficios: [] },
      { Perjuicios: [] },
    ]);
  });

  it("groups loot rows by raid, normalizes requisitos, and carries id/idItem/raidCode", async () => {
    const useCase = makeUseCase(
      [
        {
          id: "row-1",
          raid: "Icecrown Citadel (ICC)",
          categoria_item: "ITEM BIS",
          nombre_item: "Casco del Rey Exánime",
          requisitos: ["Solo Tanques", "4/5 Tier 10"],
          valor_minimo: 500,
          icon_url: "https://example.com/icon.jpg",
          id_item: 12345,
        },
        {
          id: "row-2",
          raid: "Icecrown Citadel (ICC)",
          categoria_item: "MONTURA",
          nombre_item: "Corcel Invencible",
          requisitos: "Asistencia 80%+",
          valor_minimo: 1000,
        },
      ],
      [],
    );

    const [lootSection] = await useCase.execute();
    const raids = lootSection["Reglas de Loteo"];

    expect(raids).toHaveLength(1);
    expect(raids[0].raid).toBe("Icecrown Citadel (ICC)");
    expect(raids[0].items).toEqual([
      {
        id: "row-1",
        idItem: 12345,
        raidCode: "ICC",
        category: "ITEM BIS",
        item: "Casco del Rey Exánime",
        requirement: ["Solo Tanques", "4/5 Tier 10"],
        valueMin: 500,
        icon: "https://example.com/icon.jpg",
      },
      {
        id: "row-2",
        idItem: null,
        raidCode: "ICC",
        category: "MONTURA",
        item: "Corcel Invencible",
        requirement: ["Asistencia 80%+"],
        valueMin: 1000,
        icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
      },
    ]);
  });

  it("falls back to 'Otras Reglas' and a null raidCode when a loot row has no raid name", async () => {
    const useCase = makeUseCase(
      [{ id: "row-3", categoria_item: "GENERAL", nombre_item: "Objeto sin raid", requisitos: null, valor_minimo: 0 }],
      [],
    );

    const [lootSection] = await useCase.execute();
    expect(lootSection["Reglas de Loteo"][0].raid).toBe("Otras Reglas");
    expect(lootSection["Reglas de Loteo"][0].items[0].requirement).toEqual([]);
    expect(lootSection["Reglas de Loteo"][0].items[0].raidCode).toBeNull();
  });

  it("splits points rows into beneficios and perjuicios by tipo, case-insensitively", async () => {
    const useCase = makeUseCase(
      [],
      [
        { id: "p-1", tipo: "Beneficio", categoria: "Asistencia", descripcion: "Presente en raid", valor: 50 },
        { id: "p-2", tipo: "PERJUICIO", categoria: "Faltas", descripcion: "Ausencia sin aviso", valor: -50 },
      ],
    );

    const [, benefitsSection, penaltiesSection] = await useCase.execute();

    expect(benefitsSection.Beneficios).toEqual([
      {
        category: "Asistencia",
        items: [
          {
            id: "p-1",
            descripcion: "Presente en raid",
            valor: 50,
            icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
          },
        ],
      },
    ]);
    expect(penaltiesSection.Perjuicios).toEqual([
      {
        category: "Faltas",
        items: [
          {
            id: "p-2",
            descripcion: "Ausencia sin aviso",
            valor: -50,
            icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
          },
        ],
      },
    ]);
  });

  it("flattens rows that already carry a nested items array (admin-shaped rows)", async () => {
    const useCase = makeUseCase(
      [],
      [
        {
          tipo: "beneficio",
          categoria: "Eventos",
          items: [
            { descripcion: "Ganador de trivia", valor: 20, icon: "https://example.com/a.jpg" },
            { descripcion: "Participante evento", valor: 10, icon: "https://example.com/b.jpg" },
          ],
        },
      ],
    );

    const [, benefitsSection] = await useCase.execute();
    expect(benefitsSection.Beneficios).toEqual([
      {
        category: "Eventos",
        items: [
          { descripcion: "Ganador de trivia", valor: 20, icon: "https://example.com/a.jpg" },
          { descripcion: "Participante evento", valor: 10, icon: "https://example.com/b.jpg" },
        ],
      },
    ]);
  });
});
