import prisma, { Prisma } from "../../lib/prisma.js";

export async function findWorkablePersons(campId: number) {
  return prisma.persons.findMany({
    where: {
      id_camp: campId,
      prn_is_active: true,
      prn_is_accepted: true,
      OR: [
        { id_person_health: null },
        { person_health: { phs_can_work: true } },
      ],
    },
    include: {
      professions: true,
      person_health: true,
    },
  });
}

export async function findActiveCampPersons(campId: number) {
  return prisma.persons.findMany({
    where: {
      id_camp: campId,
      prn_is_active: true,
      prn_is_accepted: true,
    },
  });
}

export async function findRationableStorage(campId: number) {
  return prisma.storage.findMany({
    where: {
      id_camp: campId,
      resources: {
        rss_is_rationable: true,
        rss_is_active: true,
      },
    },
    include: { resources: true },
  });
}

export async function findTodayDailyProcessEvent(campId: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.events.findFirst({
    where: {
      id_camp: campId,
      evt_entity: "daily_process",
      evt_action: "run",
      evt_created_at: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { evt_created_at: "desc" },
  });
}

export async function findCampById(campId: number) {
  return prisma.camps.findUnique({ where: { id_camp: campId } });
}

export async function findFoodAndWaterResourceIds() {
  const resources = await prisma.resources.findMany({
    where: { rss_is_active: true },
    include: { resource_types: true },
    orderBy: { id_resource: "asc" },
  });

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  const foodResource = resources.find((r: (typeof resources)[number]) =>
    normalize(r.rss_name).includes("comida") ||
    normalize(r.rss_name).includes("food") ||
    normalize(r.rss_name).includes("aliment"),
  );

 const waterResource = resources.find((r: (typeof resources)[number]) =>
    normalize(r.rss_name).includes("agua") ||
    normalize(r.rss_name).includes("water"),
  );

  return {
    foodResourceId: foodResource?.id_resource ?? null,
    waterResourceId: waterResource?.id_resource ?? null,
  };
}

export async function findRationPerPersonSetting(): Promise<number> {
  const setting = await prisma.system_settings.findUnique({
    where: { sts_key: "daily_ration_per_person" },
  });

  if (!setting) return 1;

  const parsed = Number.parseFloat(setting.sts_value);
  return Number.isNaN(parsed) ? 1 : parsed;
}

export async function findPersonsOutOfCamp(campId: number): Promise<Set<number>> {
  const [expeditionPersons, transferPersons] = await prisma.$transaction([
    prisma.expedition_records.findMany({
      where: {
        expeditions: { id_camp: campId, exe_state: { in: ["in_progress"] } },
        exr_departure_confirmed: true,
        exr_return_confirmed: false,
      },
      select: { id_person: true },
    }),
    prisma.application_admission_person.findMany({
      where: {
        transfers: {
          id_origin_camp: campId,
          tfs_state: { in: ["in_transit", "scheduled"] },
        },
        aap_departure_confirmed: true,
        aap_arrival_confirmed: false,
        aap_returned_to_origin: false,
      },
      select: { id_person: true },
    }),
  ]);

  const ids = new Set<number>();
  for (const r of expeditionPersons) ids.add(r.id_person);
  for (const r of transferPersons) ids.add(r.id_person);
  return ids;
}

export type WorkablePerson = Awaited<ReturnType<typeof findWorkablePersons>>[number];
export type RationableStorageRecord = Awaited<ReturnType<typeof findRationableStorage>>[number];

// ─── Write operations ─────────────────────────────────────────────────────────

export async function applyPersonProduction(
  tx: Prisma.TransactionClient,
  input: {
    campId: number;
    personId: number;
    actorUserId: number;
    foodResourceId: number;
    waterResourceId: number | null;
    foodAmount: number;
    waterAmount: number;
    now: Date;
  },
) {
  const entries: [number, number][] = [];

  if (input.foodAmount > 0 && input.foodResourceId) {
    entries.push([input.foodResourceId, input.foodAmount]);
  }

  if (input.waterAmount > 0 && input.waterResourceId) {
    entries.push([input.waterResourceId, input.waterAmount]);
  }

  for (const [resourceId, delta] of entries) {
    const existing = await tx.storage.findFirst({
      where: { id_camp: input.campId, id_resource: resourceId },
    });

    const previousQty = existing ? Number(existing.stg_quantity) : 0;
    const newQty = Number((previousQty + delta).toFixed(2));

    const storage = existing
      ? await tx.storage.update({
          where: { id_storage: existing.id_storage },
          data: { stg_quantity: newQty, stg_last_updated_at: input.now },
        })
      : await tx.storage.create({
          data: {
            id_camp: input.campId,
            id_resource: resourceId,
            stg_quantity: newQty,
            stg_min_quantity: 0,
            stg_last_updated_at: input.now,
          },
        });

    const isBelowMinimum = newQty < Number(storage.stg_min_quantity);

    await tx.storage_records.create({
      data: {
        id_storage: storage.id_storage,
        id_user: input.actorUserId,
        str_previous_quantity: previousQty,
        str_new_quantity: newQty,
        str_reason: `Daily production by person #${input.personId}`,
        str_is_below_minimum: isBelowMinimum,
        str_recorded_at: input.now,
      },
    });

    await tx.resources_movements.create({
      data: {
        id_resource: resourceId,
        id_camp: input.campId,
        id_user: input.actorUserId,
        id_person: input.personId,
        rsm_type: "daily_production",
        rsm_quantity: delta,
        rsm_reason_for_movement: "Daily production",
        rsm_reference_type: "person",
        rsm_movement_date: input.now,
      },
    });
  }
}

export async function applyDailyRations(
  tx: Prisma.TransactionClient,
  input: {
    campId: number;
    actorUserId: number;
    eligiblePersonCount: number;
    rationableStorage: RationableStorageRecord[];
    rationPerPerson: number;
    now: Date;
  },
) {
  const results: {
    resourceId: number;
    resourceName: string;
    rationPerPerson: number;
    totalConsumed: number;
    stockBefore: number;
    stockAfter: number;
    isBelowMinimum: boolean;
  }[] = [];

  for (const storageRecord of input.rationableStorage) {
    const totalConsumed = Number(
      (input.rationPerPerson * input.eligiblePersonCount).toFixed(2),
    );

    const stockBefore = Number(storageRecord.stg_quantity);
    const stockAfter = Number((stockBefore - totalConsumed).toFixed(2));
    const minQuantity = Number(storageRecord.stg_min_quantity);
    const isBelowMinimum = stockAfter < minQuantity;

    await tx.storage.update({
      where: { id_storage: storageRecord.id_storage },
      data: { stg_quantity: stockAfter, stg_last_updated_at: input.now },
    });

    await tx.storage_records.create({
      data: {
        id_storage: storageRecord.id_storage,
        id_user: input.actorUserId,
        str_previous_quantity: stockBefore,
        str_new_quantity: stockAfter,
        str_reason: `Daily rations for ${input.eligiblePersonCount} person(s)`,
        str_is_below_minimum: isBelowMinimum,
        str_recorded_at: input.now,
      },
    });

    await tx.resources_movements.create({
      data: {
        id_resource: storageRecord.id_resource,
        id_camp: input.campId,
        id_user: input.actorUserId,
        rsm_type: "ration",
        rsm_quantity: -totalConsumed,
        rsm_reason_for_movement: `Daily ration (${input.eligiblePersonCount} persons × ${input.rationPerPerson})`,
        rsm_reference_type: "system",
        rsm_movement_date: input.now,
      },
    });

    results.push({
      resourceId: storageRecord.id_resource,
      resourceName: storageRecord.resources.rss_name,
      rationPerPerson: input.rationPerPerson,
      totalConsumed,
      stockBefore,
      stockAfter,
      isBelowMinimum,
    });
  }

  return results;
}

export async function writeDailyProcessEvent(
  tx: Prisma.TransactionClient,
  input: {
    campId: number;
    actorUserId: number;
    summary: object;
    now: Date;
  },
) {
  return tx.events.create({
    data: {
      id_user: input.actorUserId,
      id_camp: input.campId,
      evt_entity: "daily_process",
      evt_action: "run",
      evt_new_value: input.summary as Prisma.InputJsonValue,
      evt_description: "Automatic daily process: production + rations",
      evt_created_at: input.now,
    },
  });
}