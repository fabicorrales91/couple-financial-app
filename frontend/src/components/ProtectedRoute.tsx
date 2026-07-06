import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
