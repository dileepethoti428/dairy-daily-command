import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { IndianRupee, Sun, Moon, Zap, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValueWarning, checkMilkQualityWarnings } from '@/components/ui/value-warning';
import { FarmerSelector } from './FarmerSelector';
import { RateBreakdown } from './RateBreakdown';
import { cn } from '@/lib/utils';
import { usePricingFormula, calculateRate } from '@/hooks/usePricingFormula';
import { useFarmerLivestock, getQuantityWarning } from '@/hooks/useFarmerLivestock';
import { useFarmer } from '@/hooks/useFarmers';
import type { MilkSession } from '@/hooks/useMilkEntries';

const milkEntrySchema = z.object({
  farmer_id: z.string().min(1, 'Please select a farmer'),
  session: z.enum(['morning', 'evening']),
  quantity_liters: z
    .number({ invalid_type_error: 'Enter quantity' })
    .positive('Must be greater than 0')
    .max(999.99, 'Maximum 999.99 L'),
  fat_percentage: z
    .number({ invalid_type_error: 'Enter fat %' })
    .min(0, 'Minimum 0%')
    .max(15, 'Maximum 15%'),
  snf_percentage: z
    .number({ invalid_type_error: 'Enter SNF %' })
    .min(0, 'Minimum 0%')
    .max(20, 'Maximum 20%'),
  rate_per_litre: z
    .number({ invalid_type_error: 'Enter rate' })
    .positive('Must be greater than 0'),
  milk_type: z.enum(['cow', 'buffalo']).optional(),
});

export type MilkEntryFormValues = z.infer<typeof milkEntrySchema>;

interface MilkEntryFormProps {
  initialValues?: Partial<MilkEntryFormValues>;
  initialFarmerName?: string;
  onSubmit: (values: MilkEntryFormValues & { total_amount: number }) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  farmerDisabled?: boolean;
  date?: string;
  isAdmin?: boolean;
}

export function MilkEntryForm({
  initialValues,
  initialFarmerName,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save Entry',
  farmerDisabled = false,
  date,
  isAdmin = false,
}: MilkEntryFormProps) {
  const fatInputRef = useRef<HTMLInputElement>(null);
  const snfInputRef = useRef<HTMLInputElement>(null);
  const rateInputRef = useRef<HTMLInputElement>(null);
  
  const [isAutoRate, setIsAutoRate] = useState(false);
  const { data: pricingData } = usePricingFormula();
  const pricingFormula = pricingData?.formula ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<MilkEntryFormValues>({
    resolver: zodResolver(milkEntrySchema),
    defaultValues: {
      farmer_id: initialValues?.farmer_id || '',
      session: initialValues?.session || 'morning',
      quantity_liters: initialValues?.quantity_liters,
      fat_percentage: initialValues?.fat_percentage,
      snf_percentage: initialValues?.snf_percentage,
      rate_per_litre: initialValues?.rate_per_litre,
      milk_type: initialValues?.milk_type,
    },
    mode: 'onChange',
  });

  const quantity = watch('quantity_liters');
  const rate = watch('rate_per_litre');
  const farmerId = watch('farmer_id');
  const fatPercentage = watch('fat_percentage');
  const snfPercentage = watch('snf_percentage');
  const session = watch('session');
  const selectedMilkType = watch('milk_type');

  // Fetch farmer & livestock data
  const { data: farmer } = useFarmer(farmerId || '');
  const { data: livestock } = useFarmerLivestock(farmerId || undefined);

  const farmerHasBoth = farmer?.milk_type === 'both';

  // Auto-set milk_type when farmer has single type
  useEffect(() => {
    if (farmer && farmer.milk_type !== 'both') {
      setValue('milk_type', farmer.milk_type as 'cow' | 'buffalo');
    }
  }, [farmer, setValue]);

  // Determine if rate should be locked (auto mode)
  const isRateLocked = pricingFormula?.mode === 'auto';
  const isFormulaEnabled = pricingFormula && pricingFormula.mode !== 'manual';

  // Auto-calculate rate when FAT/SNF changes
  useEffect(() => {
    if (!isFormulaEnabled) return;
    if (
      fatPercentage !== undefined && 
      !isNaN(fatPercentage) && 
      snfPercentage !== undefined && 
      !isNaN(snfPercentage)
    ) {
      const calculatedRate = calculateRate(fatPercentage, snfPercentage, pricingFormula);
      if (calculatedRate !== null && calculatedRate > 0) {
        setValue('rate_per_litre', calculatedRate, { shouldValidate: true });
        setIsAutoRate(true);
      }
    }
  }, [fatPercentage, snfPercentage, pricingFormula, isFormulaEnabled, setValue]);

  const handleRateChange = () => {
    if (!isRateLocked) setIsAutoRate(false);
  };

  const totalAmount = quantity && rate ? Math.round(quantity * rate * 100) / 100 : 0;

  const qualityWarnings = useMemo(() => 
    checkMilkQualityWarnings(fatPercentage, snfPercentage),
    [fatPercentage, snfPercentage]
  );

  // Quantity fraud detection
  const quantityWarning = useMemo(() => {
    if (!livestock || !quantity) return null;
    const currentType = selectedMilkType || (farmer?.milk_type !== 'both' ? farmer?.milk_type : undefined);
    if (!currentType) return null;
    const match = livestock.find((l) => l.animal_type === currentType);
    if (!match) return null;
    return getQuantityWarning(quantity, Number(match.expected_daily_liters));
  }, [livestock, quantity, selectedMilkType, farmer]);

  const handleFormSubmit = (values: MilkEntryFormValues) => {
    onSubmit({
      ...values,
      total_amount: Math.round(values.quantity_liters * values.rate_per_litre * 100) / 100,
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef?: React.RefObject<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' && nextRef?.current) {
      e.preventDefault();
      nextRef.current.focus();
    }
  };

  const breedLabel = (breed: string) => {
    const map: Record<string, string> = {
      gir: 'Gir', murrah: 'Murrah', jafarabadi: 'Jafarabadi',
      surti: 'Surti', mehsani: 'Mehsani', other: 'Other',
    };
    return map[breed] || breed;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Date & Session Display */}
      <Card className="shadow-dairy">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-muted-foreground">Entry Date</Label>
            <span className="text-lg font-medium">
              {format(date ? new Date(date) : new Date(), 'dd MMM yyyy')}
            </span>
          </div>
          
          <div className="space-y-2">
            <Label>Session</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={session === 'morning' ? 'default' : 'outline'}
                className={cn(
                  'h-12 flex items-center justify-center gap-2',
                  session === 'morning' && 'bg-amber-500 hover:bg-amber-600'
                )}
                onClick={() => setValue('session', 'morning', { shouldValidate: true })}
              >
                <Sun className="h-5 w-5" /> Morning
              </Button>
              <Button
                type="button"
                variant={session === 'evening' ? 'default' : 'outline'}
                className={cn(
                  'h-12 flex items-center justify-center gap-2',
                  session === 'evening' && 'bg-indigo-500 hover:bg-indigo-600'
                )}
                onClick={() => setValue('session', 'evening', { shouldValidate: true })}
              >
                <Moon className="h-5 w-5" /> Evening
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farmer Selection */}
      <Card className="shadow-dairy">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Select Farmer</CardTitle>
        </CardHeader>
        <CardContent>
          {farmerDisabled && initialFarmerName ? (
            <div className="rounded-lg bg-secondary p-4">
              <p className="font-medium text-foreground">{initialFarmerName}</p>
            </div>
          ) : (
            <>
              <FarmerSelector
                value={farmerId}
                onChange={(id) => setValue('farmer_id', id, { shouldValidate: true })}
                disabled={farmerDisabled}
                error={errors.farmer_id?.message}
              />
              {errors.farmer_id && (
                <p className="mt-1 text-sm text-destructive">{errors.farmer_id.message}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Farmer Livestock Info */}
      {farmerId && livestock && livestock.length > 0 && (
        <Card className="shadow-dairy border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              🐄 Farmer Livestock Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {livestock.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
                <span className="capitalize text-foreground">
                  {breedLabel(l.breed)} {l.animal_type === 'cow' ? 'Cow' : 'Buffalo'} × {l.animal_count}
                </span>
                <span className="font-medium text-primary">
                  {Number(l.expected_daily_liters)} L/day
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Milk Type Selector for "both" farmers */}
      {farmerHasBoth && (
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Milk Type for this Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={selectedMilkType === 'cow' ? 'default' : 'outline'}
                className="h-12"
                onClick={() => setValue('milk_type', 'cow', { shouldValidate: true })}
              >
                🐄 Cow
              </Button>
              <Button
                type="button"
                variant={selectedMilkType === 'buffalo' ? 'default' : 'outline'}
                className="h-12"
                onClick={() => setValue('milk_type', 'buffalo', { shouldValidate: true })}
              >
                🐃 Buffalo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milk Input Section */}
      <Card className="shadow-dairy">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Milk Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (Litres)</Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className={cn(
                  'h-14 pr-10 text-lg',
                  errors.quantity_liters && 'border-destructive'
                )}
                {...register('quantity_liters', { valueAsNumber: true })}
                onKeyDown={(e) => handleKeyDown(e, fatInputRef)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">L</span>
            </div>
            {errors.quantity_liters && (
              <p className="text-sm text-destructive">{errors.quantity_liters.message}</p>
            )}
          </div>

          {/* Quantity Fraud Warning */}
          {quantityWarning && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                quantityWarning.level === 'red'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/10 text-warning'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{quantityWarning.message}</span>
            </div>
          )}

          {/* Fat & SNF Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (%)</Label>
              <div className="relative">
                <Input
                  id="fat"
                  ref={fatInputRef}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="0.0"
                  className={cn('h-14 pr-8 text-lg', errors.fat_percentage && 'border-destructive')}
                  {...register('fat_percentage', { valueAsNumber: true })}
                  onKeyDown={(e) => handleKeyDown(e, snfInputRef)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              {errors.fat_percentage && (
                <p className="text-sm text-destructive">{errors.fat_percentage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="snf">SNF (%)</Label>
              <div className="relative">
                <Input
                  id="snf"
                  ref={snfInputRef}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="0.0"
                  className={cn('h-14 pr-8 text-lg', errors.snf_percentage && 'border-destructive')}
                  {...register('snf_percentage', { valueAsNumber: true })}
                  onKeyDown={(e) => handleKeyDown(e, rateInputRef)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              {errors.snf_percentage && (
                <p className="text-sm text-destructive">{errors.snf_percentage.message}</p>
              )}
            </div>
          </div>

          {/* Quality Warnings */}
          {qualityWarnings.length > 0 && (
            <div className="space-y-1">
              {qualityWarnings.map((warning, i) => (
                <ValueWarning key={i} message={warning} />
              ))}
            </div>
          )}

          {/* Rate Breakdown */}
          <RateBreakdown
            fat={fatPercentage}
            snf={snfPercentage}
            formula={pricingFormula || null}
            isAutoRate={isAutoRate}
          />

          {/* Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate">Rate per Litre (₹)</Label>
              {isRateLocked && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Lock className="h-3 w-3" /> Locked
                </Badge>
              )}
              {!isRateLocked && isAutoRate && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Zap className="h-3 w-3" /> Auto
                </Badge>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="rate"
                ref={rateInputRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                disabled={isRateLocked}
                className={cn(
                  'h-14 pl-8 text-lg',
                  errors.rate_per_litre && 'border-destructive',
                  isAutoRate && 'border-primary/50 bg-primary/5',
                  isRateLocked && 'bg-muted cursor-not-allowed'
                )}
                {...register('rate_per_litre', { valueAsNumber: true })}
                onChange={(e) => {
                  register('rate_per_litre', { valueAsNumber: true }).onChange(e);
                  handleRateChange();
                }}
              />
            </div>
            {errors.rate_per_litre && (
              <p className="text-sm text-destructive">{errors.rate_per_litre.message}</p>
            )}
            {!pricingFormula && (
              <p className="text-xs text-muted-foreground">No pricing formula configured. Enter rate manually.</p>
            )}
            {pricingFormula?.mode === 'manual' && (
              <p className="text-xs text-muted-foreground">Pricing mode is set to manual. Enter rate manually.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Amount Display */}
      <Card className="border-primary bg-primary/5 shadow-dairy">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-5 w-5" />
              <span className="text-base font-medium">Total Amount</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        className="h-14 w-full text-base font-medium"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
