import ProtectedRoute from "./ProtectedRoute";
import UsersPage from "../pages/UsersPage";
import { Routes, Route } from 'react-router-dom';
import LoginPage from "../pages/LoginPage";
import MainPage from "../pages/HomePage";
import RootRedirect from "./RootRedirect";
import PublicRoute from "./PublicRoute";
import { UsersProvider } from "../modules/users/context/UsersProvider";

export default function AppRoutes() {

    return (
        <div>
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <MainPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema"]}>
                            <UsersProvider>
                                <UsersPage />
                            </UsersProvider>
                        </ProtectedRoute>
                    } />
            </Routes>
        </div>
    );
}