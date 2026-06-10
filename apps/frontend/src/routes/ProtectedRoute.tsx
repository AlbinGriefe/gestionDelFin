import { Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/context/useAuth";

interface Props {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const normalizedRole = user.roleName.trim().toLowerCase();
    const isAllowed = allowedRoles?.some(
        role => role.trim().toLowerCase() === normalizedRole,
    );

    if (allowedRoles && !isAllowed) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
