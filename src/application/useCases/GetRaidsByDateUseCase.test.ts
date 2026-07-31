import { describe, expect, it, vi } from "vitest";
import { GetRaidsByDateUseCase } from "./GetRaidsByDateUseCase";
import { IRaidsRepository } from "@/src/domain/repositories/IRaidsRepository";
import { RaidDateResult } from "@/src/domain/entities/Raid";

describe("GetRaidsByDateUseCase", () => {
  it("delegates to the repository with the given date and returns its result", async () => {
    const expected: RaidDateResult = { date: "2026-07-29", raids: [] };
    const getRaidsByDate = vi.fn().mockResolvedValue(expected);
    const repository: IRaidsRepository = { getRaidsByDate };

    const useCase = new GetRaidsByDateUseCase(repository);
    const result = await useCase.execute("2026-07-29");

    expect(getRaidsByDate).toHaveBeenCalledWith("2026-07-29");
    expect(result).toBe(expected);
  });
});
