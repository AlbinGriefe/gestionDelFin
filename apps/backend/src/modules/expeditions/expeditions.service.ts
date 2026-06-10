import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  calculateMissionProbability,
  randomInteger,
  rollPercentage,
  rollSucceeds,
} from "../operations/mission-probability.js";
import {
  expeditionsRepository,
  type ExpeditionDetailRecord,
  type ExpeditionSummaryRecord,
} from "./expeditions.repository.js";
import type {
  ExpeditionCatalogFilters,
  ExpeditionCatalogs,
  ExpeditionCreateInput,
  ExpeditionDetail,
  ExpeditionListFilters,
  ExpeditionMissionOutcome,
  ExpeditionStateUpdateInput,
  ExpeditionSummary,
} from "./expeditions.types.js";

function normalizeRoleName(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
}

function isSystemAdministrator(user: AuthenticatedUser) {
  return normalizeRoleName(user.roleName) === "administrador sistema";
}

function canManageExpeditions(user: AuthenticatedUser) {
  const normalizedRole = normalizeRoleName(user.roleName);
  return (
    normalizedRole.includes("viaje") ||
    normalizedRole.includes("comunic") ||
    normalizedRole.includes("explor")
  );
}

function ensureExpeditionManager(user: AuthenticatedUser) {
  if (!canManageExpeditions(user)) {
    throw new AppError(
      403,
      "You do not have permission to manage expeditions.",
      "EXPEDITIONS_FORBIDDEN_ROLE",
    );
  }
}

function ensureCampScope(user: AuthenticatedUser, campId: number) {
  if (isSystemAdministrator(user)) {
    return;
  }

  if (user.campId !== campId) {
    throw new AppError(
      403,
      "You can only access expeditions from your assigned camp.",
      "EXPEDITIONS_FORBIDDEN_CAMP_SCOPE",
    );
  }
}

function buildFullName(name: string, lastname: string) {
  return `${name} ${lastname}`.trim();
}

function mapExpeditionSummary(
  record: ExpeditionSummaryRecord,
): ExpeditionSummary {
  return {
    id: record.id_expedition,
    name: record.exs_name,
    state: record.exe_state,
    camp: {
      id: record.camps.id_camp,
      name: record.camps.cmp_name,
    },
    explorationZone: record.exploration_zones
      ? {
          id: record.exploration_zones.id_exploration_zone,
          name: record.exploration_zones.exz_name,
          risk: record.exploration_zones.exz_risk,
        }
      : null,
    createdBy: {
      id: record.users.id_user,
      username: record.users.usr_username,
    },
    leavingDate: record.exs_leaving_date.toISOString(),
    arrivingDate: record.exs_arriving_date?.toISOString() ?? null,
    estimatedDays: record.exs_estimated_days,
    extraDays: record.exs_extra_days,
    resourcesUsed: Number(record.exe_resources_used),
    resourcesReturned: Number(record.exe_resources_returned),
    notes: record.exe_notes,
    createdAt: record.exe_created_at.toISOString(),
    membersCount: record._count.expedition_records,
  };
}

function buildExpeditionOutcome(
  expedition: ExpeditionDetailRecord,
): ExpeditionMissionOutcome {
  const rules = expedition.camps.camp_operational_rules;
  const members = expedition.expedition_records;
  const luckValues = members.flatMap((member) =>
    member.persons.person_stats ? [member.persons.person_stats.pst_luck] : [],
  );
  const mission = calculateMissionProbability({
    baseProbability: Number(rules?.cor_expedition_success ?? 70),
    luckValues,
  });
  const roll = rollPercentage();
  const successful = rollSucceeds(mission.probability, roll);
  const valuableProfessionBonus = members.reduce(
    (total, member) =>
      total + Number(member.persons.professions?.pfs_valuable_bonus_pp ?? 0),
    0,
  );
  const valuable = calculateMissionProbability({
    baseProbability: Number(rules?.cor_valuable_probability ?? 20),
    luckValues,
    professionBonusPoints: valuableProfessionBonus,
  });
  const valuableRoll = rollPercentage();

  return {
    requestedState: "returned",
    resolvedState: successful ? "returned" : "failed",
    probability: mission.probability,
    roll,
    baseProbability: mission.baseProbability,
    luckBonusPoints: mission.luckBonusPoints,
    professionBonusPoints: mission.professionBonusPoints,
    valuableProbability: valuable.probability,
    valuableRoll,
    valuableTriggered:
      successful && rollSucceeds(valuable.probability, valuableRoll),
    failureEventType: successful
      ? undefined
      : rollPercentage() <= 50
        ? "zombie_attack"
        : "traveler_loss",
    hunterRewards: successful
      ? members.flatMap((member) => {
          const profession = member.persons.professions;
          const probability = Number(profession?.pfs_extra_food_chance_pp ?? 0);
          if (probability <= 0) return [];

          const hunterRoll = rollPercentage();
          return [
            {
              personId: member.id_person,
              roll: hunterRoll,
              probability,
              quantity: rollSucceeds(probability, hunterRoll)
                ? randomInteger(
                    profession?.pfs_extra_food_min ?? 0,
                    profession?.pfs_extra_food_max ?? 0,
                  )
                : 0,
            },
          ];
        })
      : [],
  };
}

function mapExpeditionDetail(
  record: ExpeditionDetailRecord,
  recentEvents: Awaited<
    ReturnType<typeof expeditionsRepository.listExpeditionEvents>
  >,
): ExpeditionDetail {
  const summary = mapExpeditionSummary(record);
  const members = [...record.expedition_records].sort((left, right) =>
    buildFullName(
      left.persons.prn_name,
      left.persons.prn_lastname,
    ).localeCompare(
      buildFullName(right.persons.prn_name, right.persons.prn_lastname),
    ),
  );

  return {
    ...summary,
    members: members.map((member) => ({
      id: member.id_expedition_record,
      personId: member.id_person,
      fullName: buildFullName(
        member.persons.prn_name,
        member.persons.prn_lastname,
      ),
      resourceId: member.id_resource,
      resourceName: member.resources?.rss_name ?? null,
      roleInExpedition: member.exr_role_in_expedition,
      rationsAssigned: Number(member.exr_rations_assigned),
      resourcesFound: Number(member.exr_resources_found),
      departureConfirmed: member.exr_departure_confirmed,
      returnConfirmed: member.exr_return_confirmed,
      notes: member.exr_notes,
    })),
    recentEvents: recentEvents.map((event) => ({
      id: event.id_event,
      action: event.evt_action,
      description: event.evt_description,
      createdAt: event.evt_created_at.toISOString(),
      actorUserId: event.id_user,
      oldValue: event.evt_old_value,
      newValue: event.evt_new_value,
    })),
  };
}

function ensureValidTransition(
  currentState: ExpeditionDetailRecord["exe_state"],
  nextState: ExpeditionStateUpdateInput["nextState"],
) {
  const allowedTransitions: Record<
    ExpeditionDetailRecord["exe_state"],
    ExpeditionStateUpdateInput["nextState"][]
  > = {
    planned: ["in_progress", "cancelled"],
    in_progress: ["returned", "failed"],
    returned: [],
    failed: [],
    cancelled: [],
  };

  if (!allowedTransitions[currentState].includes(nextState)) {
    throw new AppError(
      400,
      `Expedition cannot move from ${currentState} to ${nextState}.`,
      "EXPEDITIONS_INVALID_STATE_TRANSITION",
    );
  }
}

export class ExpeditionsService {
  async getCatalogs(
    filters: ExpeditionCatalogFilters,
    actor: AuthenticatedUser,
  ): Promise<ExpeditionCatalogs> {
    const campId =
      filters.campId ??
      (isSystemAdministrator(actor) ? undefined : actor.campId);

    if (campId) {
      ensureCampScope(actor, campId);
    }

    const result = await expeditionsRepository.listCatalogs({
      campId,
    });

    return {
      camps: result.camps.map((camp) => ({
        id: camp.id_camp,
        name: camp.cmp_name,
        status: camp.cmp_status,
      })),
      persons: result.persons.map((person) => ({
        id: person.id_person,
        fullName: buildFullName(person.prn_name, person.prn_lastname),
        documentNumber: person.prn_document_number,
        campId: person.id_camp,
      })),
      resources: result.resources.map((resource) => ({
        id: resource.id_resource,
        name: resource.rss_name,
        unit: resource.rss_unit,
        isActive: resource.rss_is_active,
        campId: null,
      })),
      explorationZones: result.explorationZones.map((zone) => ({
        id: zone.id_exploration_zone,
        campId: zone.id_camp,
        name: zone.exz_name,
        risk: zone.exz_risk,
      })),
    };
  }

  async listExpeditions(
    filters: ExpeditionListFilters,
    actor: AuthenticatedUser,
  ) {
    if (filters.campId) {
      ensureCampScope(actor, filters.campId);
    }

    const resolvedCampId =
      filters.campId ??
      (isSystemAdministrator(actor) ? undefined : actor.campId);
    const search = filters.search?.trim();
    const where = {
      ...(resolvedCampId ? { id_camp: resolvedCampId } : {}),
      ...(filters.state ? { exe_state: filters.state } : {}),
      ...(search
        ? {
            OR: [
              { exs_name: { contains: search } },
              { exe_notes: { contains: search } },
              {
                camps: {
                  is: {
                    cmp_name: { contains: search },
                  },
                },
              },
              {
                users: {
                  is: {
                    usr_username: { contains: search },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const result = await expeditionsRepository.listExpeditions({
      where,
      filters,
    });

    return {
      items: result.items.map(mapExpeditionSummary),
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

  async getExpeditionById(expeditionId: number, actor: AuthenticatedUser) {
    const expedition =
      await expeditionsRepository.findExpeditionById(expeditionId);

    if (!expedition) {
      throw new AppError(404, "Expedition not found.", "EXPEDITION_NOT_FOUND");
    }

    ensureCampScope(actor, expedition.id_camp);

    const recentEvents =
      await expeditionsRepository.listExpeditionEvents(expeditionId);
    return mapExpeditionDetail(expedition, recentEvents);
  }

  async createExpedition(
    input: ExpeditionCreateInput,
    actor: AuthenticatedUser,
  ) {
    ensureExpeditionManager(actor);

    const campId = input.id_camp ?? actor.campId;
    ensureCampScope(actor, campId);

    const camp = await expeditionsRepository.findCampById(campId);

    if (!camp) {
      throw new AppError(404, "Camp not found.", "EXPEDITION_CAMP_NOT_FOUND");
    }

    if (camp.cmp_status !== "active") {
      throw new AppError(
        400,
        "Expeditions can only be created for active camps.",
        "EXPEDITION_INVALID_CAMP_STATUS",
      );
    }

    if (input.id_exploration_zone) {
      const zone = await expeditionsRepository.findExplorationZoneById(
        input.id_exploration_zone,
      );
      if (!zone || !zone.exz_is_active) {
        throw new AppError(
          404,
          "Exploration zone not found or inactive.",
          "EXPEDITION_ZONE_NOT_FOUND",
        );
      }
      if (zone.id_camp !== campId) {
        throw new AppError(
          400,
          "The exploration zone must belong to the selected camp.",
          "EXPEDITION_ZONE_CAMP_MISMATCH",
        );
      }
    }

    const personIds = input.members.map((member) => member.id_person);
    const resourceIds = input.members.flatMap((member) =>
      member.id_resource ? [member.id_resource] : [],
    );
    const persons = await expeditionsRepository.findPersonsByIds(personIds);

    if (persons.length !== personIds.length) {
      throw new AppError(
        404,
        "One or more expedition members could not be found.",
        "EXPEDITION_PERSON_NOT_FOUND",
      );
    }

    persons.forEach((person) => {
      if (!person.prn_is_active || person.prn_admission_status !== "accepted") {
        throw new AppError(
          400,
          "Expedition members must be active and accepted.",
          "EXPEDITION_PERSON_NOT_ELIGIBLE",
        );
      }

      if (person.id_camp !== campId) {
        throw new AppError(
          400,
          "All expedition members must belong to the selected camp.",
          "EXPEDITION_PERSON_CAMP_MISMATCH",
        );
      }

      if (!person.professions?.pfs_can_expedition) {
        throw new AppError(
          400,
          "Every expedition member must have an expedition-compatible profession.",
          "EXPEDITION_PERSON_PROFESSION_INCOMPATIBLE",
        );
      }
    });

    if (resourceIds.length > 0) {
      const uniqueResourceIds = [...new Set(resourceIds)];
      const resources =
        await expeditionsRepository.findResourcesByIds(uniqueResourceIds);

      if (resources.length !== uniqueResourceIds.length) {
        throw new AppError(
          404,
          "One or more expedition resources could not be found.",
          "EXPEDITION_RESOURCE_NOT_FOUND",
        );
      }

      resources.forEach((resource) => {
        if (!resource.rss_is_active) {
          throw new AppError(
            400,
            "Inactive resources cannot be assigned to expeditions.",
            "EXPEDITION_RESOURCE_INACTIVE",
          );
        }
      });
    }

    const createdExpedition = await expeditionsRepository.createExpedition({
      data: {
        id_camp: campId,
        id_created_by_user: actor.id,
        id_exploration_zone: input.id_exploration_zone ?? null,
        exs_name: input.exs_name.trim(),
        exs_leaving_date: input.exs_leaving_date,
        exs_estimated_days: input.exs_estimated_days ?? 1,
        exe_notes: input.exe_notes ?? null,
      },
      members: input.members.map((member) => ({
        ...member,
        roleInExpedition: member.roleInExpedition?.trim() || null,
        rationsAssigned: Number((member.rationsAssigned ?? 0).toFixed(2)),
        notes: member.notes ?? null,
      })),
      auditEvents: [
        {
          action: "created",
          actorUserId: actor.id,
          description: "Expedition created.",
          newValue: {
            id_camp: campId,
            id_exploration_zone: input.id_exploration_zone ?? null,
            exs_name: input.exs_name.trim(),
            exs_leaving_date: input.exs_leaving_date.toISOString(),
            exs_estimated_days: input.exs_estimated_days ?? 1,
            members: input.members,
          },
        },
      ],
    });

    const recentEvents = await expeditionsRepository.listExpeditionEvents(
      createdExpedition.id_expedition,
    );
    return mapExpeditionDetail(createdExpedition, recentEvents);
  }

  async updateExpeditionState(
    expeditionId: number,
    input: ExpeditionStateUpdateInput,
    actor: AuthenticatedUser,
  ) {
    ensureExpeditionManager(actor);

    const expedition =
      await expeditionsRepository.findExpeditionById(expeditionId);

    if (!expedition) {
      throw new AppError(404, "Expedition not found.", "EXPEDITION_NOT_FOUND");
    }

    ensureCampScope(actor, expedition.id_camp);
    ensureValidTransition(expedition.exe_state, input.nextState);

    if (input.nextState === "returned" && input.members) {
      const expeditionMemberIds = new Set(
        expedition.expedition_records.map((member) => member.id_person),
      );

      input.members.forEach((member) => {
        if (!expeditionMemberIds.has(member.id_person)) {
          throw new AppError(
            400,
            `Person ${member.id_person} is not part of this expedition.`,
            "EXPEDITION_MEMBER_NOT_FOUND",
          );
        }
      });
    }

    const missionOutcome =
      input.nextState === "returned"
        ? buildExpeditionOutcome(expedition)
        : undefined;
    const resolvedState = missionOutcome?.resolvedState ?? input.nextState;

    const updatedExpedition = await expeditionsRepository.updateExpeditionState(
      {
        expeditionId,
        nextState: resolvedState,
        exe_resources_used:
          input.exe_resources_used !== undefined
            ? Number(input.exe_resources_used.toFixed(2))
            : undefined,
        exe_resources_returned:
          input.exe_resources_returned !== undefined
            ? Number(input.exe_resources_returned.toFixed(2))
            : undefined,
        arrivingDate: input.exs_arriving_date,
        members: input.members?.map((member) => ({
          ...member,
          resourcesFound:
            member.resourcesFound !== undefined
              ? Number(member.resourcesFound.toFixed(2))
              : undefined,
          notes: member.notes,
        })),
        missionOutcome,
        notes: input.notes,
        actorUserId: actor.id,
      },
    );

    const recentEvents =
      await expeditionsRepository.listExpeditionEvents(expeditionId);
    return mapExpeditionDetail(updatedExpedition, recentEvents);
  }
}

export const expeditionsService = new ExpeditionsService();
