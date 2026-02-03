import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentOpenSettlement, useSettlements } from '@/hooks/useSettlements';
import {
  FileText,
  Calendar,
  ChevronRight,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function Reports() {
  const navigate = useNavigate();
  const { data: openSettlement, isLoading: openLoading } = useCurrentOpenSettlement();
  const { data: settlements, isLoading: settlementsLoading } = useSettlements();
  
  const recentSettlements = settlements?.slice(0, 3) || [];

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Settlements & payment cycles
          </p>
        </div>

        {/* Current Open Settlement Alert */}
        {openLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : openSettlement ? (
          <Card className="border-warning bg-warning/5 shadow-dairy">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Open Settlement Period
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(openSettlement.start_date), 'MMM d')} -{' '}
                    {format(new Date(openSettlement.end_date), 'MMM d, yyyy')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(openSettlement.total_litres || 0).toLocaleString()} L •{' '}
                    ₹{(openSettlement.total_amount || 0).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/settlements/${openSettlement.id}`)}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-muted bg-muted/50 shadow-dairy">
            <CardContent className="flex items-center gap-3 p-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">No Open Settlement</p>
                <p className="text-sm text-muted-foreground">
                  Create a new settlement period to start tracking
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/settlements')}>
                Create
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 justify-start"
                onClick={() => navigate('/settlements')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                All Settlements
              </Button>
              <Button
                variant="outline"
                className="h-12 justify-start"
                onClick={() => navigate('/milk/today')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Today's Entries
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Settlements */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Settlements
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/settlements')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {settlementsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : recentSettlements.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">No settlements yet</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={() => navigate('/settlements')}
                >
                  Create your first settlement
                </Button>
              </div>
            ) : (
              recentSettlements.map((settlement) => {
                const config = statusConfig[settlement.status] || statusConfig.open;
                const StatusIcon = config.icon;

                return (
                  <button
                    key={settlement.id}
                    className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80 tap-target"
                    onClick={() => navigate(`/settlements/${settlement.id}`)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {format(new Date(settlement.start_date), 'MMM d')} -{' '}
                          {format(new Date(settlement.end_date), 'MMM d')}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', config.className)}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(settlement.total_litres || 0).toLocaleString()} L •{' '}
                        ₹{(settlement.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
