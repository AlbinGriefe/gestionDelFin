export function normalizeRoleName(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function isSuperAdmin(roleName: string) {
  return normalizeRoleName(roleName) === "superadmin";
}

export function isAdministrator(roleName: string) {
  const role = normalizeRoleName(roleName);
  return role === "superadmin" || role === "administrador sistema";
}

export function roleMatches(roleName: string, allowedRole: string) {
  if (isSuperAdmin(roleName)) {
    return true;
  }

  return normalizeRoleName(roleName) === normalizeRoleName(allowedRole);
}

export function canAccessRole(roleName: string, allowedRoles?: string[]) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (allowedRoles.some((role) => normalizeRoleName(role) === "all")) {
    return true;
  }

  return allowedRoles.some((role) => roleMatches(roleName, role));
}
