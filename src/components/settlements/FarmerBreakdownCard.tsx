import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { SettlementFarmerBreakdown } from '@/hooks/useSettlements';

interface FarmerBreakdownCardProps {
  breakdown: SettlementFarmerBreakdown;
}

export function FarmerBreakdownCard({ breakdown }: FarmerBreakdownCardProps) {
  const navigate = useNavigate();

  return (
    <button
      className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80 tap-target"
      onClick={() => navigate(`/farmers/${breakdown.farmer_id}`)}
    >
      <div className="flex-1">
        <p className="font-medium text-foreground">{breakdown.farmer_name}</p>
        <p className="text-xs text-muted-foreground">
          {breakdown.farmer_code || 'N/A'} • {breakdown.village || 'N/A'} •{' '}
          {breakdown.entries_count} entries
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground">
          {breakdown.total_litres.toFixed(1)} L
        </p>
        <p className="text-sm text-muted-foreground">
          ₹{breakdown.total_amount.toFixed(0)}
        </p>
      </div>
      <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
    </button>
  );
}
