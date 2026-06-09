import { z } from "zod";

export const healPersonSchema = z.object({
  doctorPersonId: z.number().int().positive(),
  patientPersonId: z.number().int().positive(),
  notes: z.string().trim().max(255).nullable().optional(),
});
