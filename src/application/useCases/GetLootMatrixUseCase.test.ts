import { describe, expect, it, vi } from "vitest";
import { GetLootMatrixUseCase } from "./GetLootMatrixUseCase";
import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootMatrix } from "@/src/domain/entities/Loot";

function makeRepository(overrides: Partial<ILootRepository> = {}): ILootRepository {
  return {
    getLootMatrix: vi.fn(),
    getRaidOptions: vi.fn(),
    getRecentWins: vi.fn(),
    getHistoryByCharacters: vi.fn(),
    registerWin: vi.fn(),
    registerWins: vi.fn(),
    updateWin: vi.fn(),
    deleteWin: vi.fn(),
    ...overrides,
  };
}

describe("GetLootMatrixUseCase", () => {
  it("normalizes the raid to uppercase and delegates to the repository", async () => {
    const expected: LootMatrix = { raid: "RS", characters: [], items: [], wins: [] };
    const getLootMatrix = vi.fn().mockResolvedValue(expected);
    const useCase = new GetLootMatrixUseCase(makeRepository({ getLootMatrix }));

    const result = await useCase.execute("rs");

    expect(getLootMatrix).toHaveBeenCalledWith("RS");
    expect(result).toBe(expected);
  });

  it("rejects raids outside the supported list", async () => {
    const useCase = new GetLootMatrixUseCase(makeRepository());

    await expect(useCase.execute("ULDUAR")).rejects.toThrow("Raid inválida: ULDUAR");
  });
});
