import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, addDays, isToday } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MilkEntrySummary } from '@/components/milk/MilkEntrySummary';
import { MilkEntryCard } from '@/components/milk/MilkEntryCard';
import { useMilkEntries, useTodayStats } from '@/hooks/useMilkEntries';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';

export default function TodayEntries() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  const { data: entries, isLoading: entriesLoading } = useMilkEntries(formattedDate);
  const { data: stats, isLoading: statsLoading } = useTodayStats();

  const handlePrevDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    const tomorrow = addDays(selectedDate, 1);
    if (tomorrow <= new Date()) {
      setSelectedDate(tomorrow);
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const canGoNext = !isToday(selectedDate);

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            {isToday(selectedDate) ? "Today's Entries" : 'Milk Entries'}
          </h1>
        </div>

        {/* Date Navigation */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary p-2">
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(selectedDate, 'EEE, dd MMM yyyy')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {!isToday(selectedDate) && (
          <Button
            variant="outline"
            className="mb-4 w-full"
            onClick={handleToday}
          >
            Go to Today
          </Button>
        )}

        {/* Summary - only show for today */}
        {isToday(selectedDate) && (
          <div className="mb-4">
            <MilkEntrySummary
              stats={stats}
              isLoading={statsLoading}
              title="Today's Summary"
            />
          </div>
        )}

        {/* Entries List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">
              Entries ({entries?.length || 0})
            </h2>
            {isToday(selectedDate) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/milk/add')}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Entry
              </Button>
            )}
          </div>

          {entriesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : entries?.length === 0 ? (
            <div className="rounded-lg bg-muted p-8 text-center">
              <p className="text-muted-foreground">No entries for this date</p>
              {isToday(selectedDate) && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate('/milk/add')}
                >
                  Add your first entry
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {entries?.map((entry) => (
                <MilkEntryCard
                  key={entry.id}
                  farmerName={entry.farmers?.full_name || 'Unknown'}
                  farmerCode={entry.farmers?.farmer_code || null}
                  quantity={entry.quantity_liters}
                  fat={entry.fat_percentage}
                  snf={entry.snf_percentage}
                  amount={entry.total_amount}
                  onClick={() => navigate(`/milk/${entry.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
