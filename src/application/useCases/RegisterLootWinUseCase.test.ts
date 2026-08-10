import { describe, expect, it, vi } from "vitest";
import { RegisterLootWinUseCase } from "./RegisterLootWinUseCase";
import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootWin, RegisterLootWinInput } from "@/src/domain/entities/Loot";

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

const validInput: RegisterLootWinInput = {
  personaje: "Arthas",
  class: "DEATHKNIGHT",
  id_item: 54591,
  id_raids: "5cfc5687-8ef2-449b-bcfc-c152e93695ed",
};

describe("RegisterLootWinUseCase", () => {
  it("delegates to the repository with the input and the admin id", async () => {
    const expected: LootWin = { id: 1, ...validInput, class: validInput.class ?? null, source: "manual" };
    const registerWin = vi.fn().mockResolvedValue(expected);
    const useCase = new RegisterLootWinUseCase(makeRepository({ registerWin }));

    const result = await useCase.execute(validInput, "admin-uuid");

    expect(registerWin).toHaveBeenCalledWith(validInput, "admin-uuid");
    expect(result).toBe(expected);
  });

  it("rejects when required fields are missing", async () => {
    const useCase = new RegisterLootWinUseCase(makeRepository());

    await expect(
      useCase.execute({ ...validInput, personaje: "" }, "admin-uuid"),
    ).rejects.toThrow("Personaje e ítem son obligatorios");
  });

  it("allows a null id_raids for legacy items with no tracked raid session", async () => {
    const legacyInput: RegisterLootWinInput = { ...validInput, id_raids: null, note: "Loot previo al sistema" };
    const expected: LootWin = { id: 2, ...legacyInput, class: legacyInput.class ?? null, source: "manual" };
    const registerWin = vi.fn().mockResolvedValue(expected);
    const useCase = new RegisterLootWinUseCase(makeRepository({ registerWin }));

    const result = await useCase.execute(legacyInput, "admin-uuid");

    expect(registerWin).toHaveBeenCalledWith(legacyInput, "admin-uuid");
    expect(result).toBe(expected);
  });
});
