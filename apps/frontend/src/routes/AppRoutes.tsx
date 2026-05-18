import ProtectedRoute from "./ProtectedRoute";
import UsersPage from "../pages/UsersPage";
import CampsPage from "../pages/CampsPage";
import PersonsPage from "../pages/PersonsPage";
import InventoryPage from "../pages/InventoryPage";
import { Routes, Route } from 'react-router-dom';
import LoginPage from "../pages/LoginPage";
import MainPage from "../pages/HomePage";
import RootRedirect from "./RootRedirect";
import PublicRoute from "./PublicRoute";
import { UsersProvider } from "../modules/users/context/UsersProvider";
import { CampsProvider } from "../modules/camps/context/CampsProvider";
import { PersonsProvider } from "../modules/persons/context/PersonsProvider";
import { InventoryProvider } from "../modules/inventory/context/InventoryProvider";

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
                    }
                />
                <Route
                    path="/camps"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema"]}>
                            <CampsProvider>
                                <CampsPage />
                            </CampsProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/persons"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema"]}>
                            <PersonsProvider>
                                <PersonsPage />
                            </PersonsProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema", "gestion recursos", "trabajador"]}>
                            <InventoryProvider>
                                <InventoryPage />
                            </InventoryProvider>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}