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
