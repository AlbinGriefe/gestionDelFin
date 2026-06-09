import { z } from "zod";

export const narrativeEventIdParamSchema = z.object({
  eventId: z.coerce.number().int().positive(),
});

export const listNarrativeEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  campId: z.coerce.number().int().positive().optional(),
  type: z
    .enum([
      "disease",
      "scarcity",
      "zombie_attack",
      "valuable_resources",
      "traveler_loss",
    ])
    .optional(),
  status: z.enum(["generated", "applied", "resolved"]).optional(),
});
