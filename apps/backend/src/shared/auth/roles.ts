export const SUPER_ADMIN_ROLE = "superadmin";
export const CAMP_ADMIN_ROLE = "administrador sistema";

export interface RoleScopedActor {
  roleName: string;
  campId?: number;
  availableCamps?: Array<{ id: number }>;
}

export function normalizeRoleName(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
}

export function isSuperAdminRole(roleName: string) {
  return normalizeRoleName(roleName) === SUPER_ADMIN_ROLE;
}

export function isCampAdminRole(roleName: string) {
  return normalizeRoleName(roleName) === CAMP_ADMIN_ROLE;
}

export function isAdministratorRole(roleName: string) {
  return isSuperAdminRole(roleName) || isCampAdminRole(roleName);
}

export function isResourceManagerRole(roleName: string) {
  const role = normalizeRoleName(roleName);
  return role.includes("gestion") && role.includes("recurso");
}

export function isTravelManagerRole(roleName: string) {
  const role = normalizeRoleName(roleName);
  return (
    role.includes("viaje") ||
    role.includes("comunic") ||
    role.includes("explor")
  );
}

export function canManageUsers(roleName: string) {
  return isSuperAdminRole(roleName);
}

export function canManageCamps(roleName: string) {
  return isSuperAdminRole(roleName);
}

export function canManageInventory(roleName: string) {
  return isAdministratorRole(roleName) || isResourceManagerRole(roleName);
}

export function canManageExpeditions(roleName: string) {
  return isAdministratorRole(roleName) || isTravelManagerRole(roleName);
}

export function canManageTransfers(roleName: string) {
  return (
    isAdministratorRole(roleName) ||
    isTravelManagerRole(roleName) ||
    isResourceManagerRole(roleName)
  );
}

export function canManageDailyProcesses(roleName: string) {
  return isAdministratorRole(roleName) || isResourceManagerRole(roleName);
}

export function canManageZones(roleName: string) {
  return isAdministratorRole(roleName) || isTravelManagerRole(roleName);
}

export function canManageProfessions(roleName: string) {
  return isAdministratorRole(roleName);
}

export function canAccessCamp(actor: RoleScopedActor, campId: number) {
  if (isSuperAdminRole(actor.roleName)) {
    return true;
  }

  if (actor.campId === campId) {
    return true;
  }

  return actor.availableCamps?.some((camp) => camp.id === campId) ?? false;
}
