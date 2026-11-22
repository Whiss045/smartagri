import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import HomePage from "./pages/HomePage";
import ParcelsPage from "./pages/ParcelsPage";
import PlotsPage from "./pages/PlotsPage";
import PlotPage from "./pages/PlotPage";
import ValvesPage from "./pages/ValvesPage";
import SensorsPage from "./pages/SensorsPage";
import SensorPage from "./pages/SensorPage";
import DevicesPage from "./pages/DevicesPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Everything below needs a session; the layout adds header + side menu */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="parcels" element={<ParcelsPage />} />
          <Route path="parcels/:parcelId/plots" element={<PlotsPage />} />
          <Route
            path="parcels/:parcelId/plots/:plotId"
            element={<PlotPage />}
          />
          <Route path="valves" element={<ValvesPage />} />
          <Route path="sensors" element={<SensorsPage />} />
          <Route path="sensors/:sensorId" element={<SensorPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route
            path="devices/unassigned"
            element={<DevicesPage unassignedOnly />}
          />
          <Route path="schedules" element={<SchedulePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
