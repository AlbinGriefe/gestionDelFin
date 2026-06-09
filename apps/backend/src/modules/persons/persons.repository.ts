import prisma, { Prisma } from "../../lib/prisma.js";
import type {
  PersonAuditEventInput,
  PersonHealthRecordInput,
  PersonListFilters,
  PersonStatsSummary,
} from "./persons.types.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

const personSummaryInclude = {
  camps: true,
  professions: true,
  person_health: true,
  person_stats: true,
  profile_templates: true,
  _count: {
    select: {
      users: true,
      person_records: true,
    },
  },
} satisfies Prisma.personsInclude;

const personDetailInclude = {
  ...personSummaryInclude,
  users: {
    select: {
      id_user: true,
      usr_username: true,
      usr_email: true,
      usr_is_active: true,
      id_role: true,
    },
  },
  person_health_records: {
    where: { phr_is_current: true },
    take: 1,
    orderBy: { phr_start_date: "desc" },
    include: {
      person_health: true,
      users: {
        select: {
          id_user: true,
          usr_username: true,
        },
      },
    },
  },
  person_records: {
    take: 10,
    orderBy: { prr_created_at: "desc" },
    include: {
      users: {
        select: {
          id_user: true,
          usr_username: true,
        },
      },
    },
  },
} satisfies Prisma.personsInclude;

export type PersonSummaryRecord = Prisma.personsGetPayload<{
  include: typeof personSummaryInclude;
}>;

export type PersonDetailRecord = Prisma.personsGetPayload<{
  include: typeof personDetailInclude;
}>;

async function writeAuditEvents(
  tx: Prisma.TransactionClient,
  input: {
    personId: number;
    campId: number;
    events: PersonAuditEventInput[];
  },
) {
  for (const event of input.events) {
    await tx.person_records.create({
      data: {
        id_person: input.personId,
        id_user: event.userId ?? null,
        prr_event_type: event.eventType,
        prr_notes: event.notes ?? null,
        prr_old_value: toPrismaJsonValue(event.oldValue),
        prr_new_value: toPrismaJsonValue(event.newValue),
      },
    });

    await tx.events.create({
      data: {
        id_user: event.userId ?? null,
        id_camp: input.campId,
        evt_entity: "persons",
        evt_entity_id: input.personId,
        evt_action: event.eventType,
        evt_old_value: toPrismaJsonValue(event.oldValue),
        evt_new_value: toPrismaJsonValue(event.newValue),
        evt_description: event.notes ?? null,
      },
    });
  }
}

export class PersonsRepository {
  async listCatalogs() {
    const [camps, professions, healthStatuses] = await prisma.$transaction([
      prisma.camps.findMany({ orderBy: { cmp_name: "asc" } }),
      prisma.professions.findMany({
        where: { pfs_is_active: true },
        orderBy: { pfs_name: "asc" },
      }),
      prisma.person_health.findMany({
        where: { phs_is_active_status: true },
        orderBy: { phs_name: "asc" },
      }),
    ]);

    return { camps, professions, healthStatuses };
  }

  async listActiveProfileTemplates() {
    return prisma.profile_templates.findMany({
      where: { pft_is_active: true },
      orderBy: { id_profile_template: "asc" },
    });
  }

  async listPersons(input: {
    where: Prisma.personsWhereInput;
    filters: PersonListFilters;
  }) {
    const skip = (input.filters.page - 1) * input.filters.pageSize;
    const [items, total] = await prisma.$transaction([
      prisma.persons.findMany({
        where: input.where,
        skip,
        take: input.filters.pageSize,
        orderBy: [{ prn_lastname: "asc" }, { prn_name: "asc" }],
        include: personSummaryInclude,
      }),
      prisma.persons.count({ where: input.where }),
    ]);

    return { items, total };
  }

  async findPersonById(personId: number) {
    return prisma.persons.findUnique({
      where: { id_person: personId },
      include: personDetailInclude,
    });
  }

  async findCampById(campId: number) {
    return prisma.camps.findUnique({
      where: { id_camp: campId },
      include: { camp_operational_rules: true },
    });
  }

  async findHealthStatusById(healthId: number) {
    return prisma.person_health.findUnique({
      where: { id_person_health: healthId },
    });
  }

  async createPerson(input: {
    data: Prisma.personsUncheckedCreateInput;
    stats: PersonStatsSummary;
    healthRecord?: PersonHealthRecordInput;
    auditEvents: PersonAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      const person = await tx.persons.create({ data: input.data });

      await tx.person_stats.create({
        data: {
          id_person: person.id_person,
          pst_health: input.stats.health,
          pst_max_health: input.stats.maxHealth,
          pst_strength: input.stats.strength,
          pst_satiety: input.stats.satiety,
          pst_hydration: input.stats.hydration,
          pst_luck: input.stats.luck,
          pst_level: input.stats.level,
        },
      });

      if (input.healthRecord) {
        await tx.person_health_records.create({
          data: {
            id_person: person.id_person,
            id_person_health: input.healthRecord.id_person_health,
            phr_notes: input.healthRecord.phr_notes ?? null,
            phr_recorded_by_user_id:
              input.healthRecord.phr_recorded_by_user_id ?? null,
            phr_is_current: true,
          },
        });
      }

      await writeAuditEvents(tx, {
        personId: person.id_person,
        campId: person.id_camp,
        events: input.auditEvents,
      });

      return tx.persons.findUniqueOrThrow({
        where: { id_person: person.id_person },
        include: personDetailInclude,
      });
    });
  }

  async updatePerson(input: {
    personId: number;
    campId: number;
    data: Prisma.personsUncheckedUpdateInput;
    closeCurrentHealthRecord: boolean;
    newHealthRecord?: PersonHealthRecordInput;
    auditEvents: PersonAuditEventInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      if (Object.keys(input.data).length > 0) {
        await tx.persons.update({
          where: { id_person: input.personId },
          data: input.data,
        });
      }

      if (input.closeCurrentHealthRecord) {
        await tx.person_health_records.updateMany({
          where: {
            id_person: input.personId,
            phr_is_current: true,
          },
          data: {
            phr_is_current: false,
            phr_end_date: new Date(),
          },
        });
      }

      if (input.newHealthRecord) {
        await tx.person_health_records.create({
          data: {
            id_person: input.personId,
            id_person_health: input.newHealthRecord.id_person_health,
            phr_notes: input.newHealthRecord.phr_notes ?? null,
            phr_recorded_by_user_id:
              input.newHealthRecord.phr_recorded_by_user_id ?? null,
            phr_is_current: true,
          },
        });
      }

      await writeAuditEvents(tx, {
        personId: input.personId,
        campId: input.campId,
        events: input.auditEvents,
      });

      return tx.persons.findUniqueOrThrow({
        where: { id_person: input.personId },
        include: personDetailInclude,
      });
    });
  }
}

export const personsRepository = new PersonsRepository();
