import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Farmers() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4">
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Farmers management coming soon. This screen will allow you to view, add, and manage farmer records.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
