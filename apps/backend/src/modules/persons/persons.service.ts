import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  personsRepository,
  type PersonDetailRecord,
  type PersonSummaryRecord,
} from "./persons.repository.js";
import type {
  PersonAuditEventInput,
  PersonDetail,
  PersonListFilters,
  PersonsCatalogs,
  PersonSummary,
  PersonWriteInput,
} from "./persons.types.js";

function isSystemAdministrator(user: AuthenticatedUser) {
  return user.roleName.trim().toLocaleLowerCase() === "administrador sistema";
}

function ensureCampScope(actor: AuthenticatedUser, targetCampId: number) {
  if (isSystemAdministrator(actor)) {
    return;
  }

  if (actor.campId !== targetCampId) {
    throw new AppError(
      403,
      "You can only access people from your assigned camp.",
      "PERSONS_FORBIDDEN_CAMP_SCOPE",
    );
  }
}

function toIsoDateOnly(value: Date | null | undefined) {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

function buildFullName(name: string, lastname: string) {
  return `${name} ${lastname}`.trim();
}

function buildNotes(admissionNotes?: string | null) {
  return admissionNotes?.trim() || null;
}

function serializePersonState(input: {
  id_camp: number;
  id_profession: number;
  id_person_health: number | null;
  prn_name: string;
  prn_lastname: string;
  prn_birth_date: Date | null;
  prn_document_number: string | null;
  prn_photo_url: string | null;
  prn_identification_card_url: string | null;
  prn_is_accepted: boolean;
  prn_is_active: boolean;
  prn_admission_notes: string | null;
}) {
  return {
    id_camp: input.id_camp,
    id_profession: input.id_profession,
    id_person_health: input.id_person_health,
    prn_name: input.prn_name,
    prn_lastname: input.prn_lastname,
    prn_birth_date: toIsoDateOnly(input.prn_birth_date),
    prn_document_number: input.prn_document_number,
    prn_photo_url: input.prn_photo_url,
    prn_identification_card_url: input.prn_identification_card_url,
    prn_is_accepted: input.prn_is_accepted,
    prn_is_active: input.prn_is_active,
    prn_admission_notes: input.prn_admission_notes,
  };
}

function mapPersonSummary(record: PersonSummaryRecord): PersonSummary {
  return {
    id: record.id_person,
    fullName: buildFullName(record.prn_name, record.prn_lastname),
    camp: {
      id: record.camps.id_camp,
      name: record.camps.cmp_name,
      status: record.camps.cmp_status,
    },
    profession: {
      id: record.professions.id_profession,
      name: record.professions.pfs_name,
      description: record.professions.pfs_description,
    },
    healthStatus: record.person_health
      ? {
          id: record.person_health.id_person_health,
          name: record.person_health.phs_name,
          canWork: record.person_health.phs_can_work,
          isTerminal: record.person_health.phs_is_terminal,
        }
      : null,
    birthDate: toIsoDateOnly(record.prn_birth_date),
    documentNumber: record.prn_document_number,
    photoUrl: record.prn_photo_url,
    identificationCardUrl: record.prn_identification_card_url,
    isAccepted: record.prn_is_accepted,
    isActive: record.prn_is_active,
    admissionNotes: record.prn_admission_notes,
    linkedUsersCount: record._count.users,
    historyEntriesCount: record._count.person_records,
    createdAt: record.prn_created_at.toISOString(),
    updatedAt: record.prn_updated_at.toISOString(),
  };
}

function mapPersonDetail(record: PersonDetailRecord): PersonDetail {
  const summary = mapPersonSummary(record);
  const currentHealthRecord = record.person_health_records[0] ?? null;

  return {
    ...summary,
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
    recentHistory: record.person_records.map((historyEntry) => ({
      id: historyEntry.id_person_record,
      eventType: historyEntry.prr_event_type,
      notes: historyEntry.prr_notes,
      createdAt: historyEntry.prr_created_at.toISOString(),
      user: historyEntry.users
        ? {
            id: historyEntry.users.id_user,
            username: historyEntry.users.usr_username,
          }
        : null,
      oldValue: historyEntry.prr_old_value,
      newValue: historyEntry.prr_new_value,
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
      healthStatuses: result.healthStatuses.map((healthStatus) => ({
        id: healthStatus.id_person_health,
        name: healthStatus.phs_name,
        description: healthStatus.phs_description,
        canWork: healthStatus.phs_can_work,
        isTerminal: healthStatus.phs_is_terminal,
        isActiveStatus: healthStatus.phs_is_active_status,
      })),
    };
  }

  async listPersons(filters: PersonListFilters, actor: AuthenticatedUser) {
    if (filters.campId) {
      ensureCampScope(actor, filters.campId);
    }

    const resolvedCampId = filters.campId ?? actor.campId;
    const search = filters.search?.trim();
    const searchConditions = search
      ? [
          { prn_name: { contains: search } },
          { prn_lastname: { contains: search } },
          { prn_document_number: { contains: search } },
        ]
      : [];

    const where = {
      id_camp: resolvedCampId,
      ...(filters.professionId ? { id_profession: filters.professionId } : {}),
      ...(filters.healthId ? { id_person_health: filters.healthId } : {}),
      ...(filters.accepted !== undefined
        ? { prn_is_accepted: filters.accepted }
        : {}),
      ...(filters.active !== undefined ? { prn_is_active: filters.active } : {}),
      ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
    };

    const result = await personsRepository.listPersons({
      where,
      filters: {
        ...filters,
        campId: resolvedCampId,
      },
    });

    return {
      items: result.items.map(mapPersonSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: {
        ...filters,
        campId: resolvedCampId,
        search,
      },
    };
  }

  async getPersonById(personId: number, actor: AuthenticatedUser): Promise<PersonDetail> {
    const person = await personsRepository.findPersonById(personId);

    if (!person) {
      throw new AppError(404, "Person not found.", "PERSON_NOT_FOUND");
    }

    ensureCampScope(actor, person.id_camp);

    return mapPersonDetail(person);
  }

  async createPerson(input: PersonWriteInput, actor: AuthenticatedUser) {
    const campId = input.id_camp ?? actor.campId;
    ensureCampScope(actor, campId);

    const camp = await personsRepository.findCampById(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "PERSON_CAMP_NOT_FOUND");
    }

    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "People can only be assigned to active camps.",
        "PERSON_INVALID_CAMP_STATUS",
      );
    }

    if (!input.id_profession) {
      throw new AppError(
        400,
        "A profession is required to create a person.",
        "PERSON_PROFESSION_REQUIRED",
      );
    }

    const profession = await personsRepository.findProfessionById(
      input.id_profession,
    );

    if (!profession) {
      throw new AppError(
        404,
        "Profession not found.",
        "PERSON_PROFESSION_NOT_FOUND",
      );
    }

    if (!profession.pfs_is_active) {
      throw new AppError(
        400,
        "The selected profession is not active.",
        "PERSON_PROFESSION_INACTIVE",
      );
    }

    if (profession.id_camp !== null && profession.id_camp !== campId) {
      throw new AppError(
        400,
        "The selected profession does not belong to the target camp.",
        "PERSON_INVALID_PROFESSION_CAMP",
      );
    }

    let healthStatusId: number | null = null;

    if (input.id_person_health !== undefined && input.id_person_health !== null) {
      const healthStatus = await personsRepository.findHealthStatusById(
        input.id_person_health,
      );

      if (!healthStatus) {
        throw new AppError(
          404,
          "Health status not found.",
          "PERSON_HEALTH_STATUS_NOT_FOUND",
        );
      }

      if (!healthStatus.phs_is_active_status) {
        throw new AppError(
          400,
          "The selected health status is not active.",
          "PERSON_HEALTH_STATUS_INACTIVE",
        );
      }

      healthStatusId = healthStatus.id_person_health;
    }

    const personData = {
      id_camp: campId,
      id_profession: profession.id_profession,
      id_person_health: healthStatusId,
      prn_name: input.prn_name?.trim() ?? "",
      prn_lastname: input.prn_lastname?.trim() ?? "",
      prn_birth_date: input.prn_birth_date ?? null,
      prn_document_number: input.prn_document_number ?? null,
      prn_photo_url: input.prn_photo_url ?? null,
      prn_identification_card_url: input.prn_identification_card_url ?? null,
      prn_is_accepted: input.prn_is_accepted ?? false,
      prn_is_active: input.prn_is_active ?? true,
      prn_admission_notes: buildNotes(input.prn_admission_notes),
    };

    const actorUserId = actor.id;
    const auditEvents: PersonAuditEventInput[] = [
      {
        eventType: "created",
        userId: actorUserId,
        notes: "Person created.",
        newValue: serializePersonState(personData),
      },
    ];

    if (personData.prn_is_accepted) {
      auditEvents.push({
        eventType: "accepted",
        userId: actorUserId,
        notes: personData.prn_admission_notes,
        newValue: {
          prn_is_accepted: true,
        },
      });
    }

    if (!personData.prn_is_active) {
      auditEvents.push({
        eventType: "inactivated",
        userId: actorUserId,
        notes: "Person created as inactive.",
        newValue: {
          prn_is_active: false,
        },
      });
    }

    if (healthStatusId) {
      auditEvents.push({
        eventType: "health_changed",
        userId: actorUserId,
        notes: "Initial health status assigned.",
        newValue: {
          id_person_health: healthStatusId,
        },
      });
    }

    const createdPerson = await personsRepository.createPerson({
      data: personData,
      healthRecord: healthStatusId
        ? {
            id_person_health: healthStatusId,
            phr_notes: personData.prn_admission_notes,
            phr_recorded_by_user_id: actorUserId,
          }
        : undefined,
      auditEvents,
    });

    return mapPersonDetail(createdPerson);
  }

  async updatePerson(
    personId: number,
    input: PersonWriteInput,
    actor: AuthenticatedUser,
  ) {
    const existingPerson = await personsRepository.findPersonById(personId);

    if (!existingPerson) {
      throw new AppError(404, "Person not found.", "PERSON_NOT_FOUND");
    }

    ensureCampScope(actor, existingPerson.id_camp);

    const nextCampId = input.id_camp ?? existingPerson.id_camp;
    ensureCampScope(actor, nextCampId);

    const camp = await personsRepository.findCampById(nextCampId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "PERSON_CAMP_NOT_FOUND");
    }

    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "People can only be assigned to active camps.",
        "PERSON_INVALID_CAMP_STATUS",
      );
    }

    const nextProfessionId = input.id_profession ?? existingPerson.id_profession;
    const profession = await personsRepository.findProfessionById(nextProfessionId);

    if (!profession) {
      throw new AppError(
        404,
        "Profession not found.",
        "PERSON_PROFESSION_NOT_FOUND",
      );
    }

    if (!profession.pfs_is_active) {
      throw new AppError(
        400,
        "The selected profession is not active.",
        "PERSON_PROFESSION_INACTIVE",
      );
    }

    if (profession.id_camp !== null && profession.id_camp !== nextCampId) {
      throw new AppError(
        400,
        "The selected profession does not belong to the target camp.",
        "PERSON_INVALID_PROFESSION_CAMP",
      );
    }

    let nextHealthId = existingPerson.id_person_health;

    if (input.id_person_health !== undefined) {
      if (input.id_person_health === null) {
        nextHealthId = null;
      } else {
        const healthStatus = await personsRepository.findHealthStatusById(
          input.id_person_health,
        );

        if (!healthStatus) {
          throw new AppError(
            404,
            "Health status not found.",
            "PERSON_HEALTH_STATUS_NOT_FOUND",
          );
        }

        if (!healthStatus.phs_is_active_status) {
          throw new AppError(
            400,
            "The selected health status is not active.",
            "PERSON_HEALTH_STATUS_INACTIVE",
          );
        }

        nextHealthId = healthStatus.id_person_health;
      }
    }

    const nextState = {
      id_camp: nextCampId,
      id_profession: nextProfessionId,
      id_person_health: nextHealthId,
      prn_name: input.prn_name?.trim() ?? existingPerson.prn_name,
      prn_lastname: input.prn_lastname?.trim() ?? existingPerson.prn_lastname,
      prn_birth_date:
        input.prn_birth_date !== undefined
          ? input.prn_birth_date
          : existingPerson.prn_birth_date,
      prn_document_number:
        input.prn_document_number !== undefined
          ? input.prn_document_number
          : existingPerson.prn_document_number,
      prn_photo_url:
        input.prn_photo_url !== undefined
          ? input.prn_photo_url
          : existingPerson.prn_photo_url,
      prn_identification_card_url:
        input.prn_identification_card_url !== undefined
          ? input.prn_identification_card_url
          : existingPerson.prn_identification_card_url,
      prn_is_accepted:
        input.prn_is_accepted ?? existingPerson.prn_is_accepted,
      prn_is_active: input.prn_is_active ?? existingPerson.prn_is_active,
      prn_admission_notes:
        input.prn_admission_notes !== undefined
          ? buildNotes(input.prn_admission_notes)
          : existingPerson.prn_admission_notes,
    };

    const previousSnapshot = serializePersonState(existingPerson);
    const nextSnapshot = serializePersonState(nextState);
    const actorUserId = actor.id;
    const auditEvents: PersonAuditEventInput[] = [];
    const updateData: Record<string, unknown> = {};
    const currentState = existingPerson as Record<string, unknown>;

    for (const [key, value] of Object.entries(nextState)) {
      const currentValue = currentState[key];
      const currentComparable =
        currentValue instanceof Date ? currentValue.toISOString() : currentValue;
      const nextComparable = value instanceof Date ? value.toISOString() : value;

      if (currentComparable !== nextComparable) {
        updateData[key] = value;
      }
    }

    const healthChanged = existingPerson.id_person_health !== nextHealthId;
    const campChanged = existingPerson.id_camp !== nextCampId;
    const professionChanged =
      existingPerson.id_profession !== nextProfessionId;
    const acceptedChanged =
      existingPerson.prn_is_accepted !== nextState.prn_is_accepted;
    const activeChanged =
      existingPerson.prn_is_active !== nextState.prn_is_active;

    if (campChanged) {
      auditEvents.push({
        eventType: "camp_changed",
        userId: actorUserId,
        oldValue: {
          id_camp: existingPerson.id_camp,
        },
        newValue: {
          id_camp: nextCampId,
        },
      });
    }

    if (professionChanged) {
      auditEvents.push({
        eventType: "profession_changed",
        userId: actorUserId,
        oldValue: {
          id_profession: existingPerson.id_profession,
        },
        newValue: {
          id_profession: nextProfessionId,
        },
      });
    }

    if (healthChanged) {
      auditEvents.push({
        eventType: "health_changed",
        userId: actorUserId,
        notes: nextState.prn_admission_notes,
        oldValue: {
          id_person_health: existingPerson.id_person_health,
        },
        newValue: {
          id_person_health: nextHealthId,
        },
      });
    }

    if (acceptedChanged) {
      auditEvents.push({
        eventType: nextState.prn_is_accepted ? "accepted" : "rejected",
        userId: actorUserId,
        notes: nextState.prn_admission_notes,
        oldValue: {
          prn_is_accepted: existingPerson.prn_is_accepted,
        },
        newValue: {
          prn_is_accepted: nextState.prn_is_accepted,
        },
      });
    }

    if (activeChanged) {
      auditEvents.push({
        eventType: nextState.prn_is_active ? "reactivated" : "inactivated",
        userId: actorUserId,
        notes: nextState.prn_admission_notes,
        oldValue: {
          prn_is_active: existingPerson.prn_is_active,
        },
        newValue: {
          prn_is_active: nextState.prn_is_active,
        },
      });
    }

    const genericChanges = Object.keys(updateData).filter(
      (key) =>
        ![
          "id_camp",
          "id_profession",
          "id_person_health",
          "prn_is_accepted",
          "prn_is_active",
        ].includes(key),
    );

    if (genericChanges.length > 0) {
      auditEvents.push({
        eventType: "updated",
        userId: actorUserId,
        oldValue: previousSnapshot,
        newValue: nextSnapshot,
      });
    }

    if (Object.keys(updateData).length === 0 && auditEvents.length === 0) {
      return mapPersonDetail(existingPerson);
    }

    const updatedPerson = await personsRepository.updatePerson({
      personId,
      campId: existingPerson.id_camp,
      data: updateData,
      closeCurrentHealthRecord: healthChanged,
      newHealthRecord: nextHealthId
        ? {
            id_person_health: nextHealthId,
            phr_notes: nextState.prn_admission_notes,
            phr_recorded_by_user_id: actorUserId,
          }
        : undefined,
      auditEvents,
    });

    return mapPersonDetail(updatedPerson);
  }
}

export const personsService = new PersonsService();
