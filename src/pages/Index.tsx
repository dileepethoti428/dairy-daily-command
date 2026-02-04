import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarmers } from '@/hooks/useFarmers';
import { useTodayStats } from '@/hooks/useMilkEntries';
import { useCurrentOpenSettlement } from '@/hooks/useSettlements';
import { useCenter } from '@/contexts/CenterContext';
import {
  Plus,
  List,
  Droplets,
  Users,
  Beaker,
  AlertCircle,
  FileText,
  Calendar,
  ChevronRight,
  Lock,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Index() {
  const navigate = useNavigate();
  const today = new Date();
  const { selectedCenter } = useCenter();
  
  // Fetch recent farmers from Supabase scoped to selected center
  const { data: farmers, isLoading: farmersLoading } = useFarmers(selectedCenter?.id);
  const recentFarmers = farmers?.slice(0, 5) || [];
  const currentHour = today.getHours();
  
  // Fetch today's stats from milk entries scoped to selected center
  const { data: todayStats, isLoading: statsLoading } = useTodayStats(selectedCenter?.id);
  
  // Fetch current open settlement scoped to selected center
  const { data: openSettlement, isLoading: settlementLoading } = useCurrentOpenSettlement(selectedCenter?.id);
  
  const isCollectionOpen = currentHour >= 5 && currentHour < 20; // 5 AM to 8 PM
  
  // Calculate days until settlement ends
  const daysUntilSettlementEnds = openSettlement 
    ? differenceInDays(new Date(openSettlement.end_date), today)
    : null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Date & Session Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {format(today, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {currentHour < 12 ? 'Morning' : 'Evening'} Session
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'px-3 py-1',
              isCollectionOpen
                ? 'border-success bg-success/10 text-success'
                : 'border-muted-foreground bg-muted text-muted-foreground'
            )}
          >
            {isCollectionOpen ? 'Collection Open' : 'Collection Closed'}
          </Badge>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-14 text-base font-medium shadow-dairy" 
            size="lg"
            onClick={() => navigate('/milk/add')}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Entry
          </Button>
          <Button
            variant="secondary"
            className="h-14 text-base font-medium shadow-dairy"
            size="lg"
            onClick={() => navigate('/milk/today')}
          >
            <List className="mr-2 h-5 w-5" />
            View Today
          </Button>
        </div>

        {/* Today's Snapshot Card */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Droplets className="h-4 w-4" />
                    <span className="text-xs">Total Milk</span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {(todayStats?.totalMilk || 0).toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Farmers</span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {todayStats?.totalFarmers || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Beaker className="h-4 w-4" />
                    <span className="text-xs">Avg FAT</span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {todayStats?.avgFat || 0}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Beaker className="h-4 w-4" />
                    <span className="text-xs">Avg SNF</span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {todayStats?.avgSnf || 0}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Farmers */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Recent Farmers
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate('/farmers')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {farmersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : recentFarmers.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">No farmers yet</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={() => navigate('/farmers/add')}
                >
                  Add your first farmer
                </Button>
              </div>
            ) : (
              recentFarmers.map((farmer) => (
                <button
                  key={farmer.id}
                  className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80 tap-target"
                  onClick={() => navigate(`/farmers/${farmer.id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground">{farmer.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {farmer.farmer_code} • {farmer.village || 'N/A'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Settlement Alert */}
        {settlementLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : openSettlement ? (
          <Card className={cn(
            "shadow-dairy",
            daysUntilSettlementEnds !== null && daysUntilSettlementEnds <= 2 
              ? "border-warning bg-warning/5" 
              : ""
          )}>
            <CardContent className="flex items-center gap-3 p-4">
              {daysUntilSettlementEnds !== null && daysUntilSettlementEnds <= 2 ? (
                <AlertCircle className="h-5 w-5 text-warning" />
              ) : (
                <Calendar className="h-5 w-5 text-primary" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {daysUntilSettlementEnds !== null && daysUntilSettlementEnds <= 0
                    ? 'Settlement period ended'
                    : daysUntilSettlementEnds !== null && daysUntilSettlementEnds <= 2
                    ? `Settlement ends in ${daysUntilSettlementEnds} day${daysUntilSettlementEnds === 1 ? '' : 's'}`
                    : 'Current Settlement'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(openSettlement.start_date), 'MMM d')} -{' '}
                  {format(new Date(openSettlement.end_date), 'MMM d')}
                </p>
              </div>
              <Button
                variant={daysUntilSettlementEnds !== null && daysUntilSettlementEnds <= 2 ? "default" : "outline"}
                size="sm"
                onClick={() => navigate(`/settlements/${openSettlement.id}`)}
              >
                {daysUntilSettlementEnds !== null && daysUntilSettlementEnds <= 0 ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Lock
                  </>
                ) : (
                  'View'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Quick Reports */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Quick Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12 justify-start"
                onClick={() => navigate('/milk/today')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Today's Entries
              </Button>
              <Button 
                variant="outline" 
                className="h-12 justify-start"
                onClick={() => navigate('/settlements')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Settlements
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
