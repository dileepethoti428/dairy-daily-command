import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SettlementCard } from '@/components/settlements/SettlementCard';
import { CreateSettlementDialog } from '@/components/settlements/CreateSettlementDialog';
import { useSettlements, useCurrentOpenSettlement } from '@/hooks/useSettlements';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, FileText, AlertCircle, Lock } from 'lucide-react';

// Using a placeholder center ID for now - in a real app this would come from user context
const DEFAULT_CENTER_ID = '00000000-0000-0000-0000-000000000000';

export default function SettlementList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: settlements, isLoading } = useSettlements();
  const { data: openSettlement } = useCurrentOpenSettlement();

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Settlements</h1>
              <p className="text-sm text-muted-foreground">15-day payment cycles</p>
            </div>
          </div>
          {isAdmin && !openSettlement && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          )}
        </div>

        {/* Staff notice */}
        {!isAdmin && (
          <Card className="mb-4 border-muted bg-muted/30 shadow-dairy">
            <CardContent className="flex items-center gap-3 p-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only admins can create and manage settlements
              </p>
            </CardContent>
          </Card>
        )}

        {/* Open Settlement Alert - Admin only */}
        {isAdmin && openSettlement && (
          <Card className="mb-4 border-warning bg-warning/5 shadow-dairy">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Open Settlement</p>
                <p className="text-sm text-muted-foreground">
                  A settlement period is currently open. Lock it before creating a new one.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/settlements/${openSettlement.id}`)}
              >
                View
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Settlements List */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              All Settlements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            ) : settlements?.length === 0 ? (
              <div className="rounded-lg bg-muted p-6 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No settlements yet
                </p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Settlement
                  </Button>
                )}
              </div>
            ) : (
              settlements?.map((settlement) => (
                <SettlementCard key={settlement.id} settlement={settlement} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Settlement Dialog */}
      <CreateSettlementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        centerId={DEFAULT_CENTER_ID}
      />
    </AppLayout>
  );
}
