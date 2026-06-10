import { useNavigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";
import LogoutIcon from "../assets/user-logout.svg?react";
import styles from "./HomePage.module.css";
import { toast } from "sonner";
import ResourceAlertsBanner from "../components/ResourceAlertsBanner";

export default function MainPage() {

    const navigate = useNavigate();
    const { logout } = useAuth();

    function handleLogout() {
        logout();
        toast.success("Sesión cerrada");
    }

    return (
        <div style={{ padding: "24px 32px", background: "#f9f9f7", minHeight: "100vh" }}>
        <ResourceAlertsBanner />
        <div className={styles.cardStyle}>
            <button
                onClick={() => navigate("/users")}
                className={styles.toolBarButton}
                title="Gestionar Usuarios"
            >
                Usuarios
            </button>
            <button
                onClick={() => navigate("/camps")}
                className={styles.toolBarButton}
                title="Gestionar Campamentos"
            >
                Campamentos
            </button>
            <button
                onClick={() => navigate("/persons")}
                className={styles.toolBarButton}
                title="Gestionar Personas"
            >
                Personas
            </button>
            <button
                onClick={() => navigate("/inventory")}
                className={styles.toolBarButton}
                title="Bodega e Inventario"
            >
                Inventario
            </button>
            <button
                onClick={() => navigate("/professions")}
                className={styles.toolBarButton}
                title="Gestionar Profesiones"
            >
                Profesiones
            </button>
            <button
                onClick={() => navigate("/sessions")}
                className={styles.toolBarButton}
                title="Sesiones activas"
            >
                Sesiones
            </button>
            <button
                onClick={() => navigate("/daily-processes")}
                className={styles.toolBarButton}
                title="Procesos diarios"
            >
                Procesos diarios
            </button>
            <button
                onClick={() => navigate("/expeditions")}
                className={styles.toolBarButton}
                title="Gestionar Expediciones"
            >
                Expediciones
            </button>
            <button
                onClick={() => navigate("/transfers")}
                className={styles.toolBarButton}
                title="Traslados entre campamentos"
            >
                Traslados
            </button>
            <button
                id="usrLogout"
                title="Cerrar sesión"
                onClick={handleLogout}
                className={styles.logoutButton}
            >
                <LogoutIcon width={50} />
            </button>
        </div>
        </div>
    );
}
