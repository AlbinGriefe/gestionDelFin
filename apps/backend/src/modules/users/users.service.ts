import bcrypt from "bcryptjs";

import { canManageUsers, isSuperAdminRole } from "../../shared/auth/roles.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import {
  usersRepository,
  type UserDetailRecord,
  type UserSummaryRecord,
} from "./users.repository.js";
import type {
  SessionInvalidationPlan,
  UserAuditEventInput,
  UserDetail,
  UserListFilters,
  UsersCatalogs,
  UserSummary,
  UserWriteInput,
} from "./users.types.js";

function serializeUserState(input: {
  id_person: number | null;
  id_role: number;
  id_camp: number;
  campIds?: number[];
  usr_username: string;
  usr_email: string | null;
  usr_is_active: boolean;
}) {
  return {
    id_person: input.id_person,
    id_role: input.id_role,
    id_camp: input.id_camp,
    campIds: input.campIds ?? [input.id_camp],
    usr_username: input.usr_username,
    usr_email: input.usr_email,
    usr_is_active: input.usr_is_active,
  };
}

function buildFullName(name: string, lastname: string) {
  return `${name} ${lastname}`.trim();
}

function mapUserSummary(record: UserSummaryRecord): UserSummary {
  return {
    id: record.id_user,
    username: record.usr_username,
    email: record.usr_email,
    isActive: record.usr_is_active,
    lastLoginAt: record.usr_last_login_at?.toISOString() ?? null,
    createdAt: record.usr_created_at.toISOString(),
    updatedAt: record.usr_updated_at.toISOString(),
    camp: {
      id: record.camps.id_camp,
      name: record.camps.cmp_name,
    },
    assignedCamps: record.user_camp_memberships.map((membership) => ({
      id: membership.camps.id_camp,
      name: membership.camps.cmp_name,
    })),
    role: {
      id: record.roles.id_role,
      name: record.roles.rls_name,
      description: record.roles.rls_description,
    },
    person: record.persons
      ? {
          id: record.persons.id_person,
          fullName: buildFullName(
            record.persons.prn_name,
            record.persons.prn_lastname,
          ),
          documentNumber: record.persons.prn_document_number,
          isAccepted: record.persons.prn_admission_status === "accepted",
          isActive: record.persons.prn_is_active,
        }
      : null,
    activeSessionsCount: record.user_sessions.length,
  };
}

function mapUserDetail(
  record: UserDetailRecord,
  recentEvents: Awaited<ReturnType<typeof usersRepository.listUserEvents>>,
): UserDetail {
  const summary = mapUserSummary(record);

  return {
    ...summary,
    recentSessions: record.user_sessions.map((session) => ({
      id: session.id_user_session,
      ipAddress: session.uss_ip,
      loginAt: session.uss_login.toISOString(),
      lastUpdateAt: session.uss_last_update.toISOString(),
      expiresAt: session.uss_expired_session.toISOString(),
      campId: session.id_camp,
    })),
    recentEvents: recentEvents.map((event) => ({
      id: event.id_event,
      action: event.evt_action,
      description: event.evt_description,
      createdAt: event.evt_created_at.toISOString(),
      oldValue: event.evt_old_value,
      newValue: event.evt_new_value,
      actorUserId: event.id_user,
    })),
  };
}

function resolveSessionInvalidationPlan(input: {
  campChanged: boolean;
  roleChanged: boolean;
  passwordChanged: boolean;
  deactivated: boolean;
}): SessionInvalidationPlan {
  if (
    !input.campChanged &&
    !input.roleChanged &&
    !input.passwordChanged &&
    !input.deactivated
  ) {
    return {
      shouldInvalidate: false,
      reason: "forced",
    };
  }

  if (input.campChanged) {
    return {
      shouldInvalidate: true,
      reason: "camp_change",
    };
  }

  if (input.passwordChanged) {
    return {
      shouldInvalidate: true,
      reason: "security",
    };
  }

  return {
    shouldInvalidate: true,
    reason: "forced",
  };
}

async function ensureUniqueUsername(username: string, currentUserId?: number) {
  const existingUser = await usersRepository.findUserByUsername(username);

  if (existingUser && existingUser.id_user !== currentUserId) {
    throw new AppError(
      409,
      "The username is already in use.",
      "USER_USERNAME_ALREADY_EXISTS",
    );
  }
}

async function ensureUniqueEmail(
  email: string | null | undefined,
  currentUserId?: number,
) {
  if (!email) {
    return;
  }

  const existingUser = await usersRepository.findUserByEmail(email);

  if (existingUser && existingUser.id_user !== currentUserId) {
    throw new AppError(
      409,
      "The email is already in use.",
      "USER_EMAIL_ALREADY_EXISTS",
    );
  }
}

async function resolveValidatedPerson(
  personId: number | null | undefined,
  currentUserId?: number,
) {
  if (personId === undefined) {
    return undefined;
  }

  if (personId === null) {
    return null;
  }

  const person = await usersRepository.findPersonById(personId);

  if (!person) {
    throw new AppError(404, "Person not found.", "USER_PERSON_NOT_FOUND");
  }

  if (!person.prn_is_active || person.prn_admission_status !== "accepted") {
    throw new AppError(
      400,
      "The selected person must be active and accepted.",
      "USER_PERSON_NOT_ELIGIBLE",
    );
  }

  const linkedUser = await usersRepository.findUserByPersonId(personId);

  if (linkedUser && linkedUser.id_user !== currentUserId) {
    throw new AppError(
      409,
      "The selected person is already linked to another user.",
      "USER_PERSON_ALREADY_LINKED",
    );
  }

  return person;
}

function uniqueCampIds(campIds: number[]) {
  return [...new Set(campIds.filter((campId) => Number.isInteger(campId)))];
}

function sameNumberSet(left: number[], right: number[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

async function validateActiveCampAssignments(campIds: number[]) {
  const camps = await usersRepository.findCampsByIds(campIds);

  if (camps.length !== campIds.length) {
    throw new AppError(
      404,
      "One or more camps were not found.",
      "USER_CAMP_NOT_FOUND",
    );
  }

  const inactiveCamp = camps.find((camp) => camp.cmp_status !== "active");

  if (inactiveCamp) {
    throw new AppError(
      400,
      "Users can only be assigned to active camps.",
      "USER_INVALID_CAMP_STATUS",
    );
  }

  return camps;
}

async function resolveMembershipCampIds(input: {
  roleName: string;
  primaryCampId: number;
  requestedCampIds?: number[];
}) {
  if (isSuperAdminRole(input.roleName)) {
    const activeCamps = await usersRepository.listActiveCamps();
    return uniqueCampIds([
      input.primaryCampId,
      ...activeCamps.map((camp) => camp.id_camp),
    ]);
  }

  return uniqueCampIds([
    input.primaryCampId,
    ...(input.requestedCampIds ?? []),
  ]);
}

export class UsersService {
  async getCatalogs(): Promise<UsersCatalogs> {
    const result = await usersRepository.listCatalogs();

    return {
      camps: result.camps.map((camp) => ({
        id: camp.id_camp,
        name: camp.cmp_name,
        location: camp.cmp_location,
        status: camp.cmp_status,
      })),
      roles: result.roles.map((role) => ({
        id: role.id_role,
        name: role.rls_name,
        description: role.rls_description,
        isSystemRole: role.rls_is_system_role,
      })),
      persons: result.persons.map((person) => ({
        id: person.id_person,
        fullName: buildFullName(person.prn_name, person.prn_lastname),
        campId: person.id_camp,
        campName: person.camps.cmp_name,
        documentNumber: person.prn_document_number,
        linkedUsersCount: person._count.users,
      })),
    };
  }

  async listUsers(filters: UserListFilters) {
    const search = filters.search?.trim();
    const where = {
      ...(filters.campId ? { id_camp: filters.campId } : {}),
      ...(filters.roleId ? { id_role: filters.roleId } : {}),
      ...(filters.personId ? { id_person: filters.personId } : {}),
      ...(filters.active !== undefined
        ? { usr_is_active: filters.active }
        : {}),
      ...(search
        ? {
            OR: [
              { usr_username: { contains: search } },
              { usr_email: { contains: search } },
              {
                persons: {
                  is: {
                    OR: [
                      { prn_name: { contains: search } },
                      { prn_lastname: { contains: search } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const result = await usersRepository.listUsers({
      where,
      filters,
    });

    return {
      items: result.items.map(mapUserSummary),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / filters.pageSize)),
      },
      appliedFilters: {
        ...filters,
        search,
      },
    };
  }

  async getUserById(userId: number): Promise<UserDetail> {
    const user = await usersRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.", "USER_NOT_FOUND");
    }

    const recentEvents = await usersRepository.listUserEvents(userId);
    return mapUserDetail(user, recentEvents);
  }

  async createUser(input: UserWriteInput, actor: AuthenticatedUser) {
    if (!canManageUsers(actor.roleName)) {
      throw new AppError(
        403,
        "Only SuperAdmin users can manage user accounts.",
        "USER_SUPERADMIN_REQUIRED",
      );
    }

    if (!input.id_role) {
      throw new AppError(400, "A role is required.", "USER_ROLE_REQUIRED");
    }

    if (!input.usr_password) {
      throw new AppError(
        400,
        "A password is required to create a user.",
        "USER_PASSWORD_REQUIRED",
      );
    }

    const role = await usersRepository.findRoleById(input.id_role);

    if (!role) {
      throw new AppError(404, "Role not found.", "USER_ROLE_NOT_FOUND");
    }

    const person = await resolveValidatedPerson(input.id_person);
    const resolvedCampId = input.id_camp ?? person?.id_camp ?? actor.campId;
    const membershipCampIds = await resolveMembershipCampIds({
      roleName: role.rls_name,
      primaryCampId: resolvedCampId,
      requestedCampIds: input.campIds,
    });
    await validateActiveCampAssignments(membershipCampIds);

    if (person && person.id_camp !== resolvedCampId) {
      throw new AppError(
        400,
        "The selected person belongs to a different camp.",
        "USER_PERSON_CAMP_MISMATCH",
      );
    }

    if (!input.usr_username) {
      throw new AppError(
        400,
        "A username is required.",
        "USER_USERNAME_REQUIRED",
      );
    }

    await ensureUniqueUsername(input.usr_username);
    await ensureUniqueEmail(input.usr_email);

    const hashedPassword = await bcrypt.hash(input.usr_password, 10);
    const userData = {
      id_person: person?.id_person ?? null,
      id_role: role.id_role,
      id_camp: resolvedCampId,
      usr_username: input.usr_username.trim(),
      usr_email: input.usr_email ?? null,
      usr_password: hashedPassword,
      usr_is_active: input.usr_is_active ?? true,
    };

    const auditEvents: UserAuditEventInput[] = [
      {
        action: "created",
        actorUserId: actor.id,
        description: "User account created.",
        newValue: serializeUserState({
          ...userData,
          campIds: membershipCampIds,
        }),
      },
    ];

    const createdUser = await usersRepository.createUser({
      data: userData,
      membershipCampIds,
      auditEvents,
    });

    const recentEvents = await usersRepository.listUserEvents(
      createdUser.id_user,
    );
    return mapUserDetail(createdUser, recentEvents);
  }

  async updateUser(
    userId: number,
    input: UserWriteInput,
    actor: AuthenticatedUser,
  ) {
    if (!canManageUsers(actor.roleName)) {
      throw new AppError(
        403,
        "Only SuperAdmin users can manage user accounts.",
        "USER_SUPERADMIN_REQUIRED",
      );
    }

    const existingUser = await usersRepository.findUserById(userId);

    if (!existingUser) {
      throw new AppError(404, "User not found.", "USER_NOT_FOUND");
    }

    const nextRoleId = input.id_role ?? existingUser.id_role;
    const role = await usersRepository.findRoleById(nextRoleId);

    if (!role) {
      throw new AppError(404, "Role not found.", "USER_ROLE_NOT_FOUND");
    }

    const person = await resolveValidatedPerson(input.id_person, userId);
    const nextCampId = input.id_camp ?? person?.id_camp ?? existingUser.id_camp;
    const currentMembershipCampIds = uniqueCampIds(
      existingUser.user_camp_memberships.map(
        (membership) => membership.id_camp,
      ),
    );
    const nextMembershipCampIds = await resolveMembershipCampIds({
      roleName: role.rls_name,
      primaryCampId: nextCampId,
      requestedCampIds: input.campIds ?? currentMembershipCampIds,
    });
    await validateActiveCampAssignments(nextMembershipCampIds);

    if (person && person.id_camp !== nextCampId) {
      throw new AppError(
        400,
        "The selected person belongs to a different camp.",
        "USER_PERSON_CAMP_MISMATCH",
      );
    }

    const nextUsername =
      input.usr_username?.trim() ?? existingUser.usr_username;
    const nextEmail =
      input.usr_email !== undefined ? input.usr_email : existingUser.usr_email;

    await ensureUniqueUsername(nextUsername, userId);
    await ensureUniqueEmail(nextEmail, userId);

    const nextState = {
      id_person:
        input.id_person !== undefined
          ? input.id_person
          : existingUser.id_person,
      id_role: nextRoleId,
      id_camp: nextCampId,
      usr_username: nextUsername,
      usr_email: nextEmail ?? null,
      usr_is_active:
        input.usr_is_active !== undefined
          ? input.usr_is_active
          : existingUser.usr_is_active,
    };

    const currentSnapshot = serializeUserState({
      ...existingUser,
      campIds: currentMembershipCampIds,
    });
    const nextSnapshot = serializeUserState({
      ...nextState,
      campIds: nextMembershipCampIds,
    });
    const updateData: Record<string, unknown> = {};
    const currentState = existingUser as Record<string, unknown>;

    for (const [key, value] of Object.entries(nextState)) {
      const currentValue = currentState[key];

      if (currentValue !== value) {
        updateData[key] = value;
      }
    }

    let passwordChanged = false;

    if (input.usr_password) {
      updateData.usr_password = await bcrypt.hash(input.usr_password, 10);
      passwordChanged = true;
    }

    const campChanged = existingUser.id_camp !== nextState.id_camp;
    const membershipsChanged = !sameNumberSet(
      currentMembershipCampIds,
      nextMembershipCampIds,
    );
    const roleChanged = existingUser.id_role !== nextState.id_role;
    const deactivated =
      existingUser.usr_is_active && nextState.usr_is_active === false;
    const reactivated =
      existingUser.usr_is_active === false && nextState.usr_is_active === true;
    const linkedPersonChanged = existingUser.id_person !== nextState.id_person;
    const auditEvents: UserAuditEventInput[] = [];

    if (
      Object.keys(updateData).some((key) =>
        [
          "id_person",
          "id_role",
          "id_camp",
          "usr_username",
          "usr_email",
          "usr_is_active",
        ].includes(key),
      )
    ) {
      auditEvents.push({
        action: "updated",
        actorUserId: actor.id,
        description: "User account updated.",
        oldValue: currentSnapshot,
        newValue: nextSnapshot,
      });
    }

    if (passwordChanged) {
      auditEvents.push({
        action: "password_changed",
        actorUserId: actor.id,
        description: "User password updated.",
      });
    }

    if (campChanged || roleChanged) {
      auditEvents.push({
        action: "security_scope_changed",
        actorUserId: actor.id,
        description: "User role or camp assignment changed.",
        oldValue: {
          id_role: existingUser.id_role,
          id_camp: existingUser.id_camp,
        },
        newValue: {
          id_role: nextState.id_role,
          id_camp: nextState.id_camp,
        },
      });
    }

    if (membershipsChanged) {
      auditEvents.push({
        action: "camp_memberships_changed",
        actorUserId: actor.id,
        description: "User camp memberships changed.",
        oldValue: {
          campIds: currentMembershipCampIds,
        },
        newValue: {
          campIds: nextMembershipCampIds,
        },
      });
    }

    if (linkedPersonChanged) {
      auditEvents.push({
        action: "person_link_changed",
        actorUserId: actor.id,
        description: "Linked person changed.",
        oldValue: {
          id_person: existingUser.id_person,
        },
        newValue: {
          id_person: nextState.id_person,
        },
      });
    }

    if (deactivated || reactivated) {
      auditEvents.push({
        action: deactivated ? "deactivated" : "reactivated",
        actorUserId: actor.id,
        description: deactivated
          ? "User account deactivated."
          : "User account reactivated.",
        oldValue: {
          usr_is_active: existingUser.usr_is_active,
        },
        newValue: {
          usr_is_active: nextState.usr_is_active,
        },
      });
    }

    if (Object.keys(updateData).length === 0 && auditEvents.length === 0) {
      const recentEvents = await usersRepository.listUserEvents(userId);
      return mapUserDetail(existingUser, recentEvents);
    }

    const invalidateSessions = resolveSessionInvalidationPlan({
      campChanged,
      roleChanged: roleChanged || membershipsChanged,
      passwordChanged,
      deactivated,
    });

    const updatedUser = await usersRepository.updateUser({
      userId,
      currentCampId: existingUser.id_camp,
      data: updateData,
      membershipCampIds: membershipsChanged ? nextMembershipCampIds : undefined,
      invalidateSessions,
      auditEvents,
    });

    const recentEvents = await usersRepository.listUserEvents(userId);
    return mapUserDetail(updatedUser, recentEvents);
  }
}

export const usersService = new UsersService();
