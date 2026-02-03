import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SettlementFarmerBreakdown } from '@/hooks/useSettlements';

interface FarmerBreakdownCardProps {
  breakdown: SettlementFarmerBreakdown;
  showPDFButton?: boolean;
  onPDFClick?: () => void;
}

export function FarmerBreakdownCard({ 
  breakdown, 
  showPDFButton = false,
  onPDFClick 
}: FarmerBreakdownCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
      <button
        className="flex flex-1 items-center justify-between text-left transition-colors hover:opacity-80 tap-target"
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
      {showPDFButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onPDFClick?.();
          }}
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
