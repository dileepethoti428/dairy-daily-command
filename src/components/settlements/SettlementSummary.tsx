import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Droplets, IndianRupee, Lock, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Settlement } from '@/hooks/useSettlements';

interface SettlementSummaryProps {
  settlement: Settlement;
}

const statusConfig = {
  open: {
    label: 'Open',
    icon: Clock,
    className: 'border-warning bg-warning/10 text-warning',
  },
  locked: {
    label: 'Locked',
    icon: Lock,
    className: 'border-primary bg-primary/10 text-primary',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    className: 'border-success bg-success/10 text-success',
  },
};

export function SettlementSummary({ settlement }: SettlementSummaryProps) {
  const config = statusConfig[settlement.status] || statusConfig.open;
  const StatusIcon = config.icon;

  return (
    <Card className="shadow-dairy">
      <CardContent className="p-4">
        {/* Status & Date Range */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(new Date(settlement.start_date), 'MMM d')} -{' '}
              {format(new Date(settlement.end_date), 'MMM d, yyyy')}
            </span>
          </div>
          <Badge variant="outline" className={cn('px-3 py-1', config.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        {/* Totals */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4" />
              <span className="text-xs">Total Milk</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {(settlement.total_litres || 0).toLocaleString()}
              <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs">Total Amount</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              ₹{(settlement.total_amount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Lock/Payment info */}
        {settlement.locked_at && (
          <p className="mt-3 text-xs text-muted-foreground">
            Locked on {format(new Date(settlement.locked_at), 'MMM d, yyyy h:mm a')}
          </p>
        )}
        {settlement.paid_at && (
          <p className="text-xs text-muted-foreground">
            Paid on {format(new Date(settlement.paid_at), 'MMM d, yyyy h:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
