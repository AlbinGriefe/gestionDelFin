import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { mapErrorToMessage } from "../../../shared/errors/errorMapper";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [onSucces, setOnSuccess] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setOnSuccess("");

    try {
      await login(email, password);

      setOnSuccess("Login exitoso");

    } catch (err: unknown) {
      setError(mapErrorToMessage(err));
    }
  };

  return (

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block mb-2 text-sm text-gray-700">
          Correo Electrónico o Nombre de Usuario
        </label>
        <input
          id="email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="usuario@email.com o nombre_usuario"
        />
      </div>

      <div>
        <label htmlFor="password" className="block mb-2 text-sm text-gray-700">
          Contraseña
        </label>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          {onSucces && (
            <p className="text-green-500 text-sm text-center">
              {onSucces}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Iniciar Sesión
      </button>
    </form>
  );
}