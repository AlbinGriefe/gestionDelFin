import prisma, { Prisma } from "../../lib/prisma.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

export interface AchievementCriteria {
  type:
    | "persons_accepted"
    | "expeditions_returned"
    | "transfers_completed"
    | "care_actions"
    | "no_shortage";
  count?: number;
  points: number;
}

export interface AchievementDefinition {
  name: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    name: "Primer refugiado",
    description: "Acepta a tu primera persona en el campamento.",
    icon: "user-plus",
    criteria: { type: "persons_accepted", count: 1, points: 10 },
  },
  {
    name: "Comunidad en pie",
    description: "Reune a 5 personas aceptadas y activas.",
    icon: "users",
    criteria: { type: "persons_accepted", count: 5, points: 20 },
  },
  {
    name: "Bodega surtida",
    description: "Manten todos los recursos por encima del minimo.",
    icon: "package-check",
    criteria: { type: "no_shortage", points: 15 },
  },
  {
    name: "Primer botin",
    description: "Completa una expedicion con regreso exitoso.",
    icon: "compass",
    criteria: { type: "expeditions_returned", count: 1, points: 20 },
  },
  {
    name: "Exploradores veteranos",
    description: "Completa 3 expediciones con regreso exitoso.",
    icon: "map",
    criteria: { type: "expeditions_returned", count: 3, points: 30 },
  },
  {
    name: "Puente entre bases",
    description: "Completa un traslado entre campamentos.",
    icon: "truck",
    criteria: { type: "transfers_completed", count: 1, points: 20 },
  },
  {
    name: "Red de apoyo",
    description: "Completa 3 traslados entre campamentos.",
    icon: "share-2",
    criteria: { type: "transfers_completed", count: 3, points: 30 },
  },
  {
    name: "Manos que curan",
    description: "Realiza una accion de cuidado medico.",
    icon: "heart-pulse",
    criteria: { type: "care_actions", count: 1, points: 15 },
  },
];

const POINTS_PER_LEVEL = 40;

interface CampMetrics {
  personsAccepted: number;
  expeditionsReturned: number;
  transfersCompleted: number;
  careActions: number;
  storageCount: number;
  belowMinimum: number;
}

async function ensureDefinitions() {
  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievements.upsert({
      where: { avs_name: definition.name },
      create: {
        avs_name: definition.name,
        avs_description: definition.description,
        avs_icon_url: definition.icon,
        avs_criteria: definition.criteria as unknown as Prisma.InputJsonValue,
        avs_is_active: true,
      },
      update: {
        avs_description: definition.description,
        avs_icon_url: definition.icon,
        avs_criteria: definition.criteria as unknown as Prisma.InputJsonValue,
        avs_is_active: true,
      },
    });
  }
}

async function computeMetrics(campId: number): Promise<CampMetrics> {
  const [
    personsAccepted,
    expeditionsReturned,
    transfersCompleted,
    careActions,
    storageRows,
  ] = await prisma.$transaction([
    prisma.persons.count({
      where: {
        id_camp: campId,
        prn_is_active: true,
        prn_admission_status: "accepted",
      },
    }),
    prisma.expeditions.count({
      where: { id_camp: campId, exe_state: "returned" },
    }),
    prisma.transfers.count({
      where: {
        tfs_state: "completed",
        OR: [{ id_origin_camp: campId }, { id_destiny_camp: campId }],
      },
    }),
    prisma.care_actions.count({ where: { id_camp: campId } }),
    prisma.storage.findMany({
      where: { id_camp: campId },
      select: { stg_quantity: true, stg_min_quantity: true },
    }),
  ]);

  const belowMinimum = storageRows.filter(
    (row) => Number(row.stg_quantity) < Number(row.stg_min_quantity),
  ).length;

  return {
    personsAccepted,
    expeditionsReturned,
    transfersCompleted,
    careActions,
    storageCount: storageRows.length,
    belowMinimum,
  };
}

function evaluateCriteria(criteria: AchievementCriteria, metrics: CampMetrics) {
  const target = criteria.count ?? 1;
  switch (criteria.type) {
    case "persons_accepted":
      return { current: metrics.personsAccepted, target };
    case "expeditions_returned":
      return { current: metrics.expeditionsReturned, target };
    case "transfers_completed":
      return { current: metrics.transfersCompleted, target };
    case "care_actions":
      return { current: metrics.careActions, target };
    case "no_shortage":
      return {
        current: metrics.storageCount > 0 && metrics.belowMinimum === 0 ? 1 : 0,
        target: 1,
      };
    default:
      return { current: 0, target: 1 };
  }
}

export class AchievementsService {
  async getAchievements(actor: AuthenticatedUser) {
    await ensureDefinitions();

    const [definitions, awarded, metrics] = await Promise.all([
      prisma.achievements.findMany({
        where: { avs_is_active: true },
        orderBy: { id_achievement: "asc" },
      }),
      prisma.achievement_users.findMany({
        where: { id_user: actor.id },
      }),
      computeMetrics(actor.campId),
    ]);

    const awardedMap = new Map(
      awarded.map((entry) => [entry.id_achievement, entry.acu_awarded_at]),
    );

    const justUnlocked: string[] = [];

    const items = [];
    for (const definition of definitions) {
      const criteria =
        definition.avs_criteria as unknown as AchievementCriteria;
      const progress = evaluateCriteria(criteria, metrics);
      const alreadyAwarded = awardedMap.has(definition.id_achievement);
      const meetsNow = progress.current >= progress.target;

      let awardedAt = awardedMap.get(definition.id_achievement) ?? null;

      if (!alreadyAwarded && meetsNow) {
        try {
          const created = await prisma.achievement_users.create({
            data: {
              id_achievement: definition.id_achievement,
              id_user: actor.id,
            },
          });
          awardedAt = created.acu_awarded_at;
          justUnlocked.push(definition.avs_name);
        } catch {
          awardedAt = new Date();
        }
      }

      const unlocked = alreadyAwarded || meetsNow;

      items.push({
        id: definition.id_achievement,
        name: definition.avs_name,
        description: definition.avs_description,
        icon: definition.avs_icon_url ?? "award",
        points: criteria.points,
        unlocked,
        awardedAt: awardedAt ? awardedAt.toISOString() : null,
        progress: {
          current: Math.min(progress.current, progress.target),
          target: progress.target,
        },
      });
    }

    const totalPoints = items
      .filter((item) => item.unlocked)
      .reduce((sum, item) => sum + item.points, 0);
    const unlockedCount = items.filter((item) => item.unlocked).length;
    const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
    const pointsIntoLevel = totalPoints % POINTS_PER_LEVEL;

    return {
      items,
      justUnlocked,
      summary: {
        unlockedCount,
        total: items.length,
        totalPoints,
        level,
        levelProgressPct: Math.round(
          (pointsIntoLevel / POINTS_PER_LEVEL) * 100,
        ),
        pointsToNextLevel: POINTS_PER_LEVEL - pointsIntoLevel,
      },
    };
  }
}

export const achievementsService = new AchievementsService();
