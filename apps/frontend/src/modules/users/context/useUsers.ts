import { useContext } from "react";
import { UsersContext } from "./users.context";

export function useUsers() {
    const context = useContext(UsersContext);
    if (!context) throw new Error("useUsers debe usarse dentro de UsersProvider");
    return context;
}