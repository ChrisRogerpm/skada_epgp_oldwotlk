import { describe, expect, it } from "vitest";
import { GetReglasUseCase } from "./GetReglasUseCase";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoRow, ReglaPuntoRow } from "@/src/domain/entities/Reglas";

function makeUseCase(loteo: ReglaLoteoRow[], puntos: ReglaPuntoRow[]) {
  const repository: IReglasRepository = {
    getLoteo: async () => loteo,
    getPuntos: async () => puntos,
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

  it("groups loot rows by raid and normalizes requisitos into an array", async () => {
    const useCase = makeUseCase(
      [
        {
          raid: "Icecrown Citadel",
          categoria_item: "ITEM BIS",
          nombre_item: "Casco del Rey Exánime",
          requisitos: ["Solo Tanques", "4/5 Tier 10"],
          valor_minimo: 500,
          icon_url: "https://example.com/icon.jpg",
        },
        {
          raid: "Icecrown Citadel",
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
    expect(raids[0].raid).toBe("Icecrown Citadel");
    expect(raids[0].items).toEqual([
      {
        category: "ITEM BIS",
        item: "Casco del Rey Exánime",
        requirement: ["Solo Tanques", "4/5 Tier 10"],
        valueMin: 500,
        icon: "https://example.com/icon.jpg",
      },
      {
        category: "MONTURA",
        item: "Corcel Invencible",
        requirement: ["Asistencia 80%+"],
        valueMin: 1000,
        icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
      },
    ]);
  });

  it("falls back to 'Otras Reglas' when a loot row has no raid name", async () => {
    const useCase = makeUseCase(
      [{ categoria_item: "GENERAL", nombre_item: "Objeto sin raid", requisitos: null, valor_minimo: 0 }],
      [],
    );

    const [lootSection] = await useCase.execute();
    expect(lootSection["Reglas de Loteo"][0].raid).toBe("Otras Reglas");
    expect(lootSection["Reglas de Loteo"][0].items[0].requirement).toEqual([]);
  });

  it("splits points rows into beneficios and perjuicios by tipo, case-insensitively", async () => {
    const useCase = makeUseCase(
      [],
      [
        { tipo: "Beneficio", categoria: "Asistencia", descripcion: "Presente en raid", valor: 50 },
        { tipo: "PERJUICIO", categoria: "Faltas", descripcion: "Ausencia sin aviso", valor: -50 },
      ],
    );

    const [, benefitsSection, penaltiesSection] = await useCase.execute();

    expect(benefitsSection.Beneficios).toEqual([
      {
        category: "Asistencia",
        items: [
          {
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
