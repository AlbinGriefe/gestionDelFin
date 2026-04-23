import { useNavigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";
import LogoutIcon from "../assets/user-logout.svg?react";
import styles from "./HomePage.module.css";

export default function MainPage() {

    const navigate = useNavigate();
    const { logout } = useAuth();

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
                onClick={logout}
                className={styles.logoutButton}
            >
                <LogoutIcon width={50} />
            </button>
        </div>
    );
}
