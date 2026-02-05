import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FarmerForm, FarmerFormData } from '@/components/farmers/FarmerForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { CreateCenterDialog } from '@/components/center/CreateCenterDialog';
import { useCreateFarmer, useCollectionCenters } from '@/hooks/useFarmers';
import { useCenter } from '@/contexts/CenterContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Building2 } from 'lucide-react';

export default function FarmerAdd() {
  const [hasChanges, setHasChanges] = useState(false);
  const [showCenterAssignment, setShowCenterAssignment] = useState(false);
  const navigate = useNavigate();
  const createFarmer = useCreateFarmer();
  const { selectedCenter, userAssignedCenter, isLoading: centerLoading } = useCenter();
  const { data: centers, isLoading: centersLoading } = useCollectionCenters();
  const { user, isAdmin } = useAuth();

  // Block navigation when form has unsaved changes
  const { showPrompt, confirmNavigation, cancelNavigation } = useUnsavedChanges({ 
    isDirty: hasChanges 
  });

  // Check if staff needs to be assigned to a center
  useEffect(() => {
    if (!centersLoading && !centerLoading && centers && centers.length > 0) {
      // Only staff users without an assigned center need to select one
      if (!isAdmin && !userAssignedCenter && user) {
        setShowCenterAssignment(true);
      }
    }
  }, [centersLoading, centerLoading, centers, isAdmin, userAssignedCenter, user]);

  const handleSubmit = (data: FarmerFormData) => {
    setHasChanges(false); // Clear changes before submitting
    createFarmer.mutate(
      {
        full_name: data.full_name,
        phone: data.phone,
        village: data.village,
        milk_type: data.milk_type,
        is_active: data.is_active,
        bank_account_holder_name: data.bank_account_holder_name || null,
        bank_account_number: data.bank_account_number || null,
        bank_ifsc: data.bank_ifsc || null,
        bank_name: data.bank_name || null,
        center_id: data.center_id,
      },
      {
        onSuccess: () => {
          navigate('/farmers');
        },
      }
    );
  };

  const handleDirtyChange = (isDirty: boolean) => {
    setHasChanges(isDirty);
  };

  const handleCenterAssigned = () => {
    // Reload the page to refresh context with new assignment
    window.location.reload();
  };

  if (centersLoading || centerLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (!centers || centers.length === 0) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate('/farmers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="rounded-lg bg-warning/10 p-6 text-center">
            <p className="font-medium text-foreground">No Collection Centers</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please create a collection center first before adding farmers.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/centers/add')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Create Collection Center
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Determine default center for the form
  const defaultCenterId = userAssignedCenter?.id || selectedCenter?.id || centers[0]?.id;

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => navigate('/farmers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Farmer
          </h1>
        </div>

        {/* Form */}
        <FarmerForm
          onSubmit={handleSubmit}
          isLoading={createFarmer.isPending}
          centers={centers}
          defaultValues={defaultCenterId ? { center_id: defaultCenterId } : undefined}
          onDirtyChange={handleDirtyChange}
        />
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showPrompt}
        onCancel={cancelNavigation}
        onConfirm={confirmNavigation}
      />

      {/* Create Center Dialog for new staff */}
      {user && (
        <CreateCenterDialog
          open={showCenterAssignment}
          onOpenChange={setShowCenterAssignment}
          userId={user.id}
          onCreated={handleCenterAssigned}
        />
      )}
    </AppLayout>
  );
}
