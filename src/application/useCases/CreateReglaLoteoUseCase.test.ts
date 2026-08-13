import { describe, expect, it, vi } from "vitest";
import { CreateReglaLoteoUseCase } from "./CreateReglaLoteoUseCase";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaLoteoInput, ReglaLoteoRecord } from "@/src/domain/entities/Reglas";

function makeRepository(overrides: Partial<IReglasRepository> = {}): IReglasRepository {
  return {
    getLoteo: vi.fn(),
    getPuntos: vi.fn(),
    createLoteo: vi.fn(),
    updateLoteo: vi.fn(),
    deleteLoteo: vi.fn(),
    createPunto: vi.fn(),
    updatePunto: vi.fn(),
    deletePunto: vi.fn(),
    ...overrides,
  };
}

const validInput: ReglaLoteoInput = {
  raidCode: "RS",
  categoria: "ITEM",
  nombreItem: "Bandas agraviadas",
  requisitos: ["x4 Piezas T10 Heroicas"],
  valorMinimo: 100,
  iconUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_bracer_41.jpg",
  idItem: 54580,
};

describe("CreateReglaLoteoUseCase", () => {
  it("delegates to the repository with the given input", async () => {
    const expected: ReglaLoteoRecord = { id: "row-1", ...validInput };
    const createLoteo = vi.fn().mockResolvedValue(expected);
    const useCase = new CreateReglaLoteoUseCase(makeRepository({ createLoteo }));

    const result = await useCase.execute(validInput);

    expect(createLoteo).toHaveBeenCalledWith(validInput);
    expect(result).toBe(expected);
  });

  it("rejects when the item name is missing", async () => {
    const useCase = new CreateReglaLoteoUseCase(makeRepository());

    await expect(
      useCase.execute({ ...validInput, nombreItem: "" }),
    ).rejects.toThrow("Raid, categoría e ítem son obligatorios");
  });
});
