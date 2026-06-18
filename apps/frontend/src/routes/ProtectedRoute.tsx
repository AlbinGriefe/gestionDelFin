import { Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";
import { canAccessRole } from "../shared/auth/roles";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = canAccessRole(user.roleName, allowedRoles);

  if (allowedRoles && !isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
