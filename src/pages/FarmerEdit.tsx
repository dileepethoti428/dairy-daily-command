import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FarmerForm, FarmerFormData } from '@/components/farmers/FarmerForm';
import { Button } from '@/components/ui/button';
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
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import {
  useFarmer,
  useUpdateFarmer,
  useCollectionCenters,
} from '@/hooks/useFarmers';
import { useFarmerLivestock, useSaveFarmerLivestock, type LivestockInput } from '@/hooks/useFarmerLivestock';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ArrowLeft, Edit } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function FarmerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);
  const [pendingData, setPendingData] = useState<{ form: FarmerFormData; livestock: LivestockInput[] } | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const { showPrompt, confirmNavigation, cancelNavigation } = useUnsavedChanges({
    isDirty: isFormDirty,
    message: 'You have unsaved changes to this farmer. Are you sure you want to leave?',
  });

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsFormDirty(dirty);
  }, []);

  const { data: farmer, isLoading: farmerLoading } = useFarmer(id || '');
  const { data: centers, isLoading: centersLoading } = useCollectionCenters();
  const { data: livestockData, isLoading: livestockLoading } = useFarmerLivestock(id);
  const updateFarmer = useUpdateFarmer();
  const saveLivestock = useSaveFarmerLivestock();

  const handleSubmit = (data: FarmerFormData, livestock: LivestockInput[]) => {
    if (farmer?.is_active && !data.is_active) {
      setPendingData({ form: data, livestock });
      setShowDeactivateWarning(true);
      return;
    }
    performUpdate(data, livestock);
  };

  const performUpdate = (data: FarmerFormData, livestock: LivestockInput[]) => {
    if (!id) return;

    updateFarmer.mutate(
      {
        id,
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
          const validLivestock = livestock.filter(
            (l) => l.breed && l.animal_count > 0 && l.expected_daily_liters > 0
          );
          saveLivestock.mutate(
            { farmerId: id, livestock: validLivestock },
            { onSettled: () => navigate(`/farmers/${id}`) }
          );
        },
      }
    );
  };

  const handleConfirmDeactivate = () => {
    if (pendingData) {
      performUpdate(pendingData.form, pendingData.livestock);
    }
    setShowDeactivateWarning(false);
    setPendingData(null);
  };

  if (farmerLoading || centersLoading || livestockLoading) {
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

  if (!farmer) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate('/farmers')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="rounded-lg bg-destructive/10 p-6 text-center text-destructive">
            Farmer not found.
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!centers || centers.length === 0) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(`/farmers/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="rounded-lg bg-warning/10 p-6 text-center">
            <p className="font-medium text-foreground">No Collection Centers</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Convert livestock data to LivestockInput format
  const defaultLivestock: LivestockInput[] = (livestockData || []).map((l) => ({
    animal_type: l.animal_type as 'cow' | 'buffalo',
    breed: l.breed,
    animal_count: l.animal_count,
    expected_daily_liters: Number(l.expected_daily_liters),
  }));

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate(`/farmers/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Edit className="h-5 w-5 text-primary" /> Edit Farmer
          </h1>
        </div>

        <FarmerForm
          defaultValues={{
            full_name: farmer.full_name,
            phone: farmer.phone || '',
            village: farmer.village || '',
            milk_type: farmer.milk_type || 'cow',
            is_active: farmer.is_active,
            bank_account_holder_name: farmer.bank_account_holder_name || '',
            bank_account_number: farmer.bank_account_number || '',
            bank_ifsc: farmer.bank_ifsc || '',
            bank_name: farmer.bank_name || '',
            center_id: farmer.center_id,
          }}
          defaultLivestock={defaultLivestock}
          onSubmit={handleSubmit}
          isLoading={updateFarmer.isPending || saveLivestock.isPending}
          isEdit
          centers={centers}
          onDirtyChange={handleDirtyChange}
        />

        <AlertDialog open={showDeactivateWarning} onOpenChange={setShowDeactivateWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Farmer?</AlertDialogTitle>
              <AlertDialogDescription>
                Deactivating this farmer will prevent new milk entries from being recorded. The farmer's history will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeactivate}>Deactivate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <UnsavedChangesDialog open={showPrompt} onConfirm={confirmNavigation} onCancel={cancelNavigation} />
      </div>
    </AppLayout>
  );
}
