import { describe, expect, it, vi } from "vitest";
import { SearchEpgpCharactersUseCase } from "./SearchEpgpCharactersUseCase";
import { IEpgpRepository } from "@/src/domain/repositories/IEpgpRepository";

function makeRepository(overrides: Partial<IEpgpRepository> = {}): IEpgpRepository {
  return {
    getEpgpRoster: vi.fn(),
    getEpgpLogs: vi.fn(),
    searchCharacters: vi.fn(),
    getEpgpHistoryByNames: vi.fn(),
    ...overrides,
  };
}

describe("SearchEpgpCharactersUseCase", () => {
  it("short-circuits to an empty array without calling the repository when query is empty", async () => {
    const searchCharacters = vi.fn();
    const useCase = new SearchEpgpCharactersUseCase(makeRepository({ searchCharacters }));

    const result = await useCase.execute({ query: "" });

    expect(result).toEqual([]);
    expect(searchCharacters).not.toHaveBeenCalled();
  });

  it("delegates to the repository when a query is provided", async () => {
    const matches = [{ nombre_alter: "Thrall", clase: "SHAMAN", main: "Thrall" }];
    const searchCharacters = vi.fn().mockResolvedValue(matches);
    const useCase = new SearchEpgpCharactersUseCase(makeRepository({ searchCharacters }));

    const result = await useCase.execute({ query: "thra" });

    expect(searchCharacters).toHaveBeenCalledWith("thra");
    expect(result).toBe(matches);
  });
});
