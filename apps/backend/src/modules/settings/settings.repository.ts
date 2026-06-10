import prisma, { Prisma } from "../../lib/prisma.js";
import type { system_settings_sts_value_type } from "../../generated/prisma/client.js";

function toPrismaJsonValue(value: unknown) {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export class SettingsRepository {
  async listSettings(input?: { publicOnly?: boolean }) {
    return prisma.system_settings.findMany({
      where: input?.publicOnly ? { sts_is_public: true } : undefined,
      orderBy: {
        sts_key: "asc",
      },
    });
  }

  async findSettingByKey(key: string) {
    return prisma.system_settings.findUnique({
      where: {
        sts_key: key,
      },
    });
  }

  async upsertSetting(input: {
    key: string;
    value: string;
    valueType: system_settings_sts_value_type;
    description: string | null;
    isPublic: boolean;
    actorUserId: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const existingSetting = await tx.system_settings.findUnique({
        where: {
          sts_key: input.key,
        },
      });

      const setting = await tx.system_settings.upsert({
        where: {
          sts_key: input.key,
        },
        update: {
          sts_value: input.value,
          sts_value_type: input.valueType,
          sts_description: input.description,
          sts_is_public: input.isPublic,
          sts_updated_at: new Date(),
        },
        create: {
          sts_key: input.key,
          sts_value: input.value,
          sts_value_type: input.valueType,
          sts_description: input.description,
          sts_is_public: input.isPublic,
        },
      });

      await tx.events.create({
        data: {
          id_user: input.actorUserId,
          evt_entity: "system_settings",
          evt_entity_id: setting.id_system_setting,
          evt_action: existingSetting ? "updated" : "created",
          evt_old_value: toPrismaJsonValue(
            existingSetting
              ? {
                  sts_value: existingSetting.sts_value,
                  sts_value_type: existingSetting.sts_value_type,
                  sts_description: existingSetting.sts_description,
                  sts_is_public: existingSetting.sts_is_public,
                }
              : null,
          ),
          evt_new_value: toPrismaJsonValue({
            sts_value: setting.sts_value,
            sts_value_type: setting.sts_value_type,
            sts_description: setting.sts_description,
            sts_is_public: setting.sts_is_public,
          }),
          evt_description: `System setting ${existingSetting ? "updated" : "created"}: ${setting.sts_key}.`,
        },
      });

      return setting;
    });
  }
}

export const settingsRepository = new SettingsRepository();
