import { ApiError } from "../api/apiError";
import type { ApiErrorCode } from "../api/apiError";

const serverMessages: Record<string, string> = {
  ADMISSION_ADMIN_REQUIRED: "Tu rol no puede gestionar admisiones.",
  ADMISSION_FORBIDDEN_CAMP:
    "La persona pertenece a un campamento fuera de tu alcance.",
  ADMISSION_EVALUATION_FINAL:
    "Esta evaluacion ya fue finalizada. Actualiza el flujo.",
  ADMISSION_CAMP_CAPACITY_EXCEEDED:
    "No hay capacidad disponible en el campamento.",
  ADMISSION_PERSON_NOT_FOUND: "No se encontro la persona seleccionada.",
  ADMISSION_EVALUATION_NOT_FOUND: "No se encontro la evaluacion de admision.",
  ADMISSION_PERSON_INACTIVE: "No se puede evaluar una persona inactiva.",
  ADMISSION_ALREADY_ACCEPTED: "La persona ya fue aceptada.",
  ADMISSION_STATS_MISSING:
    "La persona no tiene estadisticas iniciales para evaluar.",

  AUTH_REQUIRED: "Inicia sesion para continuar.",
  CAMP_ALREADY_ACTIVE: "Ese campamento ya esta activo.",
  CAMP_MEMBERSHIP_REQUIRED: "No tienes acceso al campamento activo.",
  CAMP_SWITCH_FORBIDDEN: "No puedes cambiar a ese campamento.",
  INVALID_CREDENTIALS: "Credenciales incorrectas.",
  INVALID_TOKEN: "La sesion no es valida.",
  MISSING_AUTH_TOKEN: "Inicia sesion para continuar.",
  SESSION_EXPIRED: "Sesion expirada, inicia sesion nuevamente.",
  SESSION_NOT_FOUND: "La sesion ya no esta disponible.",
  USER_INACTIVE: "El usuario esta inactivo.",

  CAMP_SUPERADMIN_REQUIRED: "Solo SuperAdmin puede gestionar campamentos.",
  CAMP_NOT_FOUND: "No se encontro el campamento.",
  CAMP_FORBIDDEN_SCOPE: "No tienes acceso a ese campamento.",
  CAMP_NAME_REQUIRED: "El nombre del campamento es obligatorio.",
  CAMP_LOCATION_REQUIRED: "La ubicacion del campamento es obligatoria.",
  CAMP_NAME_ALREADY_EXISTS: "Ya existe un campamento con ese nombre.",
  CAMP_STATUS_TRANSITION_BLOCKED:
    "No se puede cerrar el campamento mientras tenga personas o usuarios activos.",
  CAMP_CAPACITY_TOO_LOW:
    "La capacidad no puede ser menor que la ocupacion actual.",
  CAMP_RULES_ADMIN_REQUIRED: "Solo SuperAdmin puede cambiar reglas operativas.",

  CARE_ACTION_RESOURCE_MANAGER_REQUIRED:
    "Tu rol no puede registrar cuidados medicos.",
  CARE_ACTION_SAME_PERSON: "Medico y paciente deben ser personas distintas.",
  CARE_PERSON_NOT_FOUND: "No se encontro medico o paciente.",
  CARE_ACTION_FORBIDDEN_CAMP:
    "Solo puedes registrar cuidados de tu campamento asignado.",
  CARE_PERSON_INELIGIBLE:
    "Medico y paciente deben estar activos, aceptados y en el mismo campamento.",
  CARE_DOCTOR_INVALID_PROFESSION:
    "La persona medica seleccionada no tiene el oficio Medico.",
  CARE_PATIENT_STATS_MISSING: "El paciente no tiene estadisticas registradas.",
  CARE_FOOD_RESOURCE_MISSING: "No existe recurso de comida configurado.",
  CARE_INSUFFICIENT_FOOD: "No hay comida suficiente para el tratamiento.",

  DATABASE_CONSTRAINT_FAILED:
    "Los datos no cumplen una restriccion de la base de datos.",
  DATABASE_RECORD_NOT_FOUND: "El registro ya no existe.",
  DATABASE_RELATION_CONSTRAINT:
    "Falta un registro relacionado o no se puede cambiar.",
  DATABASE_UNIQUE_CONSTRAINT: "Ya existe un registro con ese valor unico.",
  DATABASE_VALUE_TOO_LONG: "Uno de los valores es demasiado largo.",

  DAILY_PROCESS_ADMIN_REQUIRED: "Tu rol no puede ejecutar el proceso diario.",
  DAILY_PROCESS_CAMP_FORBIDDEN:
    "No puedes ejecutar proceso diario en ese campamento.",
  DAILY_PROCESS_CAMP_NOT_FOUND: "No se encontro el campamento.",
  DAILY_PROCESS_INVALID_CAMP_STATUS:
    "El proceso diario solo aplica a campamentos activos.",
  DAILY_PROCESS_ALREADY_RUN:
    "El proceso diario ya fue ejecutado para esta fecha.",

  EXPEDITION_CAMP_NOT_FOUND: "No se encontro el campamento de la expedicion.",
  EXPEDITION_FOOD_RESOURCE_MISSING:
    "No existe recurso de comida para asignar raciones.",
  EXPEDITION_INSUFFICIENT_RATIONS:
    "No hay raciones suficientes para iniciar la expedicion.",
  EXPEDITION_INVALID_CAMP_STATUS:
    "Solo se pueden crear expediciones en campamentos activos.",
  EXPEDITION_MEMBER_RESOURCE_REQUIRED:
    "Selecciona el recurso encontrado antes de registrar el retorno.",
  EXPEDITION_MEMBER_NOT_FOUND: "Una persona no pertenece a esta expedicion.",
  EXPEDITION_NOT_FOUND: "No se encontro la expedicion.",
  EXPEDITION_PERSON_CAMP_MISMATCH:
    "Todas las personas deben pertenecer al campamento seleccionado.",
  EXPEDITION_PERSON_NOT_ELIGIBLE:
    "Los integrantes deben estar activos y aceptados.",
  EXPEDITION_PERSON_NOT_FOUND: "No se encontro una persona de la expedicion.",
  EXPEDITION_PERSON_PROFESSION_INCOMPATIBLE:
    "Todos los integrantes deben tener un oficio compatible.",
  EXPEDITION_RESOURCE_INACTIVE:
    "No se pueden usar recursos inactivos en expediciones.",
  EXPEDITION_RESOURCE_NOT_FOUND: "No se encontro un recurso de la expedicion.",
  EXPEDITION_ZONE_CAMP_MISMATCH:
    "La zona debe pertenecer al campamento seleccionado.",
  EXPEDITION_ZONE_NOT_FOUND: "No se encontro la zona de exploracion.",
  EXPEDITIONS_FORBIDDEN_CAMP_SCOPE:
    "No tienes acceso a expediciones de ese campamento.",
  EXPEDITIONS_FORBIDDEN_ROLE: "Tu rol no puede gestionar expediciones.",
  EXPEDITIONS_INVALID_STATE_TRANSITION:
    "La expedicion no puede cambiar a ese estado.",

  FORBIDDEN: "No tienes permiso para realizar esta accion.",

  INVENTORY_CAMP_NOT_FOUND: "No se encontro el campamento del inventario.",
  INVENTORY_FORBIDDEN_CAMP_SCOPE:
    "No tienes acceso al inventario de ese campamento.",
  INVENTORY_INVALID_CAMP_STATUS:
    "El inventario solo puede ajustarse en campamentos activos.",
  INVENTORY_INVALID_THRESHOLDS: "El maximo no puede ser menor que el minimo.",
  INVENTORY_ITEM_NOT_FOUND: "No se encontro el registro de inventario.",
  INVENTORY_NEGATIVE_RESULT: "El inventario no puede quedar en negativo.",
  INVENTORY_RESOURCE_INACTIVE: "No se puede ajustar un recurso inactivo.",
  INVENTORY_RESOURCE_NOT_FOUND: "No se encontro el recurso.",

  PERSON_CAMP_NOT_FOUND: "No se encontro el campamento de la persona.",
  PERSON_HEALTH_STATUS_INVALID: "El estado de salud no existe o esta inactivo.",
  PERSON_INVALID_CAMP_STATUS:
    "Solo se pueden registrar personas en campamentos activos.",
  PERSON_NOT_FOUND: "No se encontro la persona.",
  PERSONS_ADMIN_REQUIRED: "Tu rol no puede gestionar personas.",
  PERSONS_FORBIDDEN: "La persona esta fuera de tu campamento activo.",

  PROFESSION_CAMP_NOT_FOUND: "No se encontro el campamento del oficio.",
  PROFESSION_FORBIDDEN_CAMP: "No tienes acceso a oficios de ese campamento.",
  PROFESSION_NOT_FOUND: "No se encontro el oficio.",
  PROFESSION_RECOMMENDATION_ADMIN_REQUIRED:
    "Tu rol no puede gestionar recomendaciones de oficio.",
  PROFESSION_RECOMMENDATION_FORBIDDEN_CAMP:
    "La recomendacion pertenece a un campamento fuera de tu alcance.",
  PROFESSION_RECOMMENDATION_INVALID_PROVIDER_RESULT:
    "La IA devolvio un oficio no configurado.",
  PROFESSION_RECOMMENDATION_INVALID_SELECTION:
    "El oficio seleccionado esta inactivo o pertenece a otro campamento.",
  PROFESSION_RECOMMENDATION_NO_CANDIDATES:
    "No hay oficios activos disponibles.",
  PROFESSION_RECOMMENDATION_NOT_FOUND:
    "No se encontro la recomendacion de oficio.",
  PROFESSION_RECOMMENDATION_PERSON_INELIGIBLE:
    "La persona debe estar activa y aceptada para asignar oficio.",
  PROFESSION_RECOMMENDATION_PERSON_NOT_FOUND:
    "No se encontro la persona para recomendar oficio.",
  PROFESSION_RECOMMENDATION_STATS_MISSING:
    "La persona no tiene estadisticas para recomendar oficio.",
  PROFESSIONS_CAMP_NOT_FOUND: "No se encontro el campamento del oficio.",

  SETTING_FORBIDDEN: "Tu rol no puede modificar configuracion.",
  SETTING_INVALID_VALUE: "El valor de configuracion no es valido.",
  SETTING_NOT_FOUND: "No se encontro la configuracion.",

  TRANSFER_CAMP_NOT_FOUND: "No se encontro un campamento del traslado.",
  TRANSFER_DESTINATION_CAPACITY_EXCEEDED:
    "El campamento destino no tiene capacidad suficiente.",
  TRANSFER_FORBIDDEN_CAMP_SCOPE: "No tienes acceso a ese traslado.",
  TRANSFER_INVALID_CAMPS: "Origen y destino deben ser campamentos distintos.",
  TRANSFER_INVALID_CAMP_STATUS:
    "Los traslados solo pueden hacerse entre campamentos activos.",
  TRANSFER_INSUFFICIENT_STOCK:
    "No hay inventario suficiente para completar el traslado.",
  TRANSFER_PERSON_CAMP_MISMATCH:
    "Todas las personas deben pertenecer al campamento origen.",
  TRANSFER_PERSON_NOT_ELIGIBLE:
    "Las personas trasladadas deben estar activas y aceptadas.",
  TRANSFER_PERSON_NOT_FOUND: "No se encontro una persona del traslado.",
  TRANSFER_RESOURCE_INACTIVE: "No se pueden trasladar recursos inactivos.",
  TRANSFER_RESOURCE_NOT_FOUND: "No se encontro un recurso del traslado.",
  TRANSFER_NOT_FOUND: "No se encontro el traslado.",
  TRANSFERS_FORBIDDEN_CAMP_SCOPE:
    "No tienes acceso a traslados de ese campamento.",
  TRANSFERS_FORBIDDEN_ROLE: "Tu rol no puede gestionar traslados.",
  TRANSFERS_INSUFFICIENT_RESOURCE:
    "No hay recursos suficientes para completar el traslado.",
  TRANSFERS_INVALID_DESTINY_AUTHORITY:
    "Ese estado debe gestionarse desde el campamento destino.",
  TRANSFERS_INVALID_ORIGIN_AUTHORITY:
    "Ese estado debe gestionarse desde el campamento origen.",
  TRANSFERS_INVALID_STATE_TRANSITION:
    "El traslado no puede cambiar a ese estado.",

  USER_CAMP_NOT_FOUND: "No se encontro uno de los campamentos asignados.",
  USER_EMAIL_ALREADY_EXISTS: "Ya existe un usuario con ese email.",
  USER_INVALID_CAMP_STATUS:
    "Solo se pueden asignar usuarios a campamentos activos.",
  USER_NOT_FOUND: "No se encontro el usuario.",
  USER_PASSWORD_REQUIRED: "La contrasena es obligatoria para crear usuario.",
  USER_PERSON_ALREADY_LINKED:
    "La persona seleccionada ya esta vinculada a otro usuario.",
  USER_PERSON_CAMP_MISMATCH:
    "La persona seleccionada pertenece a otro campamento.",
  USER_PERSON_NOT_ELIGIBLE:
    "La persona debe estar activa y aceptada para vincularse.",
  USER_PERSON_NOT_FOUND: "No se encontro la persona seleccionada.",
  USER_ROLE_NOT_FOUND: "No se encontro el rol seleccionado.",
  USER_ROLE_REQUIRED: "Selecciona un rol.",
  USER_SUPERADMIN_REQUIRED: "Solo SuperAdmin puede gestionar usuarios.",
  USER_USERNAME_ALREADY_EXISTS: "Ya existe un usuario con ese nombre.",
  USER_USERNAME_REQUIRED: "El nombre de usuario es obligatorio.",

  VALIDATION_ERROR: "Datos invalidos.",
  ZONE_CAMP_NOT_FOUND: "No se encontro el campamento de la zona.",
  ZONE_FORBIDDEN: "No tienes acceso a esa zona.",
  ZONE_INVALID_CAMP_STATUS:
    "Solo se pueden gestionar zonas en campamentos activos.",
  ZONE_NOT_FOUND: "No se encontro la zona.",
};

function withRequestId(message: string, requestId?: string) {
  return requestId ? `${message} (Ref: ${requestId})` : message;
}

export function getErrorMessage(code: ApiErrorCode): string {
  switch (code) {
    case "UNAUTHORIZED":
      return "Credenciales incorrectas";

    case "BAD_REQUEST":
      return "Datos invalidos";

    case "FORBIDDEN":
      return "No tienes permiso para realizar esta accion";

    case "NOT_FOUND":
      return "No se encontro el registro";

    case "CONFLICT":
      return "La operacion no se puede completar con el estado actual";

    case "SERVER_ERROR":
      return "El servidor no pudo completar la operacion";

    case "UNKNOWN":
      return "Ocurrio un error inesperado";

    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}

export function mapErrorToMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message =
      error.serverCode && serverMessages[error.serverCode]
        ? serverMessages[error.serverCode]
        : getErrorMessage(error.code);

    return withRequestId(message, error.requestId);
  }

  return "Ocurrio un error inesperado";
}
