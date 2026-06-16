import { ArrowRight, RadioTower, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import campEntry from "../assets/generated/camp-entry.png";
import styles from "./PlayPage.module.css";

export default function PlayPage() {
  return (
    <main
      className={styles.page}
      style={{ backgroundImage: `url(${campEntry})` }}
    >
      <div className={styles.overlay} />
      <section className={styles.content}>
        <div className={styles.brand}>Gestion del Fin</div>
        <p className={styles.eyebrow}>Sistema de coordinacion de campamentos</p>
        <h1>El juego que no es un juego</h1>
        <p className={styles.description}>
          Administra personas, suministros, expediciones y eventos desde un
          centro operativo conectado.
        </p>
        <Link className={styles.primaryAction} to="/login">
          Acceder al sistema <ArrowRight size={18} />
        </Link>
        <div className={styles.signals}>
          <span>
            <ShieldCheck size={16} /> Acceso por rol
          </span>
          <span>
            <RadioTower size={16} /> Operacion por campamento
          </span>
        </div>
      </section>
    </main>
  );
}
