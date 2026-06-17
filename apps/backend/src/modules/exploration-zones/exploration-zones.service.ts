import prisma from "../../lib/prisma.js";
import {
  canAccessCamp,
  canManageZones,
  isSuperAdminRole,
} from "../../shared/auth/roles.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { exploration_zones_exz_risk } from "../../generated/prisma/client.js";

function mapZone(record: {
  id_exploration_zone: number;
  id_camp: number;
  exz_name: string;
  exz_description: string | null;
  exz_latitude: unknown;
  exz_longitude: unknown;
  exz_risk: exploration_zones_exz_risk;
  exz_is_active: boolean;
  exz_created_at: Date;
}) {
  return {
    id: record.id_exploration_zone,
    campId: record.id_camp,
    name: record.exz_name,
    description: record.exz_description,
    latitude: record.exz_latitude === null ? null : Number(record.exz_latitude),
    longitude:
      record.exz_longitude === null ? null : Number(record.exz_longitude),
    risk: record.exz_risk,
    isActive: record.exz_is_active,
    createdAt: record.exz_created_at.toISOString(),
  };
}

export class ExplorationZonesService {
  async list(
    input: { campId?: number; active?: boolean },
    actor: AuthenticatedUser,
  ) {
    const campId = isSuperAdminRole(actor.roleName)
      ? input.campId
      : actor.campId;
    const zones = await prisma.exploration_zones.findMany({
      where: {
        ...(campId ? { id_camp: campId } : {}),
        ...(input.active !== undefined ? { exz_is_active: input.active } : {}),
      },
      orderBy: [{ id_camp: "asc" }, { exz_name: "asc" }],
    });
    return zones.map(mapZone);
  }

  async getById(zoneId: number, actor: AuthenticatedUser) {
    const zone = await prisma.exploration_zones.findUnique({
      where: { id_exploration_zone: zoneId },
    });
    if (!zone) {
      throw new AppError(404, "Exploration zone not found.", "ZONE_NOT_FOUND");
    }
    if (!canAccessCamp(actor, zone.id_camp)) {
      throw new AppError(403, "Zone is outside your camp.", "ZONE_FORBIDDEN");
    }
    return mapZone(zone);
  }

  async create(
    input: {
      campId: number;
      name: string;
      description?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      risk: exploration_zones_exz_risk;
      isActive: boolean;
    },
    actor: AuthenticatedUser,
  ) {
    if (!canManageZones(actor.roleName)) {
      throw new AppError(
        403,
        "Travel manager role required.",
        "ZONE_MANAGER_REQUIRED",
      );
    }
    const camp = await prisma.camps.findUnique({
      where: { id_camp: input.campId },
    });
    if (!camp)
      throw new AppError(404, "Camp not found.", "ZONE_CAMP_NOT_FOUND");
    if (!canAccessCamp(actor, input.campId)) {
      throw new AppError(403, "Zone is outside your camp.", "ZONE_FORBIDDEN");
    }
    const zone = await prisma.exploration_zones.create({
      data: {
        id_camp: input.campId,
        exz_name: input.name,
        exz_description: input.description ?? null,
        exz_latitude: input.latitude ?? null,
        exz_longitude: input.longitude ?? null,
        exz_risk: input.risk,
        exz_is_active: input.isActive,
      },
    });
    return mapZone(zone);
  }

  async update(
    zoneId: number,
    input: {
      name?: string;
      description?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      risk?: exploration_zones_exz_risk;
      isActive?: boolean;
    },
    actor: AuthenticatedUser,
  ) {
    if (!canManageZones(actor.roleName)) {
      throw new AppError(
        403,
        "Travel manager role required.",
        "ZONE_MANAGER_REQUIRED",
      );
    }
    const existing = await prisma.exploration_zones.findUnique({
      where: { id_exploration_zone: zoneId },
    });
    if (!existing) {
      throw new AppError(404, "Exploration zone not found.", "ZONE_NOT_FOUND");
    }
    if (!canAccessCamp(actor, existing.id_camp)) {
      throw new AppError(403, "Zone is outside your camp.", "ZONE_FORBIDDEN");
    }
    const zone = await prisma.exploration_zones.update({
      where: { id_exploration_zone: zoneId },
      data: {
        ...(input.name !== undefined ? { exz_name: input.name } : {}),
        ...(input.description !== undefined
          ? { exz_description: input.description }
          : {}),
        ...(input.latitude !== undefined
          ? { exz_latitude: input.latitude }
          : {}),
        ...(input.longitude !== undefined
          ? { exz_longitude: input.longitude }
          : {}),
        ...(input.risk !== undefined ? { exz_risk: input.risk } : {}),
        ...(input.isActive !== undefined
          ? { exz_is_active: input.isActive }
          : {}),
      },
    });
    return mapZone(zone);
  }
}

export const explorationZonesService = new ExplorationZonesService();
