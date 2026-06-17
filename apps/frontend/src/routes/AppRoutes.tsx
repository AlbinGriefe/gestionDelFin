import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "../layouts/AppShell";
import AchievementsPage from "../pages/AchievementsPage";
import MapPage from "../pages/MapPage";
import { CampsProvider } from "../modules/camps/context/CampsProvider";
import { DailyProcessesProvider } from "../modules/daily-processes/context/DailyProcessesProvider";
import { ExpeditionsProvider } from "../modules/expeditions/context/ExpeditionsProvider";
import { InventoryProvider } from "../modules/inventory/context/InventoryProvider";
import { PersonsProvider } from "../modules/persons/context/PersonsProvider";
import { ProfessionsProvider } from "../modules/professions/context/ProfessionsProvider";
import { SessionsProvider } from "../modules/sessions/context/SessionsProvider";
import { TransfersProvider } from "../modules/transfers/context/TransfersProvider";
import { UsersProvider } from "../modules/users/context/UsersProvider";
import CampsPage from "../pages/CampsPage";
import DailyProcessesPage from "../pages/DailyProcessesPage";
import EventsPage from "../pages/EventsPage";
import ExpeditionsPage from "../pages/ExpeditionsPage";
import HomePage from "../pages/HomePage";
import InventoryPage from "../pages/InventoryPage";
import LoginPage from "../pages/LoginPage";
import PersonsPage from "../pages/PersonsPage";
import PlayPage from "../pages/PlayPage";
import ProfessionsPage from "../pages/ProfessionsPage";
import SessionsPage from "../pages/SessionsPage";
import SettingsPage from "../pages/SettingsPage";
import TransfersPage from "../pages/TransfersPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import UsersPage from "../pages/UsersPage";
import ZonesPage from "../pages/ZonesPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RootRedirect from "./RootRedirect";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/play"
        element={
          <PublicRoute>
            <PlayPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <UsersProvider>
                <UsersPage />
              </UsersProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/camps"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <CampsProvider>
                <CampsPage />
              </CampsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/persons"
          element={
            <ProtectedRoute
              allowedRoles={["administrador sistema", "gestion recursos"]}
            >
              <PersonsProvider>
                <PersonsPage />
              </PersonsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <InventoryProvider>
              <InventoryPage />
            </InventoryProvider>
          }
        />
        <Route
          path="/professions"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
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
            <ProtectedRoute
              allowedRoles={["administrador sistema", "gestion recursos"]}
            >
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
            <ProtectedRoute
              allowedRoles={[
                "administrador sistema",
                "encargado de viajes y comunicacion",
              ]}
            >
              <ExpeditionsProvider>
                <ExpeditionsPage />
              </ExpeditionsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <ProtectedRoute
              allowedRoles={[
                "administrador sistema",
                "gestion recursos",
                "encargado de viajes y comunicacion",
              ]}
            >
              <TransfersProvider>
                <TransfersPage />
              </TransfersProvider>
            </ProtectedRoute>
          }
        />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route
          path="/map"
          element={
            <ProtectedRoute
              allowedRoles={[
                "administrador sistema",
                "gestion recursos",
                "encargado de viajes y comunicacion",
              ]}
            >
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones"
          element={
            <ProtectedRoute
              allowedRoles={[
                "administrador sistema",
                "encargado de viajes y comunicacion",
              ]}
            >
              <ZonesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
