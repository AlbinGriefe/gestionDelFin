import type { Prisma } from "../../generated/prisma/client.js";
import { randomUUID } from "node:crypto";
import { canAccessCamp, isAdministratorRole } from "../../shared/auth/roles.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { generateInitialStats } from "./person-stats.js";
import {
  personsRepository,
  type PersonDetailRecord,
  type PersonSummaryRecord,
} from "./persons.repository.js";
import { DEFAULT_PROFILE_TEMPLATES } from "./profile-templates.js";
import type {
  PersonAuditEventInput,
  PersonDetail,
  PersonListFilters,
  PersonsCatalogs,
  PersonStatsSummary,
  PersonSummary,
  PersonWriteInput,
} from "./persons.types.js";

function ensureSystemAdministrator(actor: AuthenticatedUser) {
  if (!isAdministratorRole(actor.roleName)) {
    throw new AppError(
      403,
      "Only system administrators can manage people.",
      "PERSONS_ADMIN_REQUIRED",
    );
  }
}

function resolveCampFilter(
  filters: PersonListFilters,
  actor: AuthenticatedUser,
) {
  const requestedCampId = filters.campId ?? actor.campId;

  if (!canAccessCamp(actor, requestedCampId)) {
    throw new AppError(
      403,
      "Person is outside your camp.",
      "PERSONS_FORBIDDEN",
    );
  }

  return requestedCampId;
}

function toIsoDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function buildFullName(name: string, lastname: string) {
  return `${name} ${lastname}`.trim();
}

function mapStats(
  stats: PersonSummaryRecord["person_stats"],
): PersonStatsSummary | null {
  if (!stats) return null;
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

function serializePersonState(input: {
  id_camp: number;
  id_profession: number | null;
  id_person_health: number | null;
  id_profile_template: number | null;
  prn_name: string;
  prn_lastname: string;
  prn_identifier: string;
  prn_birth_date: Date | null;
  prn_document_number: string | null;
  prn_profile_description: string;
  prn_admission_status: string;
  prn_is_active: boolean;
  prn_admission_notes: string | null;
}) {
  return {
    ...input,
    prn_birth_date: toIsoDateOnly(input.prn_birth_date),
  };
}

function mapPersonSummary(record: PersonSummaryRecord): PersonSummary {
  return {
    id: record.id_person,
    identifier: record.prn_identifier,
    fullName: buildFullName(record.prn_name, record.prn_lastname),
    camp: {
      id: record.camps.id_camp,
      name: record.camps.cmp_name,
      status: record.camps.cmp_status,
    },
    profession: record.professions
      ? {
          id: record.professions.id_profession,
          name: record.professions.pfs_name,
          description: record.professions.pfs_description,
        }
      : null,
    healthStatus: record.person_health
      ? {
          id: record.person_health.id_person_health,
          name: record.person_health.phs_name,
          canWork: record.person_health.phs_can_work,
          isTerminal: record.person_health.phs_is_terminal,
        }
      : null,
    stats: mapStats(record.person_stats),
    profileDescription: record.prn_profile_description,
    profileTemplateId: record.id_profile_template,
    admissionStatus: record.prn_admission_status,
    isAccepted: record.prn_admission_status === "accepted",
    birthDate: toIsoDateOnly(record.prn_birth_date),
    documentNumber: record.prn_document_number,
    isActive: record.prn_is_active,
    admissionNotes: record.prn_admission_notes,
    linkedUsersCount: record._count.users,
    historyEntriesCount: record._count.person_records,
    createdAt: record.prn_created_at.toISOString(),
    updatedAt: record.prn_updated_at.toISOString(),
  };
}

function mapPersonDetail(record: PersonDetailRecord): PersonDetail {
  const currentHealthRecord = record.person_health_records[0] ?? null;
  return {
    ...mapPersonSummary(record),
    users: record.users.map((user) => ({
      id: user.id_user,
      username: user.usr_username,
      email: user.usr_email,
      isActive: user.usr_is_active,
      roleId: user.id_role,
    })),
    currentHealthRecord: currentHealthRecord
      ? {
          id: currentHealthRecord.id_person_health_record,
          startDate: currentHealthRecord.phr_start_date.toISOString(),
          endDate: currentHealthRecord.phr_end_date?.toISOString() ?? null,
          notes: currentHealthRecord.phr_notes,
          recordedBy: currentHealthRecord.users
            ? {
                id: currentHealthRecord.users.id_user,
                username: currentHealthRecord.users.usr_username,
              }
            : null,
        }
      : null,
    recentHistory: record.person_records.map((entry) => ({
      id: entry.id_person_record,
      eventType: entry.prr_event_type,
      notes: entry.prr_notes,
      createdAt: entry.prr_created_at.toISOString(),
      user: entry.users
        ? { id: entry.users.id_user, username: entry.users.usr_username }
        : null,
      oldValue: entry.prr_old_value,
      newValue: entry.prr_new_value,
    })),
  };
}

export class PersonsService {
  async getCatalogs(): Promise<PersonsCatalogs> {
    const result = await personsRepository.listCatalogs();
    return {
      camps: result.camps.map((camp) => ({
        id: camp.id_camp,
        name: camp.cmp_name,
        location: camp.cmp_location,
        status: camp.cmp_status,
      })),
      professions: result.professions.map((profession) => ({
        id: profession.id_profession,
        name: profession.pfs_name,
        description: profession.pfs_description,
        campId: profession.id_camp,
        isActive: profession.pfs_is_active,
      })),
      healthStatuses: result.healthStatuses.map((status) => ({
        id: status.id_person_health,
        name: status.phs_name,
        description: status.phs_description,
        canWork: status.phs_can_work,
        isTerminal: status.phs_is_terminal,
        isActiveStatus: status.phs_is_active_status,
      })),
    };
  }

  async listPersons(filters: PersonListFilters, actor: AuthenticatedUser) {
    const resolvedCampId = resolveCampFilter(filters, actor);
    const search = filters.search?.trim();
    const admissionStatus =
      filters.admissionStatus ??
      (filters.accepted === true ? "accepted" : undefined);

    const where: Prisma.personsWhereInput = {
      id_camp: resolvedCampId,
      ...(filters.professionId ? { id_profession: filters.professionId } : {}),
      ...(filters.healthId ? { id_person_health: filters.healthId } : {}),
      ...(admissionStatus
        ? { prn_admission_status: admissionStatus }
        : filters.accepted === false
          ? { prn_admission_status: { not: "accepted" } }
          : {}),
      ...(filters.active !== undefined
        ? { prn_is_active: filters.active }
        : {}),
      ...(search
        ? {
            OR: [
              { prn_name: { contains: search } },
              { prn_lastname: { contains: search } },
              { prn_document_number: { contains: search } },
              { prn_profile_description: { contains: search } },
            ],
          }
        : {}),
    };

    const result = await personsRepository.listPersons({
      where,
      filters: { ...filters, campId: resolvedCampId },
    });

    return {
      items: result.items.map(mapPersonSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: { ...filters, campId: resolvedCampId, search },
    };
  }

  async getPersonById(personId: number, actor: AuthenticatedUser) {
    const person = await personsRepository.findPersonById(personId);
    if (!person) {
      throw new AppError(404, "Person not found.", "PERSON_NOT_FOUND");
    }
    if (!canAccessCamp(actor, person.id_camp)) {
      throw new AppError(
        403,
        "Person is outside your camp.",
        "PERSONS_FORBIDDEN",
      );
    }
    return mapPersonDetail(person);
  }

  private async resolveProfile(inputDescription?: string | null) {
    if (inputDescription?.trim()) {
      return {
        description: inputDescription.trim(),
        templateId: null,
      };
    }

    const templates = await personsRepository.listActiveProfileTemplates();
    if (templates.length > 0) {
      const selected = templates[Math.floor(Math.random() * templates.length)]!;
      return {
        description: selected.pft_description,
        templateId: selected.id_profile_template,
      };
    }

    const fallback =
      DEFAULT_PROFILE_TEMPLATES[
        Math.floor(Math.random() * DEFAULT_PROFILE_TEMPLATES.length)
      ]!;
    return { description: fallback.description, templateId: null };
  }

  async createPerson(input: PersonWriteInput, actor: AuthenticatedUser) {
    ensureSystemAdministrator(actor);
    const campId = input.id_camp ?? actor.campId;
    if (!canAccessCamp(actor, campId)) {
      throw new AppError(
        403,
        "Person is outside your camp.",
        "PERSONS_FORBIDDEN",
      );
    }
    const camp = await personsRepository.findCampById(campId);
    if (!camp)
      throw new AppError(404, "Camp not found.", "PERSON_CAMP_NOT_FOUND");
    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "People can only be registered in active camps.",
        "PERSON_INVALID_CAMP_STATUS",
      );
    }

    let healthStatusId: number | null = null;
    if (input.id_person_health) {
      const health = await personsRepository.findHealthStatusById(
        input.id_person_health,
      );
      if (!health || !health.phs_is_active_status) {
        throw new AppError(
          400,
          "Health status is missing or inactive.",
          "PERSON_HEALTH_STATUS_INVALID",
        );
      }
      healthStatusId = health.id_person_health;
    }

    const profile = await this.resolveProfile(input.prn_profile_description);
    const stats = generateInitialStats();
    const data = {
      id_camp: campId,
      id_profession: null,
      id_person_health: healthStatusId,
      id_profile_template: profile.templateId,
      prn_name: input.prn_name?.trim() ?? "",
      prn_lastname: input.prn_lastname?.trim() ?? "",
      prn_identifier: `CMP${campId}-${randomUUID().slice(0, 8).toUpperCase()}`,
      prn_birth_date: input.prn_birth_date ?? null,
      prn_document_number: input.prn_document_number ?? null,
      prn_profile_description: profile.description,
      prn_admission_status: "pending" as const,
      prn_is_active: input.prn_is_active ?? true,
      prn_admission_notes: input.prn_admission_notes?.trim() || null,
    };

    const auditEvents: PersonAuditEventInput[] = [
      {
        eventType: "created",
        userId: actor.id,
        notes: "Person registered as pending admission.",
        newValue: {
          ...serializePersonState(data),
          stats,
        },
      },
    ];

    const created = await personsRepository.createPerson({
      data,
      stats,
      healthRecord: healthStatusId
        ? {
            id_person_health: healthStatusId,
            phr_notes: data.prn_admission_notes,
            phr_recorded_by_user_id: actor.id,
          }
        : undefined,
      auditEvents,
    });
    return mapPersonDetail(created);
  }

  async updatePerson(
    personId: number,
    input: PersonWriteInput,
    actor: AuthenticatedUser,
  ) {
    ensureSystemAdministrator(actor);
    const existing = await personsRepository.findPersonById(personId);
    if (!existing) {
      throw new AppError(404, "Person not found.", "PERSON_NOT_FOUND");
    }
    if (!canAccessCamp(actor, existing.id_camp)) {
      throw new AppError(
        403,
        "Person is outside your camp.",
        "PERSONS_FORBIDDEN",
      );
    }

    const nextCampId = input.id_camp ?? existing.id_camp;
    if (!canAccessCamp(actor, nextCampId)) {
      throw new AppError(
        403,
        "Person is outside your camp.",
        "PERSONS_FORBIDDEN",
      );
    }
    const camp = await personsRepository.findCampById(nextCampId);
    if (!camp || camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "Target camp is missing or inactive.",
        "PERSON_INVALID_CAMP_STATUS",
      );
    }

    let nextHealthId = existing.id_person_health;
    if (input.id_person_health !== undefined) {
      if (input.id_person_health === null) {
        nextHealthId = null;
      } else {
        const health = await personsRepository.findHealthStatusById(
          input.id_person_health,
        );
        if (!health || !health.phs_is_active_status) {
          throw new AppError(
            400,
            "Health status is missing or inactive.",
            "PERSON_HEALTH_STATUS_INVALID",
          );
        }
        nextHealthId = health.id_person_health;
      }
    }

    const profile =
      input.prn_profile_description === undefined
        ? {
            description: existing.prn_profile_description,
            templateId: existing.id_profile_template,
          }
        : await this.resolveProfile(input.prn_profile_description);

    const nextState = {
      id_camp: nextCampId,
      id_profession: existing.id_profession,
      id_person_health: nextHealthId,
      id_profile_template: profile.templateId,
      prn_name: input.prn_name?.trim() ?? existing.prn_name,
      prn_lastname: input.prn_lastname?.trim() ?? existing.prn_lastname,
      prn_identifier: existing.prn_identifier,
      prn_birth_date:
        input.prn_birth_date !== undefined
          ? input.prn_birth_date
          : existing.prn_birth_date,
      prn_document_number:
        input.prn_document_number !== undefined
          ? input.prn_document_number
          : existing.prn_document_number,
      prn_profile_description: profile.description,
      prn_admission_status: existing.prn_admission_status,
      prn_is_active: input.prn_is_active ?? existing.prn_is_active,
      prn_admission_notes:
        input.prn_admission_notes !== undefined
          ? input.prn_admission_notes?.trim() || null
          : existing.prn_admission_notes,
    };

    const previous = serializePersonState(existing);
    const next = serializePersonState(nextState);
    const data: Prisma.personsUncheckedUpdateInput = {};
    for (const [key, value] of Object.entries(nextState)) {
      const before = existing[key as keyof typeof existing];
      const normalizedBefore =
        before instanceof Date ? before.toISOString() : before;
      const normalizedAfter =
        value instanceof Date ? value.toISOString() : value;
      if (normalizedBefore !== normalizedAfter) {
        (data as Record<string, unknown>)[key] = value;
      }
    }

    const healthChanged = existing.id_person_health !== nextHealthId;
    const auditEvents: PersonAuditEventInput[] = [];
    if (Object.keys(data).length > 0) {
      auditEvents.push({
        eventType: "updated",
        userId: actor.id,
        notes: "Person profile updated.",
        oldValue: previous,
        newValue: next,
      });
    }
    if (healthChanged) {
      auditEvents.push({
        eventType: "health_changed",
        userId: actor.id,
        oldValue: { id_person_health: existing.id_person_health },
        newValue: { id_person_health: nextHealthId },
      });
    }

    const updated = await personsRepository.updatePerson({
      personId,
      campId: nextCampId,
      data,
      closeCurrentHealthRecord: healthChanged,
      newHealthRecord:
        healthChanged && nextHealthId
          ? {
              id_person_health: nextHealthId,
              phr_notes: nextState.prn_admission_notes,
              phr_recorded_by_user_id: actor.id,
            }
          : undefined,
      auditEvents,
    });
    return mapPersonDetail(updated);
  }
}

export const personsService = new PersonsService();
