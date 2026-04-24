import { useNavigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";
import LogoutIcon from "../assets/user-logout.svg?react";
import styles from "./HomePage.module.css";
import { toast } from "sonner";

export default function MainPage() {

    const navigate = useNavigate();
    const { logout } = useAuth();

    function handleLogout() {
        logout();
        toast.success("Sesión cerrada");
    }

    return (
        <div className={styles.cardStyle}>
            <button
                id="usrButton"
                onClick={() => navigate("/users")}
                className={styles.toolBarButton}
                title="Gestionar Usuarios"
            >
                Usuarios
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
    );
}
