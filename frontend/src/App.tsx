import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "./components/AppLayout";
import { Loading } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import AIQuery from "./pages/AIQuery";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import MyRequests from "./pages/MyRequests";
import NotFound from "./pages/NotFound";
import ParcelDetails from "./pages/ParcelDetails";
import ParcelExplorer from "./pages/ParcelExplorer";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import AdminRequests from "./pages/admin/AdminRequests";
import DataIntegration from "./pages/admin/DataIntegration";
import ParcelManagement from "./pages/admin/ParcelManagement";
import UserManagement from "./pages/admin/UserManagement";

function Protected({ children, staff, admin }: { children: ReactNode; staff?: boolean; admin?: boolean }) {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen"><Loading label="Restoring session…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if ((staff && !isStaff) || (admin && !isAdmin)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : <>{children}</>;
}

export default function App() {
  const { resolved } = useTheme();
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/app" element={<Protected><AppLayout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="explorer" element={<ParcelExplorer />} />
          <Route path="parcels/:parcelId" element={<ParcelDetails />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="query" element={<AIQuery />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin/integrations" element={<Protected staff><DataIntegration /></Protected>} />
          <Route path="admin/parcels" element={<Protected staff><ParcelManagement /></Protected>} />
          <Route path="admin/requests" element={<Protected staff><AdminRequests /></Protected>} />
          <Route path="admin/users" element={<Protected admin><UserManagement /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" theme={resolved} closeButton />
    </>
  );
}
