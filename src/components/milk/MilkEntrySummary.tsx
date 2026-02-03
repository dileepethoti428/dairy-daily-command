import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Droplets, Users, IndianRupee, Beaker } from 'lucide-react';
import type { TodayStats } from '@/hooks/useMilkEntries';

interface MilkEntrySummaryProps {
  stats: TodayStats | undefined;
  isLoading?: boolean;
  title?: string;
}

export function MilkEntrySummary({
  stats,
  isLoading,
  title = "Today's Summary",
}: MilkEntrySummaryProps) {
  if (isLoading) {
    return (
      <Card className="shadow-dairy">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeStats = stats || {
    totalMilk: 0,
    totalFarmers: 0,
    totalAmount: 0,
    avgFat: 0,
    avgSnf: 0,
  };

  return (
    <Card className="shadow-dairy">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4" />
              <span className="text-xs">Total Milk</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {safeStats.totalMilk.toLocaleString()}
              <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
            </p>
          </div>

          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Farmers</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {safeStats.totalFarmers}
            </p>
          </div>

          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              <span className="text-xs">Total Amount</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              ₹{safeStats.totalAmount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-secondary p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Beaker className="h-4 w-4" />
              <span className="text-xs">Avg FAT / SNF</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {safeStats.avgFat}
              <span className="text-sm font-normal text-muted-foreground">%</span>
              <span className="mx-1 text-muted-foreground">/</span>
              {safeStats.avgSnf}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
