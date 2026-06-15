import { useEffect, useState } from "react";

import { useAuth } from "../modules/auth/context/useAuth";
import CampMap from "../modules/camps/components/CampMap";
import type {
  CampMapCamp,
  TransferRoute,
} from "../modules/camps/components/CampMap";
import { httpClient } from "../shared/api/httpClient";
import styles from "./MapPage.module.css";

type TransfersResponse = {
  items: Array<{
    id: number;
    state: string;
    originCamp: { id: number };
    destinyCamp: { id: number };
  }>;
};

export default function MapPage() {
  const { user } = useAuth();
  const [camps, setCamps] = useState<CampMapCamp[]>([]);
  const [routes, setRoutes] = useState<TransferRoute[]>([]);

  useEffect(() => {
    httpClient<CampMapCamp[]>("/camps/locations")
      .then(setCamps)
      .catch(() => undefined);
    httpClient<TransfersResponse>("/transfers?pageSize=100")
      .then((response) =>
        setRoutes(
          response.items.map((transfer) => ({
            id: transfer.id,
            fromCampId: transfer.originCamp.id,
            toCampId: transfer.destinyCamp.id,
            state: transfer.state,
          })),
        ),
      )
      .catch(() => undefined);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <span>Cartografia de la red</span>
        <h2>Mapa de campamentos</h2>
        <p>Ubicacion de las bases y rutas de traslado entre ellas.</p>
      </div>

      <CampMap camps={camps} routes={routes} activeCampId={user?.campId} />

      <div className={styles.legend}>
        <span>
          <i className={styles.dotActive} /> Campamento activo
        </span>
        <span>
          <i className={styles.lineActive} /> Traslado en curso
        </span>
        <span>
          <i className={styles.lineDone} /> Traslado completado
        </span>
      </div>
    </div>
  );
}
