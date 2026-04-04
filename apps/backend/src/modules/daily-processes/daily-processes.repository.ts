import prisma, { Prisma } from "../../lib/prisma.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

export class DailyProcessesRepository {
  async checkDailyProductionRan(campId: number): Promise<boolean> {
    const existing = await prisma.resources_movements.findFirst({
      where: {
        id_camp: campId,
        rsm_type: "daily_production",
        rsm_movement_date: {
          gte: startOfToday(),
          lt: startOfTomorrow(),
        },
      },
    });

    return existing !== null;
  }

  async getRequiredSettings() {
    const keys = [
      "daily_food_resource_id",
      "daily_water_resource_id",
      "daily_food_ration_per_person",
      "daily_water_ration_per_person",
    ];

    const settings = await prisma.system_settings.findMany({
      where: {
        sts_key: { in: keys },
      },
    });

    return Object.fromEntries(settings.map((s) => [s.sts_key, s.sts_value]));
  }

  async findWorkingPersons(campId: number) {
    return prisma.persons.findMany({
      where: {
        id_camp: campId,
        prn_is_active: true,
        prn_is_accepted: true,
        OR: [
          { id_person_health: null },
          {
            person_health: {
              phs_can_work: true,
            },
          },
        ],
      },
      include: {
        professions: {
          select: {
            pfs_food_generated_per_day: true,
            pfs_water_generated_per_day: true,
          },
        },
      },
    });
  }

  async findActivePersons(campId: number) {
    return prisma.persons.findMany({
      where: {
        id_camp: campId,
        prn_is_active: true,
        prn_is_accepted: true,
      },
    });
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: { id_camp: campId },
    });
  }

  async findPersonById(personId: number) {
    return prisma.persons.findUnique({
      where: { id_person: personId },
    });
  }

  async findResourceById(resourceId: number) {
    return prisma.resources.findUnique({
      where: { id_resource: resourceId },
    });
  }

  async runDailyProcess(input: {
    campId: number;
    actorUserId: number;
    foodResourceId: number;
    waterResourceId: number;
    totalFoodProduced: number;
    totalWaterProduced: number;
    totalFoodRation: number;
    totalWaterRation: number;
    workingPersonsCount: number;
    totalPersonsCount: number;
    now: Date;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      async function upsertStorage(resourceId: number, delta: number) {
        const storage = await tx.storage.findFirst({
          where: { id_camp: input.campId, id_resource: resourceId },
        });

        const previousQuantity = storage ? Number(storage.stg_quantity) : 0;
        const nextQuantity = Number((previousQuantity + delta).toFixed(2));
        const minQuantity = storage ? Number(storage.stg_min_quantity) : 0;

        const updated = storage
          ? await tx.storage.update({
              where: { id_storage: storage.id_storage },
              data: {
                stg_quantity: nextQuantity,
                stg_last_updated_at: input.now,
              },
            })
          : await tx.storage.create({
              data: {
                id_camp: input.campId,
                id_resource: resourceId,
                stg_quantity: Math.max(0, nextQuantity),
                stg_min_quantity: 0,
                stg_last_updated_at: input.now,
              },
            });

        const isBelowMinimum = nextQuantity < minQuantity;

        await tx.storage_records.create({
          data: {
            id_storage: updated.id_storage,
            id_user: input.actorUserId,
            str_previous_quantity: previousQuantity,
            str_new_quantity: nextQuantity,
            str_reason:
              delta >= 0
                ? `Daily production for camp #${input.campId}.`
                : `Daily ration distribution for camp #${input.campId}.`,
            str_is_below_minimum: isBelowMinimum,
            str_recorded_at: input.now,
          },
        });

        return { previousQuantity, nextQuantity, isBelowMinimum, storageId: updated.id_storage };
      }

      const foodProduction = await upsertStorage(input.foodResourceId, input.totalFoodProduced);

      await tx.resources_movements.create({
        data: {
          id_resource: input.foodResourceId,
          id_camp: input.campId,
          id_user: input.actorUserId,
          rsm_type: "daily_production",
          rsm_quantity: input.totalFoodProduced,
          rsm_reason_for_movement: `Daily food production: ${input.workingPersonsCount} working persons.`,
          rsm_reference_type: "system",
          rsm_movement_date: input.now,
        },
      });

      const waterProduction = await upsertStorage(input.waterResourceId, input.totalWaterProduced);

      await tx.resources_movements.create({
        data: {
          id_resource: input.waterResourceId,
          id_camp: input.campId,
          id_user: input.actorUserId,
          rsm_type: "daily_production",
          rsm_quantity: input.totalWaterProduced,
          rsm_reason_for_movement: `Daily water production: ${input.workingPersonsCount} working persons.`,
          rsm_reference_type: "system",
          rsm_movement_date: input.now,
        },
      });

      const foodRation = await upsertStorage(input.foodResourceId, -input.totalFoodRation);

      await tx.resources_movements.create({
        data: {
          id_resource: input.foodResourceId,
          id_camp: input.campId,
          id_user: input.actorUserId,
          rsm_type: "ration",
          rsm_quantity: input.totalFoodRation,
          rsm_reason_for_movement: `Daily food ration: ${input.totalPersonsCount} persons.`,
          rsm_reference_type: "system",
          rsm_movement_date: input.now,
        },
      });

      const waterRation = await upsertStorage(input.waterResourceId, -input.totalWaterRation);

      await tx.resources_movements.create({
        data: {
          id_resource: input.waterResourceId,
          id_camp: input.campId,
          id_user: input.actorUserId,
          rsm_type: "ration",
          rsm_quantity: input.totalWaterRation,
          rsm_reason_for_movement: `Daily water ration: ${input.totalPersonsCount} persons.`,
          rsm_reference_type: "system",
          rsm_movement_date: input.now,
        },
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: input.campId,
          evt_entity: "daily_processes",
          evt_action: "daily_process_ran",
          evt_new_value: toPrismaJsonValue({
            workingPersonsCount: input.workingPersonsCount,
            totalPersonsCount: input.totalPersonsCount,
            foodProduced: input.totalFoodProduced,
            waterProduced: input.totalWaterProduced,
            foodRation: input.totalFoodRation,
            waterRation: input.totalWaterRation,
          }),
          evt_description: `Daily process ran for camp #${input.campId}.`,
        },
      });

      return {
        foodProduction,
        waterProduction,
        foodRation,
        waterRation,
      };
    });
  }

  async applyProductionCorrection(input: {
    campId: number;
    personId: number;
    resourceId: number;
    quantityDelta: number;
    reason: string;
    actorUserId: number;
    now: Date;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const storage = await tx.storage.findFirst({
        where: { id_camp: input.campId, id_resource: input.resourceId },
      });

      const previousQuantity = storage ? Number(storage.stg_quantity) : 0;
      const nextQuantity = Number((previousQuantity + input.quantityDelta).toFixed(2));

      if (nextQuantity < 0) {
        throw new Error(
          `Insufficient stock: available ${previousQuantity}, correction would result in ${nextQuantity}.`,
        );
      }

      const minQuantity = storage ? Number(storage.stg_min_quantity) : 0;

      const updated = storage
        ? await tx.storage.update({
            where: { id_storage: storage.id_storage },
            data: { stg_quantity: nextQuantity, stg_last_updated_at: input.now },
          })
        : await tx.storage.create({
            data: {
              id_camp: input.campId,
              id_resource: input.resourceId,
              stg_quantity: nextQuantity,
              stg_min_quantity: 0,
              stg_last_updated_at: input.now,
            },
          });

      const isBelowMinimum = nextQuantity < minQuantity;

      await tx.storage_records.create({
        data: {
          id_storage: updated.id_storage,
          id_user: input.actorUserId,
          str_previous_quantity: previousQuantity,
          str_new_quantity: nextQuantity,
          str_reason: input.reason,
          str_is_below_minimum: isBelowMinimum,
          str_recorded_at: input.now,
        },
      });

      await tx.resources_movements.create({
        data: {
          id_resource: input.resourceId,
          id_camp: input.campId,
          id_user: input.actorUserId,
          id_person: input.personId,
          rsm_type: "adjustment",
          rsm_quantity: input.quantityDelta,
          rsm_reason_for_movement: input.reason,
          rsm_reference_type: "person",
          rsm_movement_date: input.now,
        },
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          id_camp: input.campId,
          evt_entity: "daily_processes",
          evt_action: "production_correction",
          evt_old_value: toPrismaJsonValue({ quantity: previousQuantity }),
          evt_new_value: toPrismaJsonValue({ quantity: nextQuantity }),
          evt_description: input.reason,
        },
      });

      return {
        previousQuantity,
        nextQuantity,
        isBelowMinimum,
      };
    });
  }
}

export const dailyProcessesRepository = new DailyProcessesRepository();
