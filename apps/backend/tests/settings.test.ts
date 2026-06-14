import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/settings/settings.repository.js", () => ({
  settingsRepository: {
    findSettingByKey: vi.fn(),
    upsertSetting: vi.fn(),
  },
}));

import { settingsRepository } from "../src/modules/settings/settings.repository.js";
import { settingsService } from "../src/modules/settings/settings.service.js";

const administrator = {
  id: 1,
  username: "admin",
  roleName: "Administrador sistema",
  campId: 1,
  personId: 1,
  sessionId: "test-session",
};

describe("system settings", () => {
  beforeEach(() => {
    vi.mocked(settingsRepository.findSettingByKey).mockResolvedValue(null);
  });

  it.each([0, 1441, 2.5])(
    "rejects an unsafe inactivity timeout: %s",
    async (value) => {
      await expect(
        settingsService.upsertSetting(
          "session_timeout_minutes",
          {
            value,
            valueType: "integer",
            isPublic: true,
          },
          administrator,
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "SETTINGS_INVALID_TIMEOUT_VALUE",
      });
    },
  );
});
