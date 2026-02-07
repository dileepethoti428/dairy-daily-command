import { Badge } from '@/components/ui/badge';
import { PricingFormula, getRateBreakdown, PricingMode } from '@/hooks/usePricingFormula';
import { Calculator, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RateBreakdownProps {
  fat: number | undefined;
  snf: number | undefined;
  formula: PricingFormula | null;
  isAutoRate: boolean;
  className?: string;
}

export function RateBreakdown({ fat, snf, formula, isAutoRate, className }: RateBreakdownProps) {
  if (!formula || fat === undefined || snf === undefined || isNaN(fat) || isNaN(snf)) {
    return null;
  }

  const breakdown = getRateBreakdown(fat, snf, formula);
  if (!breakdown) return null;

  return (
    <div className={cn('rounded-lg border bg-muted/30 p-3 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Calculator className="h-3 w-3" />
          Rate Calculation
        </p>
        {formula.mode === 'auto' && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Lock className="h-3 w-3" />
            Locked
          </Badge>
        )}
        {formula.mode === 'hybrid' && isAutoRate && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Zap className="h-3 w-3" />
            Auto
          </Badge>
        )}
      </div>
      
      {/* Calculation Steps */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>FAT contribution ({fat} × {formula.fat_multiplier})</span>
          <span className="font-mono text-foreground">₹{breakdown.fatContribution.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>SNF contribution ({snf} × {formula.snf_multiplier})</span>
          <span className="font-mono text-foreground">₹{breakdown.snfContribution.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Constant subtract</span>
          <span className="font-mono text-foreground">−₹{breakdown.constantSubtract.toFixed(2)}</span>
        </div>
        <div className="border-t pt-1 flex justify-between font-medium">
          <span>Calculated Rate</span>
          <span className="font-mono text-primary">₹{breakdown.finalRate.toFixed(2)}</span>
        </div>
      </div>

      {/* Formula Display */}
      <div className="text-xs text-muted-foreground font-mono bg-background/50 rounded p-2 text-center">
        {breakdown.formula} = ₹{breakdown.finalRate.toFixed(2)}
      </div>
    </div>
  );
}
