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

    if (allowedRoles && !allowedRoles.includes(user.roleName)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}