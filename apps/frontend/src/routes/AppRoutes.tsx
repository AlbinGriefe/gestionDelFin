import ProtectedRoute from "./ProtectedRoute";
import UsersPage from "../pages/UsersPage";
import CampsPage from "../pages/CampsPage";
import PersonsPage from "../pages/PersonsPage";
import InventoryPage from "../pages/InventoryPage";
import ProfessionsPage from "../pages/ProfessionsPage";
import SessionsPage from "../pages/SessionsPage";
import DailyProcessesPage from "../pages/DailyProcessesPage";
import ExpeditionsPage from "../pages/ExpeditionsPage";
import TransfersPage from "../pages/TransfersPage";
import { Routes, Route } from 'react-router-dom';
import LoginPage from "../pages/LoginPage";
import MainPage from "../pages/HomePage";
import RootRedirect from "./RootRedirect";
import PublicRoute from "./PublicRoute";
import { UsersProvider } from "../modules/users/context/UsersProvider";
import { CampsProvider } from "../modules/camps/context/CampsProvider";
import { PersonsProvider } from "../modules/persons/context/PersonsProvider";
import { InventoryProvider } from "../modules/inventory/context/InventoryProvider";
import { ProfessionsProvider } from "../modules/professions/context/ProfessionsProvider";
import { SessionsProvider } from "../modules/sessions/context/SessionsProvider";
import { DailyProcessesProvider } from "../modules/daily-processes/context/DailyProcessesProvider";
import { ExpeditionsProvider } from "../modules/expeditions/context/ExpeditionsProvider";
import { TransfersProvider } from "../modules/transfers/context/TransfersProvider";

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
                <Route
                    path="/professions"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema", "gestion recursos"]}>
                            <ProfessionsProvider>
                                <ProfessionsPage />
                            </ProfessionsProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sessions"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema"]}>
                            <SessionsProvider>
                                <SessionsPage />
                            </SessionsProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/daily-processes"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema", "gestion recursos"]}>
                            <InventoryProvider>
                                <DailyProcessesProvider>
                                    <DailyProcessesPage />
                                </DailyProcessesProvider>
                            </InventoryProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/expeditions"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema", "encargado de viajes y comunicacion"]}>
                            <ExpeditionsProvider>
                                <ExpeditionsPage />
                            </ExpeditionsProvider>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/transfers"
                    element={
                        <ProtectedRoute allowedRoles={["administrador sistema", "gestion recursos", "encargado de viajes y comunicacion"]}>
                            <TransfersProvider>
                                <TransfersPage />
                            </TransfersProvider>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
}