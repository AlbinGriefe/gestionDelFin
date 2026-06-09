import { Prisma } from "../../lib/prisma.js";
import { advanceStats } from "./person-stats.js";
import type { PersonStatsSummary } from "./persons.types.js";

function mapStats(stats: {
  pst_health: number;
  pst_max_health: number;
  pst_strength: number;
  pst_satiety: number;
  pst_hydration: number;
  pst_luck: number;
  pst_level: number;
}): PersonStatsSummary {
  return {
    health: stats.pst_health,
    maxHealth: stats.pst_max_health,
    strength: stats.pst_strength,
    satiety: stats.pst_satiety,
    hydration: stats.pst_hydration,
    luck: stats.pst_luck,
    level: stats.pst_level,
  };
}

export async function applyPersonProgression(
  tx: Prisma.TransactionClient,
  input: {
    personId: number;
    sourceType: "daily_assignment" | "expedition" | "transfer" | "care";
    referenceKey: string;
    actorUserId?: number | null;
  },
) {
  const existing = await tx.person_progressions.findFirst({
    where: {
      id_person: input.personId,
      ppg_reference_key: input.referenceKey,
    },
  });
  if (existing) {
    return { applied: false, reason: "already_applied" as const };
  }

  const statsRecord = await tx.person_stats.findUnique({
    where: { id_person: input.personId },
  });
  if (!statsRecord) {
    return { applied: false, reason: "stats_missing" as const };
  }

  const before = mapStats(statsRecord);
  const after = advanceStats(before);
  await tx.person_progressions.create({
    data: {
      id_person: input.personId,
      ppg_source_type: input.sourceType,
      ppg_reference_key: input.referenceKey,
      ppg_previous_level: before.level,
      ppg_new_level: after.level,
      ppg_stats_before: before as unknown as Prisma.InputJsonValue,
      ppg_stats_after: after as unknown as Prisma.InputJsonValue,
    },
  });
  await tx.person_stats.update({
    where: { id_person: input.personId },
    data: {
      pst_health: after.health,
      pst_max_health: after.maxHealth,
      pst_strength: after.strength,
      pst_satiety: after.satiety,
      pst_hydration: after.hydration,
      pst_luck: after.luck,
      pst_level: after.level,
      pst_updated_at: new Date(),
    },
  });
  await tx.person_records.create({
    data: {
      id_person: input.personId,
      id_user: input.actorUserId ?? null,
      prr_event_type: "level_up",
      prr_old_value: before as unknown as Prisma.InputJsonValue,
      prr_new_value: after as unknown as Prisma.InputJsonValue,
      prr_notes:
        after.level === before.level
          ? "Successful activity recorded at maximum level."
          : `Level increased from ${before.level} to ${after.level}.`,
    },
  });

  return { applied: true, reason: "success" as const, before, after };
}
