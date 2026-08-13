import { describe, expect, it, vi } from "vitest";
import { RegisterLootWinsUseCase } from "./RegisterLootWinsUseCase";
import { ILootRepository } from "@/src/domain/repositories/ILootRepository";
import { LootWin, RegisterLootWinsInput } from "@/src/domain/entities/Loot";

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

const validInput: RegisterLootWinsInput = {
  personaje: "Arthas",
  class: "DEATHKNIGHT",
  id_items: [54591, 54578],
  id_raids: "5cfc5687-8ef2-449b-bcfc-c152e93695ed",
};

describe("RegisterLootWinsUseCase", () => {
  it("expands id_items into one input per item and delegates to registerWins", async () => {
    const expected: LootWin[] = validInput.id_items.map((id_item, i) => ({
      id: i + 1,
      id_item,
      id_raids: validInput.id_raids,
      personaje: validInput.personaje,
      class: validInput.class ?? null,
      source: "manual",
    }));
    const registerWins = vi.fn().mockResolvedValue(expected);
    const useCase = new RegisterLootWinsUseCase(makeRepository({ registerWins }));

    const result = await useCase.execute(validInput, "admin-uuid");

    expect(registerWins).toHaveBeenCalledWith(
      [
        { personaje: "Arthas", class: "DEATHKNIGHT", id_item: 54591, id_raids: validInput.id_raids, note: undefined },
        { personaje: "Arthas", class: "DEATHKNIGHT", id_item: 54578, id_raids: validInput.id_raids, note: undefined },
      ],
      "admin-uuid",
    );
    expect(result).toBe(expected);
  });

  it("rejects when there are no items selected", async () => {
    const useCase = new RegisterLootWinsUseCase(makeRepository());

    await expect(
      useCase.execute({ ...validInput, id_items: [] }, "admin-uuid"),
    ).rejects.toThrow("Personaje y al menos un ítem son obligatorios");
  });

  it("rejects when personaje is missing", async () => {
    const useCase = new RegisterLootWinsUseCase(makeRepository());

    await expect(
      useCase.execute({ ...validInput, personaje: "" }, "admin-uuid"),
    ).rejects.toThrow("Personaje y al menos un ítem son obligatorios");
  });
});
