import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Lock, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Settlement } from '@/hooks/useSettlements';

interface SettlementCardProps {
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

export function SettlementCard({ settlement }: SettlementCardProps) {
  const navigate = useNavigate();
  const config = statusConfig[settlement.status] || statusConfig.open;
  const StatusIcon = config.icon;

  return (
    <button
      className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary/50 tap-target"
      onClick={() => navigate(`/settlements/${settlement.id}`)}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">
            {format(new Date(settlement.start_date), 'MMM d')} -{' '}
            {format(new Date(settlement.end_date), 'MMM d, yyyy')}
          </p>
          <Badge variant="outline" className={cn('text-xs', config.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {(settlement.total_litres || 0).toLocaleString()} L
          </span>
          <span>
            ₹{(settlement.total_amount || 0).toLocaleString()}
          </span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
