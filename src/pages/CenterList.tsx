import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAllCollectionCenters, useToggleCenterStatus } from '@/hooks/useCollectionCenters';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CenterList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: centers, isLoading } = useAllCollectionCenters();
  const toggleStatus = useToggleCenterStatus();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    centerId: string;
    centerName: string;
    action: 'activate' | 'deactivate';
  }>({
    open: false,
    centerId: '',
    centerName: '',
    action: 'deactivate',
  });

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              Only administrators can manage collection centers.
            </p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
    setConfirmDialog({
      open: true,
      centerId: id,
      centerName: name,
      action: currentStatus ? 'deactivate' : 'activate',
    });
  };

  const confirmToggle = () => {
    toggleStatus.mutate({
      id: confirmDialog.centerId,
      is_active: confirmDialog.action === 'activate',
    });
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const activeCenters = centers?.filter(c => c.is_active) || [];
  const inactiveCenters = centers?.filter(c => !c.is_active) || [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Collection Centers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your milk collection locations
            </p>
          </div>
          <Button onClick={() => navigate('/centers/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Center
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : centers?.length === 0 ? (
          <Card className="shadow-dairy">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium">No Collection Centers</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Add your first collection center to start managing milk procurement.
              </p>
              <Button className="mt-4" onClick={() => navigate('/centers/add')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Center
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Centers */}
            {activeCenters.length > 0 && (
              <Card className="shadow-dairy">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    Active Centers ({activeCenters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeCenters.map((center) => (
                    <div
                      key={center.id}
                      className="flex items-center justify-between rounded-lg bg-secondary p-3"
                    >
                      <button
                        className="flex-1 text-left"
                        onClick={() => navigate(`/centers/${center.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{center.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{center.code}</span>
                              {center.village_or_area && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {center.village_or_area}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Inactive Centers */}
            {inactiveCenters.length > 0 && (
              <Card className="border-dashed shadow-dairy">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Building2 className="h-5 w-5" />
                    Inactive Centers ({inactiveCenters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inactiveCenters.map((center) => (
                    <div
                      key={center.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <button
                        className="flex-1 text-left opacity-60"
                        onClick={() => navigate(`/centers/${center.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{center.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                              <span className="font-mono">{center.code}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(center.id, center.name, false)}
                      >
                        Activate
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Activate'} Center?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'deactivate' ? (
                <>
                  Deactivating <strong>{confirmDialog.centerName}</strong> will prevent new entries
                  from being recorded. Historical data will be preserved.
                </>
              ) : (
                <>
                  Activating <strong>{confirmDialog.centerName}</strong> will allow new milk entries
                  to be recorded at this location.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              className={confirmDialog.action === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
