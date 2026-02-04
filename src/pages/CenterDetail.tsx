import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCollectionCenter, useToggleCenterStatus } from '@/hooks/useCollectionCenters';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  AlertCircle,
  Power,
  PowerOff,
} from 'lucide-react';
import { format } from 'date-fns';

export default function CenterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: center, isLoading, error } = useCollectionCenter(id || '');
  const toggleStatus = useToggleCenterStatus();
  
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              Only administrators can view center details.
            </p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !center) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Center Not Found</h1>
            <Button className="mt-4" onClick={() => navigate('/centers')}>
              Back to Centers
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleToggleStatus = () => {
    toggleStatus.mutate(
      { id: center.id, is_active: !center.is_active },
      { onSuccess: () => setConfirmDialog(false) }
    );
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/centers')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{center.name}</h1>
                <Badge variant={center.is_active ? 'default' : 'secondary'}>
                  {center.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm font-mono text-muted-foreground">{center.code}</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigate(`/centers/${id}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* Center Details */}
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Center Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Center Code</p>
                <p className="font-mono font-medium">{center.code}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{center.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>

            {center.village_or_area && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Village / Area</p>
                  <p className="font-medium">{center.village_or_area}</p>
                </div>
              </div>
            )}

            {center.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{center.address}</p>
                </div>
              </div>
            )}

            {center.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Phone</p>
                  <p className="font-medium">{center.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Info */}
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(center.created_at), 'PPp')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{format(new Date(center.updated_at), 'PPp')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(`/centers/${id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Center Details
            </Button>

            <Button
              variant={center.is_active ? 'outline' : 'default'}
              className={center.is_active ? 'w-full justify-start text-destructive hover:bg-destructive/10' : 'w-full justify-start'}
              onClick={() => setConfirmDialog(true)}
            >
              {center.is_active ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate Center
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate Center
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {center.is_active ? 'Deactivate' : 'Activate'} {center.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {center.is_active ? (
                <>
                  Deactivating this center will prevent new milk entries from being recorded.
                  All historical data will be preserved.
                </>
              ) : (
                <>
                  Activating this center will allow new milk entries to be recorded at this location.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={center.is_active ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {center.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
