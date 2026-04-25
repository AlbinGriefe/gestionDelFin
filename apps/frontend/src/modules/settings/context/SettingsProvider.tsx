import { useState, useCallback } from "react";
import { SettingsContext } from "./settings.context";
import { settingsApi } from "../api/settings.api";

import type {
    SettingWriteInput,
    SettingSummary,
    SettingsCollection,
} from "../types/settings.types";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [publicSettings, setPublicSettings] = useState<SettingsCollection | null>(null);
    const [settings, setSettings] = useState<SettingsCollection | null>(null);
    const [loading, setLoading] = useState(false);

    const loadPublicSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingsApi.getPublicSettings();
            setPublicSettings(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingsApi.listSettings();
            setSettings(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const getSettingByKey = async (key: string): Promise<SettingSummary> => {
        return settingsApi.getSettingByKey(key);
    };

    const updateSetting = async (
        key: string,
        data: SettingWriteInput
    ): Promise<SettingSummary> => {
        const updated = await settingsApi.updateSetting(key, data);

        await Promise.all([
            loadSettings(),
            loadPublicSettings(),
        ]);

        return updated;
    };

    return (
        <SettingsContext.Provider
            value={{
                publicSettings,
                settings,
                loading,
                getSettingByKey,
                loadPublicSettings,
                loadSettings,
                updateSetting,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}