import { createContext } from "react";
import type {
    SettingWriteInput,
    SettingSummary,
    SettingsCollection
} from "../types/settings.types";

export interface SettingsContextType {
    publicSettings: SettingsCollection | null;
    settings: SettingsCollection | null;
    loading: boolean;
    getSettingByKey: (key: string) => Promise<SettingSummary>;
    loadPublicSettings: () => Promise<void>;
    loadSettings: () => Promise<void>;
    updateSetting: (key: string, data: SettingWriteInput) => Promise<SettingSummary>;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);