import { AppLayout } from '@/components/layout/AppLayout';
import { CollectionReportView } from '@/components/reports/CollectionReportView';

export default function Reports() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-xl font-semibold text-foreground">Collection Reports</h1>
          <p className="text-sm text-muted-foreground">
            View and export milk collection data
          </p>
        </div>

        <CollectionReportView />
      </div>
    </AppLayout>
  );
}
