import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
  useCreatePricingSlab,
  useUpdatePricingSlab,
  PricingSlab,
} from '@/hooks/usePricingSlabs';

const formSchema = z.object({
  min_fat: z.coerce.number().min(0, 'Min FAT must be 0 or greater').max(15, 'Max FAT is 15'),
  max_fat: z.coerce.number().min(0, 'Max FAT must be 0 or greater').max(15, 'Max FAT is 15'),
  min_snf: z.coerce.number().min(0).max(15).optional().or(z.literal('')),
  max_snf: z.coerce.number().min(0).max(15).optional().or(z.literal('')),
  rate_per_litre: z.coerce.number().min(0, 'Rate must be positive'),
  is_active: z.boolean(),
}).refine((data) => data.max_fat >= data.min_fat, {
  message: 'Max FAT must be greater than or equal to Min FAT',
  path: ['max_fat'],
});

type FormValues = z.infer<typeof formSchema>;

interface PricingSlabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSlab: PricingSlab | null;
}

export function PricingSlabDialog({
  open,
  onOpenChange,
  editingSlab,
}: PricingSlabDialogProps) {
  const createSlab = useCreatePricingSlab();
  const updateSlab = useUpdatePricingSlab();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      min_fat: 0,
      max_fat: 0,
      min_snf: '',
      max_snf: '',
      rate_per_litre: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editingSlab) {
        form.reset({
          min_fat: editingSlab.min_fat,
          max_fat: editingSlab.max_fat,
          min_snf: editingSlab.min_snf ?? '',
          max_snf: editingSlab.max_snf ?? '',
          rate_per_litre: editingSlab.rate_per_litre,
          is_active: editingSlab.is_active,
        });
      } else {
        form.reset({
          min_fat: 0,
          max_fat: 0,
          min_snf: '',
          max_snf: '',
          rate_per_litre: 0,
          is_active: true,
        });
      }
    }
  }, [open, editingSlab, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      min_fat: values.min_fat,
      max_fat: values.max_fat,
      min_snf: values.min_snf === '' ? null : Number(values.min_snf),
      max_snf: values.max_snf === '' ? null : Number(values.max_snf),
      rate_per_litre: values.rate_per_litre,
      is_active: values.is_active,
    };

    try {
      if (editingSlab) {
        await updateSlab.mutateAsync({ id: editingSlab.id, ...payload });
      } else {
        await createSlab.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const isPending = createSlab.isPending || updateSlab.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSlab ? 'Edit Rate Slab' : 'Add Rate Slab'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_fat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min FAT %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_fat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max FAT %</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_snf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min SNF % (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_snf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max SNF % (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rate_per_litre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Litre (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable this rate slab for calculations
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSlab ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
