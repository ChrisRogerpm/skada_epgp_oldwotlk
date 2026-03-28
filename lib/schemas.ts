import { z } from "zod";

export const RaidLogEntrySchema = z.object({
  Character: z.string(),
  Class: z.string(),
  Talent: z.string().nullish(),
  Amount: z.number().or(z.string()),
  DPS: z.number().or(z.string()).nullish(),
  Rank: z.number(),
  Icon: z.string().nullish(),
});

export const RaidEncounterPayloadSchema = z.object({
  name: z.string(),
  date: z.string(),
  Damage: z.array(RaidLogEntrySchema).optional(),
  Healing: z.array(RaidLogEntrySchema).optional(),
});

export const LogsResponseSchema = z.array(RaidEncounterPayloadSchema);

export type ValidatedRaidLogEntry = z.infer<typeof RaidLogEntrySchema>;
export type ValidatedRaidEncounterPayload = z.infer<typeof RaidEncounterPayloadSchema>;
