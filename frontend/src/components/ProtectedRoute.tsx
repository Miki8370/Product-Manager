import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export const ProtectedRoute = ({ role, children }: { role: UserRole; children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'PENDING') return <Navigate to="/pending-approval" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};
