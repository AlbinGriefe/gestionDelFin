import { useContext } from "react";
import { CampsContext } from "./camps.context";

export function useCamps() {
    const context = useContext(CampsContext);
    if (!context) throw new Error("useCamps debe usarse dentro de CampsProvider");
    return context;
}