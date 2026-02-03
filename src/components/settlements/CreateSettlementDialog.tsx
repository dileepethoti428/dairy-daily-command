import { useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import { useCreateSettlement, useAssignEntriesToSettlement, getSuggestedSettlementDates } from '@/hooks/useSettlements';

const schema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

type FormData = z.infer<typeof schema>;

interface CreateSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: string;
}

export function CreateSettlementDialog({
  open,
  onOpenChange,
  centerId,
}: CreateSettlementDialogProps) {
  const suggestedDates = getSuggestedSettlementDates();
  const createSettlement = useCreateSettlement();
  const assignEntries = useAssignEntriesToSettlement();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: suggestedDates,
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Create the settlement
      const settlement = await createSettlement.mutateAsync({
        center_id: centerId,
        start_date: data.start_date,
        end_date: data.end_date,
      });

      // Assign unassigned entries to this settlement
      await assignEntries.mutateAsync({
        settlementId: settlement.id,
        startDate: data.start_date,
        endDate: data.end_date,
        centerId,
      });

      toast.success('Settlement created successfully');
      reset(suggestedDates);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create settlement');
    }
  };

  const isLoading = createSettlement.isPending || assignEntries.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Create New Settlement
            </DialogTitle>
            <DialogDescription>
              Create a new 15-day settlement period. All unassigned milk entries within this date range will be included.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
                className="h-12"
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
                className="h-12"
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-warning/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">
                  All milk entries within this date range that haven't been assigned to a settlement will be included.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Settlement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
