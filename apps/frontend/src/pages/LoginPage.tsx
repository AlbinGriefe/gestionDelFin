import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import LoginForm from "../modules/auth/components/LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/play">
        <ArrowLeft size={17} /> Volver
      </Link>
      <section className={styles.login}>
        <div className={styles.brand}>GF</div>
        <span>Gestion del Fin</span>
        <h1>Acceso al centro operativo</h1>
        <p>Utiliza la cuenta asignada a tu rol y campamento.</p>
        <div className={styles.formSurface}>
          <LoginForm />
        </div>
        <small>
          <ShieldCheck size={14} /> Sesion protegida con cierre por inactividad
        </small>
      </section>
    </main>
  );
}
