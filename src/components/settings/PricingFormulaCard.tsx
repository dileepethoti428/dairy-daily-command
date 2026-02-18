import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePricingFormula,
  useUpdatePricingFormula,
  calculateRate,
  PricingMode,
} from '@/hooks/usePricingFormula';
import { Calculator, Loader2, Info, Globe, Building2 } from 'lucide-react';

interface PricingFormulaCardProps {
  centerId?: string | null;
  centerName?: string | null;
}

export function PricingFormulaCard({ centerId, centerName }: PricingFormulaCardProps) {
  const { data: formula, isLoading } = usePricingFormula(centerId);
  const updateFormula = useUpdatePricingFormula(centerId);

  const [fatMultiplier, setFatMultiplier] = useState<string>('6');
  const [snfMultiplier, setSnfMultiplier] = useState<string>('2');
  const [constantValue, setConstantValue] = useState<string>('6.8');
  const [mode, setMode] = useState<PricingMode>('hybrid');
  const [hasChanges, setHasChanges] = useState(false);

  // Test values for preview
  const [testFat, setTestFat] = useState<string>('4.5');
  const [testSnf, setTestSnf] = useState<string>('8.0');

  useEffect(() => {
    if (formula) {
      setFatMultiplier(String(formula.fat_multiplier));
      setSnfMultiplier(String(formula.snf_multiplier));
      setConstantValue(String(formula.constant_value));
      setMode(formula.mode);
      setHasChanges(false);
    }
  }, [formula]);

  const handleChange = () => setHasChanges(true);

  const handleSave = async () => {
    await updateFormula.mutateAsync({
      fat_multiplier: parseFloat(fatMultiplier) || 6,
      snf_multiplier: parseFloat(snfMultiplier) || 2,
      constant_value: parseFloat(constantValue) || 6.8,
      mode,
    });
    setHasChanges(false);
  };

  // Calculate preview rate
  const previewFormula = {
    id: '',
    collection_center_id: centerId ?? null,
    fat_multiplier: parseFloat(fatMultiplier) || 0,
    snf_multiplier: parseFloat(snfMultiplier) || 0,
    constant_value: parseFloat(constantValue) || 0,
    mode,
    is_active: true,
    created_at: '',
    updated_at: '',
  };
  
  const previewFat = parseFloat(testFat) || 0;
  const previewSnf = parseFloat(testSnf) || 0;
  const previewRate = calculateRate(previewFat, previewSnf, previewFormula);

  if (isLoading) {
    return (
      <Card className="shadow-dairy">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isGlobal = !centerId;

  return (
    <Card className="shadow-dairy">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Pricing Formula
          {isGlobal ? (
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-auto">
              <Globe className="h-3.5 w-3.5" />
              Global
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground ml-auto">
              <Building2 className="h-3.5 w-3.5" />
              {centerName || 'This Center'}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {isGlobal
            ? 'Default formula used by all centers without a custom formula'
            : `Custom milk rate formula for ${centerName || 'this center'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Formula Display */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground mb-2">Formula:</p>
          <p className="font-mono text-sm font-medium text-foreground">
            Rate = (FAT × <span className="text-primary">{fatMultiplier}</span>) + (SNF × <span className="text-primary">{snfMultiplier}</span>) − <span className="text-primary">{constantValue}</span>
          </p>
        </div>

        {/* Multiplier Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fatMultiplier" className="text-xs">FAT Multiplier</Label>
            <Input
              id="fatMultiplier"
              type="number"
              step="0.01"
              value={fatMultiplier}
              onChange={(e) => { setFatMultiplier(e.target.value); handleChange(); }}
              className="h-12 text-lg font-medium text-center"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="snfMultiplier" className="text-xs">SNF Multiplier</Label>
            <Input
              id="snfMultiplier"
              type="number"
              step="0.01"
              value={snfMultiplier}
              onChange={(e) => { setSnfMultiplier(e.target.value); handleChange(); }}
              className="h-12 text-lg font-medium text-center"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="constantValue" className="text-xs">Constant (−)</Label>
            <Input
              id="constantValue"
              type="number"
              step="0.01"
              value={constantValue}
              onChange={(e) => { setConstantValue(e.target.value); handleChange(); }}
              className="h-12 text-lg font-medium text-center"
            />
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2">
          <Label htmlFor="mode">Pricing Mode</Label>
          <Select
            value={mode}
            onValueChange={(value: PricingMode) => { setMode(value); handleChange(); }}
          >
            <SelectTrigger id="mode" className="h-12">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Manual</span>
                  <span className="text-xs text-muted-foreground">Staff enters rate manually</span>
                </div>
              </SelectItem>
              <SelectItem value="auto">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Auto</span>
                  <span className="text-xs text-muted-foreground">Rate is locked, auto-calculated</span>
                </div>
              </SelectItem>
              <SelectItem value="hybrid">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Hybrid</span>
                  <span className="text-xs text-muted-foreground">Auto-filled but editable</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            {mode === 'manual' && 'Staff must enter rate manually for each entry.'}
            {mode === 'auto' && 'Rate is calculated automatically and cannot be changed.'}
            {mode === 'hybrid' && 'Rate is calculated automatically but can be overridden.'}
          </p>
        </div>

        {/* Test Calculator */}
        <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Test Calculator</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="testFat" className="text-xs">Test FAT %</Label>
              <Input
                id="testFat"
                type="number"
                step="0.1"
                value={testFat}
                onChange={(e) => setTestFat(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="testSnf" className="text-xs">Test SNF %</Label>
              <Input
                id="testSnf"
                type="number"
                step="0.1"
                value={testSnf}
                onChange={(e) => setTestSnf(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <div className="rounded-md bg-primary/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">
              ({previewFat} × {fatMultiplier}) + ({previewSnf} × {snfMultiplier}) − {constantValue}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Calculated Rate:</span>
              <Badge variant="default" className="text-lg font-bold">
                ₹{previewRate?.toFixed(2) || '0.00'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={updateFormula.isPending}
          >
            {updateFormula.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Formula'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
