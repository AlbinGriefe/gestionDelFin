import { env } from "../../lib/env.js";
import type {
  system_settings,
  system_settings_sts_value_type,
} from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { settingsRepository } from "./settings.repository.js";
import type {
  SettingSummary,
  SettingsCollection,
  SettingWriteInput,
} from "./settings.types.js";

function isSystemAdministrator(user: AuthenticatedUser) {
  return user.roleName.trim().toLocaleLowerCase() === "administrador sistema";
}

function ensureSystemAdministrator(user: AuthenticatedUser) {
  if (!isSystemAdministrator(user)) {
    throw new AppError(
      403,
      "You do not have permission to manage system settings.",
      "SETTINGS_FORBIDDEN_ROLE",
    );
  }
}

function parseStoredValue(
  rawValue: string,
  valueType: system_settings_sts_value_type,
): unknown {
  switch (valueType) {
    case "integer": {
      const parsed = Number.parseInt(rawValue, 10);
      return Number.isNaN(parsed) ? rawValue : parsed;
    }
    case "decimal": {
      const parsed = Number.parseFloat(rawValue);
      return Number.isNaN(parsed) ? rawValue : parsed;
    }
    case "boolean":
      return rawValue === "true";
    case "json":
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    case "string":
    default:
      return rawValue;
  }
}

function serializeValue(
  value: SettingWriteInput["value"],
  valueType: system_settings_sts_value_type,
) {
  switch (valueType) {
    case "integer":
      return String(value);
    case "decimal":
      return String(value);
    case "boolean":
      return String(value);
    case "json":
      return JSON.stringify(value);
    case "string":
    default:
      return String(value);
  }
}

function mapSetting(
  setting: system_settings | null,
  input?: {
    key?: string;
    fallbackValue?: unknown;
    fallbackDescription?: string | null;
    fallbackValueType?: system_settings_sts_value_type;
    fallbackIsPublic?: boolean;
  },
): SettingSummary {
  if (!setting) {
    return {
      id: null,
      key: input?.key ?? "unknown",
      value: input?.fallbackValue ?? null,
      valueType: input?.fallbackValueType ?? "string",
      description: input?.fallbackDescription ?? null,
      isPublic: input?.fallbackIsPublic ?? false,
      updatedAt: null,
      isEffectiveFallback: true,
    };
  }

  return {
    id: setting.id_system_setting,
    key: setting.sts_key,
    value: parseStoredValue(setting.sts_value, setting.sts_value_type),
    valueType: setting.sts_value_type,
    description: setting.sts_description,
    isPublic: setting.sts_is_public,
    updatedAt: setting.sts_updated_at.toISOString(),
    isEffectiveFallback: false,
  };
}

function validateSettingConstraint(input: {
  key: string;
  value: SettingWriteInput["value"];
  valueType: system_settings_sts_value_type;
}) {
  if (input.key !== "session_timeout_minutes") {
    return;
  }

  if (input.valueType !== "integer") {
    throw new AppError(
      400,
      "session_timeout_minutes must use the integer type.",
      "SETTINGS_INVALID_TIMEOUT_TYPE",
    );
  }

  if (!Number.isInteger(input.value) || Number(input.value) <= 0) {
    throw new AppError(
      400,
      "session_timeout_minutes must be a positive integer.",
      "SETTINGS_INVALID_TIMEOUT_VALUE",
    );
  }
}

export class SettingsService {
  async listPublicSettings(): Promise<SettingsCollection> {
    const settings = await settingsRepository.listSettings({
      publicOnly: true,
    });
    const items = settings.map((setting) => mapSetting(setting));

    if (!items.some((setting) => setting.key === "session_timeout_minutes")) {
      items.unshift(
        mapSetting(null, {
          key: "session_timeout_minutes",
          fallbackValue: env.SESSION_TIMEOUT_MINUTES,
          fallbackDescription:
            "Maximum inactivity time in minutes before an authenticated session expires.",
          fallbackValueType: "integer",
          fallbackIsPublic: true,
        }),
      );
    }

    return {
      items,
    };
  }

  async listSettings(actor: AuthenticatedUser): Promise<SettingsCollection> {
    ensureSystemAdministrator(actor);

    const settings = await settingsRepository.listSettings();
    const items = settings.map((setting) => mapSetting(setting));

    if (!items.some((setting) => setting.key === "session_timeout_minutes")) {
      items.unshift(
        mapSetting(null, {
          key: "session_timeout_minutes",
          fallbackValue: env.SESSION_TIMEOUT_MINUTES,
          fallbackDescription:
            "Maximum inactivity time in minutes before an authenticated session expires.",
          fallbackValueType: "integer",
          fallbackIsPublic: true,
        }),
      );
    }

    return {
      items,
    };
  }

  async getSettingByKey(key: string, actor: AuthenticatedUser) {
    const setting = await settingsRepository.findSettingByKey(key);

    if (!setting) {
      if (key === "session_timeout_minutes") {
        return mapSetting(null, {
          key,
          fallbackValue: env.SESSION_TIMEOUT_MINUTES,
          fallbackDescription:
            "Maximum inactivity time in minutes before an authenticated session expires.",
          fallbackValueType: "integer",
          fallbackIsPublic: true,
        });
      }

      throw new AppError(404, "Setting not found.", "SETTING_NOT_FOUND");
    }

    if (!setting.sts_is_public && !isSystemAdministrator(actor)) {
      throw new AppError(
        403,
        "You do not have access to this setting.",
        "SETTING_FORBIDDEN",
      );
    }

    return mapSetting(setting);
  }

  async upsertSetting(
    key: string,
    input: SettingWriteInput,
    actor: AuthenticatedUser,
  ) {
    ensureSystemAdministrator(actor);

    const existingSetting = await settingsRepository.findSettingByKey(key);
    const valueType = input.valueType ?? existingSetting?.sts_value_type;

    if (!valueType) {
      throw new AppError(
        400,
        "valueType is required when creating a new setting.",
        "SETTING_VALUE_TYPE_REQUIRED",
      );
    }

    validateSettingConstraint({
      key,
      value: input.value,
      valueType,
    });

    const storedSetting = await settingsRepository.upsertSetting({
      key,
      value: serializeValue(input.value, valueType),
      valueType,
      description:
        input.description !== undefined
          ? input.description
          : (existingSetting?.sts_description ?? null),
      isPublic:
        input.isPublic !== undefined
          ? input.isPublic
          : (existingSetting?.sts_is_public ?? false),
      actorUserId: actor.id,
    });

    return mapSetting(storedSetting);
  }
}

export const settingsService = new SettingsService();
