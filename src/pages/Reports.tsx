import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Reports() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4">
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reports coming soon. This screen will allow you to generate daily, weekly, and settlement reports.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
