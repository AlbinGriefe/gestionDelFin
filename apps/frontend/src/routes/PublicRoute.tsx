import { Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";

interface Props {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: Props) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
