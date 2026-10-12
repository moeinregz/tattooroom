import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function CustomerProtectedRoute({ children }) {
  const { isAuthed, loading } = useCustomerAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthed) {
    return <Navigate to={`/account/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
}
