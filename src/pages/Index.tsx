import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy data for the homepage
const todayStats = {
  totalMilk: 1245.5,
  farmersServed: 42,
  avgFat: 4.2,
  avgSnf: 8.5,
};

const recentFarmers = [
  { id: '1', name: 'Ramesh Kumar', code: 'F001', lastEntry: '08:45 AM', quantity: 25.5 },
  { id: '2', name: 'Suresh Patel', code: 'F002', lastEntry: '08:30 AM', quantity: 18.0 },
  { id: '3', name: 'Mahesh Singh', code: 'F003', lastEntry: '08:15 AM', quantity: 32.0 },
  { id: '4', name: 'Dinesh Sharma', code: 'F004', lastEntry: '08:00 AM', quantity: 22.5 },
  { id: '5', name: 'Ganesh Verma', code: 'F005', lastEntry: '07:45 AM', quantity: 28.0 },
];

const alerts = [
  { id: '1', type: 'warning', message: '3 farmers have pending settlements', action: 'View' },
  { id: '2', type: 'info', message: 'Current settlement period ends in 5 days', action: 'Details' },
];

export default function Index() {
  const today = new Date();
  const currentHour = today.getHours();
  const isCollectionOpen = currentHour >= 5 && currentHour < 20; // 5 AM to 8 PM

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
          <Button className="h-14 text-base font-medium shadow-dairy" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Entry
          </Button>
          <Button
            variant="secondary"
            className="h-14 text-base font-medium shadow-dairy"
            size="lg"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Droplets className="h-4 w-4" />
                  <span className="text-xs">Total Milk</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {todayStats.totalMilk.toLocaleString()}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Farmers</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {todayStats.farmersServed}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Beaker className="h-4 w-4" />
                  <span className="text-xs">Avg FAT</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {todayStats.avgFat}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Beaker className="h-4 w-4" />
                  <span className="text-xs">Avg SNF</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {todayStats.avgSnf}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
                </p>
              </div>
            </div>
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
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentFarmers.map((farmer) => (
              <button
                key={farmer.id}
                className="flex w-full items-center justify-between rounded-lg bg-secondary p-3 text-left transition-colors hover:bg-secondary/80 tap-target"
              >
                <div>
                  <p className="font-medium text-foreground">{farmer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {farmer.code} • {farmer.lastEntry}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{farmer.quantity} L</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-warning" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-center justify-between rounded-lg p-3',
                  alert.type === 'warning' ? 'bg-warning/10' : 'bg-primary/5'
                )}
              >
                <p className="text-sm text-foreground">{alert.message}</p>
                <Button variant="ghost" size="sm" className="text-primary">
                  {alert.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reports Shortcuts */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Quick Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Today's PDF
              </Button>
              <Button variant="outline" className="h-12 justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                15-Day Settlement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
