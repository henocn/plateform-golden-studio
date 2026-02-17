import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Guard: internal users only (super_admin, admin, validator, contributor, viewer).
 * Wraps routes that should never be visible to client users.
 * Optionally restricts to specific roles.
 */
export default function AdminRoute({ allowedRoles }) {
  const { user } = useAuthStore();

  if (user?.user_type !== 'internal') {
    return <Navigate to="/403" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
