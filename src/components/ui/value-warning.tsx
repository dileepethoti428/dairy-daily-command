import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueWarningProps {
  message: string;
  className?: string;
}

export function ValueWarning({ message, className }: ValueWarningProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1 text-xs text-warning',
        className
      )}
    >
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Helper to check if fat/SNF values are unusual
export function checkMilkQualityWarnings(fatPercentage?: number, snfPercentage?: number) {
  const warnings: string[] = [];

  if (fatPercentage !== undefined) {
    if (fatPercentage < 3.0) {
      warnings.push('Fat % is unusually low (normal: 3-6%)');
    } else if (fatPercentage > 8.0) {
      warnings.push('Fat % is unusually high (normal: 3-6%)');
    }
  }

  if (snfPercentage !== undefined) {
    if (snfPercentage < 7.5) {
      warnings.push('SNF % is unusually low (normal: 8-9%)');
    } else if (snfPercentage > 10.0) {
      warnings.push('SNF % is unusually high (normal: 8-9%)');
    }
  }

  return warnings;
}
