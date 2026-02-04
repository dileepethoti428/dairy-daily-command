import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, addDays, isToday } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorDisplay, getReadableErrorMessage } from '@/components/ui/error-display';
import { MilkEntrySummary } from '@/components/milk/MilkEntrySummary';
import { MilkEntryCard } from '@/components/milk/MilkEntryCard';
import { PDFActionSheet } from '@/components/pdf/PDFActionSheet';
import { useMilkEntries, useTodayStats } from '@/hooks/useMilkEntries';
import { generateDailyReport } from '@/hooks/usePDFReports';
import { useCenter } from '@/contexts/CenterContext';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Plus, FileText, Milk } from 'lucide-react';

export default function TodayEntries() {
  const navigate = useNavigate();
  const { selectedCenter } = useCenter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPDFSheet, setShowPDFSheet] = useState(false);
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  const { data: entries, isLoading: entriesLoading, error: entriesError, refetch } = useMilkEntries(formattedDate, selectedCenter?.id);
  const { data: stats, isLoading: statsLoading } = useTodayStats(selectedCenter?.id);

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
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          {(entries?.length || 0) > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPDFSheet(true)}
            >
              <FileText className="h-5 w-5" />
            </Button>
          )}
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
          ) : entriesError ? (
            <ErrorDisplay
              message={getReadableErrorMessage(entriesError)}
              onRetry={() => refetch()}
              variant="card"
            />
          ) : entries?.length === 0 ? (
            <EmptyState
              icon={Milk}
              title={isToday(selectedDate) ? 'No entries yet today' : 'No entries for this date'}
              description={isToday(selectedDate) 
                ? 'Start your collection by adding the first milk entry.' 
                : 'No milk was collected on this date.'}
              action={isToday(selectedDate) ? {
                label: 'Add First Entry',
                onClick: () => navigate('/milk/add'),
                icon: Plus,
              } : undefined}
              variant="muted"
            />
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

      {/* PDF Action Sheet */}
      <PDFActionSheet
        open={showPDFSheet}
        onOpenChange={setShowPDFSheet}
        title="Daily Collection Report"
        description={`Report for ${format(selectedDate, 'dd MMMM yyyy')}`}
        generatePDF={() => generateDailyReport(formattedDate, selectedCenter?.id)}
        filename={`daily-collection-${formattedDate}.pdf`}
      />
    </AppLayout>
  );
}
