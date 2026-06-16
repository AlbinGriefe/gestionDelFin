import { useRef } from "react";
import type { MouseEvent } from "react";
import { Tent } from "lucide-react";

import styles from "./CampMap.module.css";
import { CAMP_SITES, isValidPos, snapToSite, type MapPos } from "./campSites";

export interface CampMapCamp {
  id: number;
  name: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  occupancy?: { activePersons: number; availableSpots: number };
}

export interface TransferRoute {
  id: number;
  fromCampId: number;
  toCampId: number;
  state: string;
}

const ROUTE_ACTIVE_STATES = ["pending", "accepted", "scheduled", "in_transit"];
const ROUTE_DONE_STATES = ["delivered", "returned", "completed"];

interface CampMapProps {
  camps?: CampMapCamp[];
  routes?: TransferRoute[];
  mode?: "view" | "select";
  value?: MapPos | null;
  onChange?: (pos: MapPos) => void;
  activeCampId?: number;
}

function campToPos(camp: CampMapCamp): MapPos | null {
  const x = camp.longitude;
  const y = camp.latitude;
  if (!isValidPos(x, y)) return null;
  return { x: Number(x), y: Number(y) };
}

function statusClass(status: string) {
  if (status === "active") return styles.markerActive;
  if (status === "destroyed") return styles.markerDanger;
  return styles.markerMuted;
}

export default function CampMap({
  camps = [],
  routes = [],
  mode = "view",
  value,
  onChange,
  activeCampId,
}: CampMapProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (mode !== "select" || !onChange || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const rawX = (event.clientX - rect.left) / rect.width;
    const rawY = (event.clientY - rect.top) / rect.height;
    const clamped: MapPos = {
      x: Math.min(1, Math.max(0, rawX)),
      y: Math.min(1, Math.max(0, rawY)),
    };
    onChange(snapToSite(clamped).pos);
  };

  const placedCamps = camps
    .map((camp) => ({ camp, pos: campToPos(camp) }))
    .filter((entry): entry is { camp: CampMapCamp; pos: MapPos } =>
      Boolean(entry.pos),
    );

  const posById = new Map<number, MapPos>(
    placedCamps.map((entry) => [entry.camp.id, entry.pos]),
  );

  const drawableRoutes = routes
    .filter(
      (route) =>
        ROUTE_ACTIVE_STATES.includes(route.state) ||
        ROUTE_DONE_STATES.includes(route.state),
    )
    .map((route) => ({
      route,
      from: posById.get(route.fromCampId),
      to: posById.get(route.toCampId),
    }))
    .filter(
      (entry): entry is { route: TransferRoute; from: MapPos; to: MapPos } =>
        Boolean(entry.from) && Boolean(entry.to),
    );

  return (
    <div className={styles.wrapper}>
      <div
        ref={frameRef}
        className={`${styles.frame} ${mode === "select" ? styles.selectable : ""}`}
        onClick={handleClick}
      >
        <img
          className={styles.image}
          src="/camp-map.png"
          alt="Mapa de campamentos"
        />
        <span className={styles.scanline} aria-hidden />

        {drawableRoutes.length > 0 && (
          <svg
            className={styles.routes}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {drawableRoutes.map(({ route, from, to }) => (
              <line
                key={route.id}
                x1={from.x * 100}
                y1={from.y * 100}
                x2={to.x * 100}
                y2={to.y * 100}
                vectorEffect="non-scaling-stroke"
                className={`${styles.route} ${
                  ROUTE_DONE_STATES.includes(route.state)
                    ? styles.routeDone
                    : styles.routeActive
                }`}
              />
            ))}
          </svg>
        )}

        {mode === "select" &&
          CAMP_SITES.map((site) => (
            <span
              key={site.id}
              className={styles.site}
              style={{ left: `${site.x * 100}%`, top: `${site.y * 100}%` }}
              title={site.name}
            >
              <span className={styles.siteRing} />
              <span className={styles.siteLabel}>{site.name}</span>
            </span>
          ))}

        {placedCamps.map(({ camp, pos }) => (
          <span
            key={camp.id}
            className={`${styles.marker} ${statusClass(camp.status)} ${
              camp.id === activeCampId ? styles.markerCurrent : ""
            }`}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
          >
            <span className={styles.ping} />
            <span className={styles.dot}>
              <Tent size={15} strokeWidth={2.2} />
            </span>
            <span className={styles.label}>
              <strong>{camp.name}</strong>
              <small>
                {camp.occupancy
                  ? `${camp.occupancy.activePersons}/${camp.occupancy.activePersons + camp.occupancy.availableSpots} · `
                  : ""}
                {camp.status}
              </small>
            </span>
          </span>
        ))}

        {mode === "select" && value && isValidPos(value.x, value.y) && (
          <span
            className={`${styles.marker} ${styles.markerSelected}`}
            style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
          >
            <span className={styles.ping} />
            <span className={styles.dot}>
              <Tent size={15} strokeWidth={2.2} />
            </span>
          </span>
        )}
      </div>

      {mode === "select" && (
        <p className={styles.hint}>
          Selecciona uno de los puntos disponibles: zonas despejadas de zombies
          y listas para levantar un campamento.
        </p>
      )}
    </div>
  );
}
