import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

import styles from "./StatePage.module.css";

export default function UnauthorizedPage() {
  return (
    <main className={styles.page}>
      <LockKeyhole size={32} />
      <span>Acceso restringido</span>
      <h1>Tu rol no puede operar esta seccion.</h1>
      <p>Vuelve al resumen para continuar con las funciones autorizadas.</p>
      <Link to="/home">
        <ArrowLeft size={17} /> Volver al resumen
      </Link>
    </main>
  );
}
