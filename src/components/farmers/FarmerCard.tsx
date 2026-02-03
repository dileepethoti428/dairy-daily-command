import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FarmerWithCenter } from '@/hooks/useFarmers';

interface FarmerCardProps {
  farmer: FarmerWithCenter;
  onClick: () => void;
}

export function FarmerCard({ farmer, onClick }: FarmerCardProps) {
  const milkTypeLabel = farmer.milk_type === 'both' 
    ? 'Cow & Buffalo' 
    : farmer.milk_type === 'cow' 
    ? 'Cow' 
    : 'Buffalo';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md active:scale-[0.99]',
        !farmer.is_active && 'opacity-60'
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{farmer.full_name}</h3>
            <Badge
              variant={farmer.is_active ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                farmer.is_active 
                  ? 'bg-success/10 text-success border-success/20' 
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {farmer.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm font-medium text-primary">{farmer.farmer_code}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {farmer.village || farmer.address || 'N/A'}
            </span>
            <span>•</span>
            <span>{milkTypeLabel}</span>
          </div>
          {farmer.phone && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {farmer.phone}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
