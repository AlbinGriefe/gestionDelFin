import type { system_settings_sts_value_type } from "../../generated/prisma/client.js";

export interface SettingWriteInput {
  value: boolean | number | string | Record<string, unknown> | unknown[];
  valueType?: system_settings_sts_value_type;
  description?: string | null;
  isPublic?: boolean;
}

export interface SettingSummary {
  id: number | null;
  key: string;
  value: unknown;
  valueType: system_settings_sts_value_type;
  description: string | null;
  isPublic: boolean;
  updatedAt: string | null;
  isEffectiveFallback: boolean;
}

export interface SettingsCollection {
  items: SettingSummary[];
}
