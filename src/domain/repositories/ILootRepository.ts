import {
  LootMatrix,
  LootWin,
  LootWinDetailed,
  PaginatedLootWinsResult,
  RaidOption,
  RegisterLootWinInput,
  UpdateLootWinInput,
} from "../entities/Loot";

export interface ILootRepository {
  getLootMatrix(raid: string): Promise<LootMatrix>;
  getRaidOptions(limit: number, search: string): Promise<RaidOption[]>;
  getRecentWins(page: number, limit: number, search: string): Promise<PaginatedLootWinsResult>;
  getHistoryByCharacters(names: string[]): Promise<LootWinDetailed[]>;
  registerWin(input: RegisterLootWinInput, createdBy: string | null): Promise<LootWin>;
  registerWins(inputs: RegisterLootWinInput[], createdBy: string | null): Promise<LootWin[]>;
  updateWin(input: UpdateLootWinInput): Promise<LootWin>;
  deleteWin(id: number): Promise<void>;
}
