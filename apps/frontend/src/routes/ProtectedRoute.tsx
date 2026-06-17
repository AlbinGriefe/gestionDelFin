import { Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";
import { roleMatches } from "../shared/auth/roles";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = allowedRoles?.some((role) =>
    roleMatches(user.roleName, role),
  );

  if (allowedRoles && !isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
