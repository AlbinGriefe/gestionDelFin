import { useState } from "react";
import {
  Activity,
  Boxes,
  Building2,
  CalendarClock,
  ChevronDown,
  Clock3,
  Compass,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Radio,
  Settings,
  ShieldCheck,
  TentTree,
  Trophy,
  Truck,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../modules/auth/context/useAuth";
import { useIdleSession } from "../modules/auth/context/useIdleSession";
import styles from "./AppShell.module.css";

function normalizeRole(roleName: string) {
  return roleName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const navigation = [
  { to: "/home", label: "Resumen", icon: LayoutDashboard, roles: ["all"] },
  {
    to: "/persons",
    label: "Personas",
    icon: UsersRound,
    roles: ["administrador sistema", "gestion recursos"],
  },
  {
    to: "/inventory",
    label: "Inventario",
    icon: Boxes,
    roles: ["all"],
  },
  {
    to: "/daily-processes",
    label: "Proceso diario",
    icon: CalendarClock,
    roles: ["gestion recursos"],
  },
  {
    to: "/professions",
    label: "Oficios",
    icon: ShieldCheck,
    roles: ["administrador sistema"],
  },
  {
    to: "/expeditions",
    label: "Expediciones",
    icon: Compass,
    roles: ["encargado de viajes y comunicacion"],
  },
  {
    to: "/zones",
    label: "Zonas",
    icon: TentTree,
    roles: ["administrador sistema", "encargado de viajes y comunicacion"],
  },
  {
    to: "/transfers",
    label: "Traslados",
    icon: Truck,
    roles: [
      "administrador sistema",
      "gestion recursos",
      "encargado de viajes y comunicacion",
    ],
  },
  { to: "/events", label: "Eventos", icon: Radio, roles: ["all"] },
  { to: "/achievements", label: "Logros", icon: Trophy, roles: ["all"] },
  {
    to: "/camps",
    label: "Campamentos",
    icon: Building2,
    roles: ["administrador sistema"],
  },
  {
    to: "/map",
    label: "Mapa",
    icon: MapIcon,
    roles: [
      "administrador sistema",
      "gestion recursos",
      "encargado de viajes y comunicacion",
    ],
  },
  {
    to: "/users",
    label: "Usuarios",
    icon: UserRoundCog,
    roles: ["administrador sistema"],
  },
  {
    to: "/sessions",
    label: "Sesiones",
    icon: Activity,
    roles: ["administrador sistema"],
  },
  {
    to: "/settings",
    label: "Configuracion",
    icon: Settings,
    roles: ["administrador sistema"],
  },
];

const pageTitles: Record<string, string> = {
  "/home": "Centro de operaciones",
  "/persons": "Personas y admision",
  "/inventory": "Inventario",
  "/daily-processes": "Proceso diario",
  "/professions": "Cobertura de oficios",
  "/expeditions": "Expediciones",
  "/zones": "Zonas de exploracion",
  "/transfers": "Traslados",
  "/events": "Eventos narrativos",
  "/achievements": "Logros y progreso",
  "/camps": "Campamentos",
  "/map": "Mapa de campamentos",
  "/users": "Usuarios",
  "/sessions": "Sesiones",
  "/settings": "Configuracion",
};

function formatRemainingTime(remainingSeconds: number | null) {
  if (remainingSeconds === null) return "--:--";

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function AppShell() {
  const { user, logout, switchCamp } = useAuth();
  const { remainingSeconds, isWarning } = useIdleSession();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [changingCamp, setChangingCamp] = useState(false);

  if (!user) return null;

  const role = normalizeRole(user.roleName);
  const visibleNavigation = navigation.filter(
    (item) => item.roles.includes("all") || item.roles.includes(role),
  );

  const handleCampChange = async (campId: number) => {
    if (campId === user.campId) return;
    setChangingCamp(true);
    try {
      await switchCamp(campId);
      toast.success("Campamento activo actualizado");
    } finally {
      setChangingCamp(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sesion cerrada");
  };

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brand}>
          <div className={styles.brandMark}>GF</div>
          <div>
            <strong>Gestion del Fin</strong>
            <span>Operaciones de campamento</span>
          </div>
          <button
            className={styles.mobileClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navigation} aria-label="Navegacion principal">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userBlock}>
            <div className={styles.avatar}>
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <strong>{user.username}</strong>
              <span>{user.roleName}</span>
            </div>
          </div>
          <button
            className={styles.iconButton}
            onClick={() => void handleLogout()}
            title="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className={styles.scrim}
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menu"
        />
      )}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={21} />
          </button>
          <div className={styles.pageIdentity}>
            <span>Panel operativo</span>
            <h1>{pageTitles[location.pathname] ?? "Gestion del Fin"}</h1>
          </div>
          <div
            className={`${styles.idleCountdown} ${
              isWarning ? styles.idleCountdownWarning : ""
            }`}
            aria-label={`Tiempo restante antes del cierre por inactividad: ${formatRemainingTime(remainingSeconds)}`}
            title="Tiempo restante antes del cierre por inactividad"
          >
            <Clock3 size={17} />
            <div>
              <span>Inactividad</span>
              <strong>{formatRemainingTime(remainingSeconds)}</strong>
            </div>
          </div>
          <label className={styles.campSelector}>
            <Building2 size={17} />
            <select
              value={user.campId}
              disabled={changingCamp || user.availableCamps.length < 2}
              onChange={(event) =>
                void handleCampChange(Number(event.target.value))
              }
              aria-label="Campamento activo"
            >
              {user.availableCamps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>
        </header>
        <div className={styles.content} key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
