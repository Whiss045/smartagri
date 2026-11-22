import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/auth.hook";

// Gate for every private page: wait for the session check, then allow or redirect
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">جارٍ التحميل…</div>;
  return user ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
