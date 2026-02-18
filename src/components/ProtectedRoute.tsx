import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import ApplicationPending from '@/pages/ApplicationPending';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole, applicationStatus, applicationRejectionReason } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Block non-admin users whose application is pending or rejected
  if (userRole !== 'admin' && applicationStatus === 'pending') {
    return <ApplicationPending status="pending" />;
  }

  if (userRole !== 'admin' && applicationStatus === 'rejected') {
    return (
      <ApplicationPending status="rejected" rejectionReason={applicationRejectionReason} />
    );
  }

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
