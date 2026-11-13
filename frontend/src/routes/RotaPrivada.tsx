import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Carregando } from '../components/Carregando';
import { useAuth } from '../contexts/AuthContext';

export function RotaPrivada({ apenasAdmin = false }: { apenasAdmin?: boolean }) {
  const { usuario, carregando, ehAdmin } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
  if (apenasAdmin && !ehAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
