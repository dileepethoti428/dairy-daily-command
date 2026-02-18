import { Clock, XCircle, LogOut, CheckCircle, ShieldOff, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ApplicationPendingProps {
  status: 'pending' | 'rejected' | 'deactivated';
  rejectionReason?: string | null;
}

export default function ApplicationPending({ status, rejectionReason }: ApplicationPendingProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const icon = () => {
    if (status === 'pending') {
      return (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
      );
    }
    if (status === 'deactivated') {
      return (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShieldOff className="h-10 w-10 text-muted-foreground" />
        </div>
      );
    }
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-10 w-10 text-destructive" />
      </div>
    );
  };

  const title = () => {
    if (status === 'pending') return 'Application Under Review';
    if (status === 'deactivated') return 'Account Deactivated';
    return 'Application Not Approved';
  };

  const description = () => {
    if (status === 'pending') return 'Your application has been submitted and is being reviewed by an admin.';
    if (status === 'deactivated') return 'Your account has been deactivated. Please contact customer care for assistance.';
    return 'Your application was not approved at this time.';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-dairy text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            {icon()}
          </div>
          <CardTitle className="text-xl font-semibold">{title()}</CardTitle>
          <CardDescription className="text-base mt-2">{description()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'pending' && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">What happens next?</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    An admin will review your application. Once approved, you'll be able to log in and access the platform.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'deactivated' && (
            <div className="rounded-lg bg-muted border border-border p-4 text-left">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Customer Care</p>
                  <a
                    href="tel:+917842343642"
                    className="text-sm text-primary font-semibold hover:underline"
                  >
                    +91-7842343642
                  </a>
                </div>
              </div>
            </div>
          )}

          {status === 'rejected' && rejectionReason && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-left">
              <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{rejectionReason}</p>
            </div>
          )}

          {status === 'rejected' && (
            <p className="text-sm text-muted-foreground">
              If you believe this was a mistake, please contact support for assistance.
            </p>
          )}

          <Button
            variant="outline"
            className="w-full h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
