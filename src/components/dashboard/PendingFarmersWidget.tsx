import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorDisplay, getReadableErrorMessage } from '@/components/ui/error-display';
import { usePendingFarmers, useFarmerAttendanceStats } from '@/hooks/usePendingFarmers';
import { Phone, UserCheck, UserX, ChevronRight, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingFarmersWidgetProps {
  centerId?: string;
}

export function PendingFarmersWidget({ centerId }: PendingFarmersWidgetProps) {
  const navigate = useNavigate();
  const { data: pendingFarmers, isLoading, error, refetch } = usePendingFarmers(centerId);
  const { data: stats, isLoading: statsLoading } = useFarmerAttendanceStats(centerId);

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const displayedFarmers = pendingFarmers?.slice(0, 5) || [];
  const remainingCount = (pendingFarmers?.length || 0) - 5;

  return (
    <Card className="shadow-dairy">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserX className="h-5 w-5 text-destructive" />
            Pending Farmers
          </CardTitle>
          {!statsLoading && stats && (
            <Badge
              variant="outline"
              className={cn(
                'gap-1 px-2 py-1',
                stats.currentSession === 'morning'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
              )}
            >
              {stats.currentSession === 'morning' ? (
                <Sun className="h-3 w-3" />
              ) : (
                <Moon className="h-3 w-3" />
              )}
              {stats.currentSession === 'morning' ? 'AM' : 'PM'}
            </Badge>
          )}
        </div>
        
        {/* Attendance Summary */}
        {!statsLoading && stats && stats.totalFarmers > 0 && (
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-success">
              <UserCheck className="h-4 w-4" />
              <span>{stats.givenCount} given</span>
            </div>
            <div className="flex items-center gap-1.5 text-destructive">
              <UserX className="h-4 w-4" />
              <span>{stats.pendingCount} pending</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {stats.totalFarmers} total
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-2">
        {isLoading || statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))
        ) : error ? (
          <ErrorDisplay
            message={getReadableErrorMessage(error)}
            onRetry={() => refetch()}
          />
        ) : !pendingFarmers || pendingFarmers.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All farmers collected!"
            description={`Every farmer has given milk for this ${stats?.currentSession || 'session'}.`}
            variant="muted"
            className="py-4"
          />
        ) : (
          <>
            {displayedFarmers.map((farmer) => (
              <div
                key={farmer.id}
                className="flex items-center justify-between rounded-lg bg-secondary p-3"
              >
                <button
                  className="flex-1 text-left tap-target"
                  onClick={() => navigate(`/farmers/${farmer.id}`)}
                >
                  <p className="font-medium text-foreground">{farmer.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {farmer.farmer_code || 'No code'}
                  </p>
                </button>
                
                {farmer.phone ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="ml-2 gap-1.5 bg-success hover:bg-success/90"
                    onClick={(e) => handleCall(farmer.phone!, e)}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No phone</span>
                )}
              </div>
            ))}
            
            {remainingCount > 0 && (
              <Button
                variant="ghost"
                className="w-full text-primary"
                onClick={() => navigate('/farmers?filter=pending')}
              >
                View {remainingCount} more pending
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
