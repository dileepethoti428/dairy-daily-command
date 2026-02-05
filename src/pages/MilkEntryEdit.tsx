import { useNavigate, useParams } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { MilkEntryForm, type MilkEntryFormValues } from '@/components/milk/MilkEntryForm';
import { useMilkEntry, useUpdateMilkEntry } from '@/hooks/useMilkEntries';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
import { ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function MilkEntryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingValues, setPendingValues] = useState<
    (MilkEntryFormValues & { total_amount: number }) | null
  >(null);

  const { data: entry, isLoading, error } = useMilkEntry(id || '');
  const updateMilkEntry = useUpdateMilkEntry();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !entry) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate('/milk/today')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="rounded-lg bg-destructive/10 p-6 text-center text-destructive">
            Entry not found or an error occurred.
          </div>
        </div>
      </AppLayout>
    );
  }

  const entryDate = parseISO(entry.entry_date);
  const canEdit = isToday(entryDate) || isAdmin; // Admin can edit any open (unlocked) entry
  const isLocked = (entry as any).is_locked === true;

  // Check if entry is locked (part of a locked settlement)
  if (isLocked) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate(`/milk/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="border-destructive shadow-dairy">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <Lock className="h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold">Entry is Locked</h2>
              <p className="text-sm text-muted-foreground">
                This entry belongs to a locked settlement period and cannot be edited.
                Contact an administrator if changes are required.
              </p>
              <Button onClick={() => navigate(`/milk/${id}`)}>
                View Entry Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // For staff, prevent editing past entries
  if (!canEdit) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate(`/milk/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="shadow-dairy">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Cannot Edit Past Entry</h2>
              <p className="text-sm text-muted-foreground">
                This entry was recorded on{' '}
                {format(entryDate, 'dd MMM yyyy')} and can no longer be edited.
                Only same-day entries can be modified by staff. Contact an admin for changes.
              </p>
              <Button onClick={() => navigate(`/milk/${id}`)}>
                View Entry Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = (values: MilkEntryFormValues & { total_amount: number }) => {
    setPendingValues(values);
    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    if (!pendingValues || !id) return;

    try {
      await updateMilkEntry.mutateAsync({
        id,
        entry: {
          quantity_liters: pendingValues.quantity_liters,
          fat_percentage: pendingValues.fat_percentage,
          snf_percentage: pendingValues.snf_percentage,
          rate_per_litre: pendingValues.rate_per_litre,
          total_amount: pendingValues.total_amount,
        },
      });

      toast({
        title: 'Entry Updated',
        description: 'Milk entry has been updated successfully.',
      });

      navigate(`/milk/${id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update entry',
        variant: 'destructive',
      });
    }

    setShowConfirmation(false);
    setPendingValues(null);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => navigate(`/milk/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Edit Entry</h1>
        </div>

        <MilkEntryForm
          initialValues={{
            farmer_id: entry.farmer_id,
            session: (entry as any).session || 'morning',
            quantity_liters: entry.quantity_liters,
            fat_percentage: entry.fat_percentage,
            snf_percentage: entry.snf_percentage,
            rate_per_litre: entry.rate_per_litre || undefined,
          }}
          initialFarmerName={entry.farmers?.full_name}
          onSubmit={handleSubmit}
          isSubmitting={updateMilkEntry.isPending}
          submitLabel="Update Entry"
          farmerDisabled={true}
          date={entry.entry_date}
          isAdmin={isAdmin}
        />

        {/* Cancel Button */}
        <Button
          variant="outline"
          className="mt-4 h-14 w-full"
          onClick={() => navigate(`/milk/${id}`)}
        >
          Cancel
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this milk entry? This will modify
              the recorded data.
              {pendingValues && (
                <span className="mt-2 block text-lg font-medium text-foreground">
                  New Total: ₹{pendingValues.total_amount.toLocaleString('en-IN')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
