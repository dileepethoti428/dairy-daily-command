import { ChevronRight, Droplets, Beaker, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MilkSession } from '@/hooks/useMilkEntries';

interface MilkEntryCardProps {
  farmerName: string;
  farmerCode: string | null;
  quantity: number;
  fat: number;
  snf: number;
  amount: number | null;
  session?: MilkSession;
  onClick?: () => void;
  className?: string;
}

export function MilkEntryCard({
  farmerName,
  farmerCode,
  quantity,
  fat,
  snf,
  amount,
  session,
  onClick,
  className,
}: MilkEntryCardProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between rounded-lg bg-card border p-4 text-left transition-colors hover:bg-secondary/50 tap-target',
        className
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{farmerName}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {farmerCode}
          </span>
          {session && (
            <span className={cn(
              'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded',
              session === 'morning' 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            )}>
              {session === 'morning' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {session === 'morning' ? 'AM' : 'PM'}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            {quantity} L
          </span>
          <span className="flex items-center gap-1">
            <Beaker className="h-3 w-3" />
            {fat}% / {snf}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-lg font-semibold text-primary">
          ₹{(amount || 0).toLocaleString('en-IN')}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}
