import { describe, expect, it, vi } from "vitest";
import { CreateReglaPuntoUseCase } from "./CreateReglaPuntoUseCase";
import { IReglasRepository } from "@/src/domain/repositories/IReglasRepository";
import { ReglaPuntoInput, ReglaPuntoRecord } from "@/src/domain/entities/Reglas";

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

const validInput: ReglaPuntoInput = {
  tipo: "beneficio",
  categoria: "Icecrown Citadel (ICC)",
  descripcion: "BONO - ICC - Lady 0 Espiritus 0 Muertos",
  valor: 30,
  iconUrl: "https://wow.zamimg.com/images/wow/icons/large/achievement_boss_ladydeathwhisper.jpg",
};

describe("CreateReglaPuntoUseCase", () => {
  it("delegates to the repository with the given input", async () => {
    const expected: ReglaPuntoRecord = { id: "p-1", ...validInput };
    const createPunto = vi.fn().mockResolvedValue(expected);
    const useCase = new CreateReglaPuntoUseCase(makeRepository({ createPunto }));

    const result = await useCase.execute(validInput);

    expect(createPunto).toHaveBeenCalledWith(validInput);
    expect(result).toBe(expected);
  });

  it("rejects when the category is missing", async () => {
    const useCase = new CreateReglaPuntoUseCase(makeRepository());

    await expect(
      useCase.execute({ ...validInput, categoria: "" }),
    ).rejects.toThrow("Tipo y categoría son obligatorios");
  });
});
