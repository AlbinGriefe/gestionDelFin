import { useState } from "react";
import { useAuth } from "../context/useAuth";
import styles from "./LoginForm.module.css";
import { toast } from "sonner";

export default function LoginForm() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!identity.trim()) return setError("Ingresa tu correo o nombre de usuario.");
    if (!password.trim()) return setError("Ingresa tu contraseña.");

    try {
      setLoading(true);
      await login(identity, password);
      toast.success("Inicio de sesión exitoso.");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="identity" className={styles.label}>
          Correo electrónico o nombre de usuario
        </label>
        <input
          id="identity"
          type="text"
          value={identity}
          onChange={e => setIdentity(e.target.value)}
          className={styles.input}
          placeholder="usuario@email.com o nombre_usuario"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.label}>
          Contraseña
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
            placeholder="••••••••"
          />
          <button
            type="button"
            className={styles.showPasswordBtn}
            onClick={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={loading}
      >
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}