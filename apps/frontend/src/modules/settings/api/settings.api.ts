import type {
  SettingWriteInput,
  SettingSummary,
  SettingsCollection,
} from "../types/settings.types";

import { httpClient } from "../../../shared/api/httpClient";

async function getSettingByKey(key: string) {
  return httpClient<SettingSummary>(`/settings/${key}`);
}

async function getPublicSettings() {
  return httpClient<SettingsCollection>("/settings/public");
}

async function listSettings() {
  return httpClient<SettingsCollection>("/settings/");
}

async function updateSetting(key: string, data: SettingWriteInput) {
  return httpClient<SettingSummary>(`/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export const settingsApi = {
  getSettingByKey,
  getPublicSettings,
  listSettings,
  updateSetting,
};
