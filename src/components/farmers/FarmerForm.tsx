import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Phone, MapPin, Milk, Building2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const farmerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Mobile number must be 10 digits').max(15),
  village: z.string().min(1, 'Village is required').max(100),
  milk_type: z.enum(['cow', 'buffalo', 'both']),
  is_active: z.boolean(),
  bank_account_holder_name: z.string().max(100).optional(),
  bank_account_number: z.string().max(20).optional(),
  bank_ifsc: z.string().max(11).optional(),
  bank_name: z.string().max(100).optional(),
  center_id: z.string().uuid('Please select a collection center'),
});

export type FarmerFormData = z.infer<typeof farmerSchema>;

interface FarmerFormProps {
  defaultValues?: Partial<FarmerFormData>;
  onSubmit: (data: FarmerFormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
  centers: Array<{ id: string; name: string; code: string }>;
}

export function FarmerForm({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit = false,
  centers,
}: FarmerFormProps) {
  const { isAdmin } = useAuth();
  const canEditBank = isAdmin || !isEdit;
  const canToggleStatus = isAdmin;

  const [showBankWarning, setShowBankWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<FarmerFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FarmerFormData>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      village: '',
      milk_type: 'cow',
      is_active: true,
      bank_account_holder_name: '',
      bank_account_number: '',
      bank_ifsc: '',
      bank_name: '',
      center_id: centers[0]?.id || '',
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const isActive = watch('is_active');
  const milkType = watch('milk_type');
  const centerId = watch('center_id');

  // Check if bank details changed (for edit mode)
  const hasBankChanges = (data: FarmerFormData) => {
    if (!isEdit || !defaultValues) return false;
    
    return (
      data.bank_account_holder_name !== defaultValues.bank_account_holder_name ||
      data.bank_account_number !== defaultValues.bank_account_number ||
      data.bank_ifsc !== defaultValues.bank_ifsc ||
      data.bank_name !== defaultValues.bank_name
    );
  };

  const handleFormSubmit = (data: FarmerFormData) => {
    // If bank details changed and user is admin, show warning
    if (isEdit && isAdmin && hasBankChanges(data)) {
      setPendingSubmitData(data);
      setShowBankWarning(true);
      return;
    }
    
    onSubmit(data);
  };

  const handleConfirmBankChange = () => {
    if (pendingSubmitData) {
      onSubmit(pendingSubmitData);
    }
    setShowBankWarning(false);
    setPendingSubmitData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic Details Section */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Farmer Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter farmer name"
                {...register('full_name')}
                className={cn(errors.full_name && 'border-destructive')}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number *</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10-digit mobile number"
                {...register('phone')}
                className={cn(errors.phone && 'border-destructive')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="village">Village *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="village"
                  placeholder="Enter village name"
                  className={cn('pl-10', errors.village && 'border-destructive')}
                  {...register('village')}
                />
              </div>
              {errors.village && (
                <p className="text-xs text-destructive">{errors.village.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="center_id">Collection Center *</Label>
              <Select
                value={centerId}
                onValueChange={(value) => setValue('center_id', value)}
              >
                <SelectTrigger className={cn(errors.center_id && 'border-destructive')}>
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select center" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name} ({center.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.center_id && (
                <p className="text-xs text-destructive">{errors.center_id.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Milk Details Section */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Milk className="h-4 w-4 text-primary" />
              Milk Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Milk Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['cow', 'buffalo', 'both'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={milkType === type ? 'default' : 'outline'}
                    className="h-12 capitalize"
                    onClick={() => setValue('milk_type', type)}
                  >
                    {type === 'both' ? 'Both' : type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Section - Only show edit fields for admin */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Bank Details
              {!canEditBank && (
                <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Admin Only
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEditBank ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_holder_name">Account Holder Name</Label>
                  <Input
                    id="bank_account_holder_name"
                    placeholder="Enter account holder name"
                    {...register('bank_account_holder_name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter account number"
                    {...register('bank_account_number')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_ifsc">IFSC Code</Label>
                  <Input
                    id="bank_ifsc"
                    placeholder="Enter IFSC code"
                    {...register('bank_ifsc')}
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    placeholder="Enter bank name"
                    {...register('bank_name')}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact an administrator to edit bank details.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status Section - Only visible to admin in edit mode */}
        {(canToggleStatus || !isEdit) && (
          <Card className="shadow-dairy">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <Label htmlFor="is_active" className="text-base font-medium">
                  Farmer Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'This farmer can receive milk entries' : 'This farmer is inactive'}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
                disabled={isEdit && !canToggleStatus}
              />
            </CardContent>
          </Card>
        )}

        {/* Staff notice for status */}
        {isEdit && !canToggleStatus && (
          <Card className="shadow-dairy border-muted bg-muted/30">
            <CardContent className="flex items-center gap-3 py-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only admins can activate/deactivate farmers
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="h-14 w-full text-base font-medium"
          disabled={isLoading || !isValid}
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Farmer' : 'Add Farmer'}
        </Button>
      </form>

      {/* Bank Details Change Warning */}
      <AlertDialog open={showBankWarning} onOpenChange={setShowBankWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Financial Data Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to modify bank details for this farmer. This is a sensitive financial change that will affect future settlements.
              <br /><br />
              Please confirm that the new bank details are correct before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBankChange}>
              Confirm Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
