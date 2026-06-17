import prisma from "../../lib/prisma.js";
import {
  isAdministratorRole,
  isResourceManagerRole,
  isTravelManagerRole,
} from "../../shared/auth/roles.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

export class DashboardService {
  async getDashboard(actor: AuthenticatedUser) {
    const campId = actor.campId;
    const isAdmin = isAdministratorRole(actor.roleName);
    const isResourceManager = isResourceManagerRole(actor.roleName) || isAdmin;
    const isTravelManager = isTravelManagerRole(actor.roleName) || isAdmin;

    const [
      camp,
      population,
      accepted,
      pendingAdmissions,
      injuredOrSick,
      activeExpeditions,
      pendingTransfers,
      storage,
      professions,
      recentEvents,
      pendingPeople,
    ] = await prisma.$transaction([
      prisma.camps.findUniqueOrThrow({ where: { id_camp: campId } }),
      prisma.persons.count({
        where: { id_camp: campId, prn_is_active: true },
      }),
      prisma.persons.count({
        where: {
          id_camp: campId,
          prn_is_active: true,
          prn_admission_status: "accepted",
        },
      }),
      prisma.persons.count({
        where: {
          id_camp: campId,
          prn_is_active: true,
          prn_admission_status: {
            in: ["pending", "under_review", "observe"],
          },
        },
      }),
      prisma.persons.count({
        where: {
          id_camp: campId,
          prn_is_active: true,
          person_health: {
            is: {
              phs_can_work: false,
              phs_is_terminal: false,
            },
          },
        },
      }),
      prisma.expeditions.count({
        where: {
          id_camp: campId,
          exe_state: { in: ["planned", "in_progress"] },
        },
      }),
      prisma.transfers.count({
        where: {
          OR: [{ id_origin_camp: campId }, { id_destiny_camp: campId }],
          tfs_state: {
            in: ["pending", "accepted", "scheduled", "in_transit"],
          },
        },
      }),
      prisma.storage.findMany({
        where: { id_camp: campId },
        include: {
          resources: true,
        },
        orderBy: { stg_quantity: "asc" },
      }),
      prisma.professions.findMany({
        where: {
          pfs_is_active: true,
          OR: [{ id_camp: null }, { id_camp: campId }],
        },
        include: {
          persons: {
            where: {
              id_camp: campId,
              prn_is_active: true,
              prn_admission_status: "accepted",
              OR: [
                { id_person_health: null },
                { person_health: { is: { phs_can_work: true } } },
              ],
            },
            select: { id_person: true },
          },
        },
        orderBy: { pfs_name: "asc" },
      }),
      prisma.narrative_events.findMany({
        where: { id_camp: campId },
        orderBy: { nre_created_at: "desc" },
        take: 6,
      }),
      prisma.persons.findMany({
        where: {
          id_camp: campId,
          prn_is_active: true,
          prn_admission_status: {
            in: ["pending", "under_review", "observe"],
          },
        },
        orderBy: { prn_created_at: "asc" },
        take: 6,
      }),
    ]);

    const criticalInventory = storage
      .map((item) => ({
        storageId: item.id_storage,
        resourceName: item.resources.rss_name,
        unit: item.resources.rss_unit,
        quantity: Number(item.stg_quantity),
        minimum: Number(item.stg_min_quantity),
        isBelowMinimum:
          Number(item.stg_quantity) < Number(item.stg_min_quantity),
      }))
      .filter((item) => item.isBelowMinimum)
      .slice(0, 6);

    return {
      role: actor.roleName,
      capabilities: {
        admissions: isAdmin,
        inventory: isResourceManager,
        travel: isTravelManager,
      },
      camp: {
        id: camp.id_camp,
        name: camp.cmp_name,
        location: camp.cmp_location,
        status: camp.cmp_status,
        capacity: camp.cmp_max_capacity,
      },
      metrics: {
        population,
        accepted,
        pendingAdmissions: isAdmin ? pendingAdmissions : 0,
        injuredOrSick,
        activeAlerts: criticalInventory.length,
        activeExpeditions,
        pendingTransfers,
      },
      inventory: storage.slice(0, 8).map((item) => ({
        storageId: item.id_storage,
        resourceName: item.resources.rss_name,
        unit: item.resources.rss_unit,
        quantity: Number(item.stg_quantity),
        minimum: Number(item.stg_min_quantity),
        isBelowMinimum:
          Number(item.stg_quantity) < Number(item.stg_min_quantity),
      })),
      criticalInventory,
      professionCoverage: professions.map((profession) => ({
        professionId: profession.id_profession,
        professionName: profession.pfs_name,
        activeWorkers: profession.persons.length,
        needsCoverage: profession.persons.length === 0,
      })),
      pendingPeople: isAdmin
        ? pendingPeople.map((person) => ({
            personId: person.id_person,
            identifier: person.prn_identifier,
            fullName: `${person.prn_name} ${person.prn_lastname}`.trim(),
            admissionStatus: person.prn_admission_status,
            createdAt: person.prn_created_at.toISOString(),
          }))
        : [],
      recentEvents: recentEvents.map((event) => ({
        id: event.id_narrative_event,
        type: event.nre_type,
        description: event.nre_description,
        status: event.nre_status,
        createdAt: event.nre_created_at.toISOString(),
      })),
    };
  }
}

export const dashboardService = new DashboardService();
