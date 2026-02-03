import { useNavigate, useParams } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useMilkEntry } from '@/hooks/useMilkEntries';
import {
  ArrowLeft,
  Calendar,
  Droplets,
  Beaker,
  IndianRupee,
  Edit,
  User,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MilkEntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: entry, isLoading, error } = useMilkEntry(id || '');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !entry) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate('/milk/today')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="rounded-lg bg-destructive/10 p-6 text-center text-destructive">
            Entry not found or an error occurred.
          </div>
        </div>
      </AppLayout>
    );
  }

  const entryDate = parseISO(entry.entry_date);
  const canEdit = isToday(entryDate);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => navigate('/milk/today')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Entry Details</h1>
        </div>

        {/* Farmer Info Card */}
        <Card className="mb-4 shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Farmer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {entry.farmers?.full_name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.farmers?.farmer_code} • {entry.farmers?.village || 'N/A'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  entry.farmers?.is_active
                    ? 'border-success/20 bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {entry.farmers?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Entry Date */}
        <Card className="mb-4 shadow-dairy">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Entry Date</span>
              </div>
              <span className="font-medium">
                {format(entryDate, 'EEE, dd MMM yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Entry Details */}
        <Card className="mb-4 shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Milk Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplets className="h-4 w-4" />
                <span>Quantity</span>
              </div>
              <span className="text-lg font-semibold">
                {entry.quantity_liters} L
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Beaker className="h-4 w-4" />
                  <span>Fat</span>
                </div>
                <span className="font-semibold">{entry.fat_percentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Beaker className="h-4 w-4" />
                  <span>SNF</span>
                </div>
                <span className="font-semibold">{entry.snf_percentage}%</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IndianRupee className="h-4 w-4" />
                <span>Rate per Litre</span>
              </div>
              <span className="font-semibold">
                ₹{entry.rate_per_litre?.toFixed(2) || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card className="mb-4 border-primary bg-primary/5 shadow-dairy">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IndianRupee className="h-5 w-5" />
                <span className="text-base font-medium">Total Amount</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                ₹{(entry.total_amount || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {canEdit ? (
          <Button
            className="h-14 w-full"
            onClick={() => navigate(`/milk/${entry.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Entry
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Past entries cannot be edited</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
