import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "sonner";
import { useAuth } from "./modules/auth/context/useAuth";
import { IdleManager } from "./modules/auth/components/IdleManager";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  return (
    <>
      <IdleManager>
        <AppRoutes />
      </IdleManager>
      <Toaster position="top-right" duration={3000} />
    </>
  );
}

export default App;
