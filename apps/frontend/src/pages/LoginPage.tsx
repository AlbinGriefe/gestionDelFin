import { ArrowLeft, Radio, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import LoginForm from "../modules/auth/components/LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.haze} aria-hidden />
      <svg
        className={styles.skyline}
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <path
          d="M0 320V170l40-8v-40l28 4v44l60 6V96l34 6v90l52 5V60l60 10v128l44 4V120l30 4v80l70 7V40l54 12v170l48 4V150l34 6v84l64 6V90l40 8v150l58 6V120l30 6v140l72 7V60l50 10v196l46 4V180l34 6v90l60 6V110l40 8v160l56 6V0h160v320Z"
          fill="rgba(12,14,10,0.55)"
        />
        <path
          d="M0 320V230l60-6v-60l40 6v60l70 6V190l50 6v90l60 6V210l44 6v76l64 6V236l40 6v50l70 6V200l54 8v90l50 4V250l40 6v50l66 6V222l44 8v82l60 6V236l50 8v82H0Z"
          fill="rgba(20,24,16,0.8)"
        />
      </svg>
      <span className={styles.vine} aria-hidden />
      <span className={styles.grain} aria-hidden />

      <Link className={styles.back} to="/play">
        <ArrowLeft size={16} /> Volver al refugio
      </Link>

      <section className={styles.login}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>GF</span>
          <span className={styles.hazard} aria-hidden />
        </div>
        <span className={styles.kicker}>
          Gestion del Fin · Red de campamentos
        </span>
        <h1>Acceso al centro operativo</h1>
        <p>
          Identificate con la cuenta asignada a tu rol y campamento. La zona
          esta vigilada.
        </p>

        <div className={styles.formSurface}>
          <svg className={styles.cornerIvy} viewBox="0 0 80 80" aria-hidden>
            <path
              d="M2 2c0 22 8 34 24 40M2 2c14 4 22 12 26 26M2 2c4 14 2 26-4 38"
              fill="none"
              stroke="rgba(122,140,78,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="26" cy="42" r="3.4" fill="rgba(155,176,94,0.6)" />
            <circle cx="28" cy="28" r="3" fill="rgba(122,140,78,0.55)" />
            <circle cx="6" cy="34" r="2.6" fill="rgba(155,176,94,0.5)" />
          </svg>
          <LoginForm />
        </div>

        <small>
          <ShieldCheck size={13} /> Sesion protegida · cierre automatico por
          inactividad
        </small>
        <small className={styles.freq}>
          <Radio size={12} /> Canal seguro 121.5 MHz
        </small>
      </section>
    </main>
  );
}
