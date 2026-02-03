import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { MilkEntryForm, type MilkEntryFormValues } from '@/components/milk/MilkEntryForm';
import { useCreateMilkEntry, useCheckDuplicateEntry } from '@/hooks/useMilkEntries';
import { useFarmer } from '@/hooks/useFarmers';
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
import { ArrowLeft, CheckCircle2, Home, Plus } from 'lucide-react';

export default function MilkEntryAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFarmerId = searchParams.get('farmerId') || '';
  const { toast } = useToast();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const [showSuccess, setShowSuccess] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<
    (MilkEntryFormValues & { total_amount: number }) | null
  >(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: preselectedFarmer } = useFarmer(preselectedFarmerId);
  const createMilkEntry = useCreateMilkEntry();

  const handleSubmit = async (values: MilkEntryFormValues & { total_amount: number }) => {
    // Check for duplicate before submitting
    setPendingSubmission(values);

    try {
      await createMilkEntry.mutateAsync({
        farmer_id: values.farmer_id,
        entry_date: today,
        quantity_liters: values.quantity_liters,
        fat_percentage: values.fat_percentage,
        snf_percentage: values.snf_percentage,
        rate_per_litre: values.rate_per_litre,
        total_amount: values.total_amount,
      });

      setShowSuccess(true);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        setShowDuplicateWarning(true);
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save entry',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    setPendingSubmission(null);
    // Navigate to fresh add page without farmerId
    navigate('/milk/add', { replace: true });
  };

  const handleGoHome = () => {
    if (preselectedFarmerId) {
      navigate(`/farmers/${preselectedFarmerId}`);
    } else {
      navigate('/');
    }
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Add Milk Entry</h1>
        </div>

        <MilkEntryForm
          initialValues={
            preselectedFarmerId ? { farmer_id: preselectedFarmerId } : undefined
          }
          initialFarmerName={preselectedFarmer?.full_name}
          onSubmit={handleSubmit}
          isSubmitting={createMilkEntry.isPending}
          submitLabel="Save Entry"
          farmerDisabled={!!preselectedFarmerId}
          date={today}
          isAdmin={isAdmin}
        />
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-6 w-6" />
              Entry Saved!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Milk entry has been recorded successfully.
              {pendingSubmission && (
                <span className="mt-2 block text-lg font-medium text-foreground">
                  Total: ₹{pendingSubmission.total_amount.toLocaleString('en-IN')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleGoHome}
            >
              <Home className="mr-2 h-4 w-4" />
              {preselectedFarmerId ? 'Back to Farmer' : 'Go Home'}
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleAddAnother}>
              <Plus className="mr-2 h-4 w-4" />
              Add Another Entry
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Warning Dialog */}
      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entry Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              An entry for this farmer has already been recorded today. Each farmer
              can only have one milk entry per day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDuplicateWarning(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
