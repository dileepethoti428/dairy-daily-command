import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SettlementSummary } from '@/components/settlements/SettlementSummary';
import { FarmerBreakdownCard } from '@/components/settlements/FarmerBreakdownCard';
import { PDFActionSheet } from '@/components/pdf/PDFActionSheet';
import {
  useSettlement,
  useSettlementFarmerBreakdown,
  useLockSettlement,
  useMarkSettlementPaid,
} from '@/hooks/useSettlements';
import { generateSettlementReport, generateFarmerStatementReport } from '@/hooks/usePDFReports';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Users,
  Lock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
} from 'lucide-react';

export default function SettlementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [showPDFSheet, setShowPDFSheet] = useState(false);
  const [selectedFarmerForPDF, setSelectedFarmerForPDF] = useState<string | null>(null);
  const { data: settlement, isLoading: settlementLoading } = useSettlement(id!);
  const { data: farmerBreakdown, isLoading: breakdownLoading } =
    useSettlementFarmerBreakdown(id!);
  const lockSettlement = useLockSettlement();
  const markPaid = useMarkSettlementPaid();

  const handleLock = async () => {
    try {
      await lockSettlement.mutateAsync(id!);
      toast.success('Settlement locked successfully');
      setShowLockDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to lock settlement');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await markPaid.mutateAsync(id!);
      toast.success('Settlement marked as paid');
      setShowPaidDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as paid');
    }
  };

  if (settlementLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (!settlement) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4 text-center">
          <p className="text-muted-foreground">Settlement not found</p>
          <Button variant="link" onClick={() => navigate('/settlements')}>
            Back to Settlements
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => navigate('/settlements')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Settlement Details
              </h1>
              <p className="text-sm text-muted-foreground">
                {farmerBreakdown?.length || 0} farmers
              </p>
            </div>
          </div>
          {(settlement.status === 'locked' || settlement.status === 'paid') && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPDFSheet(true)}
            >
              <FileText className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Summary Card */}
        <SettlementSummary settlement={settlement} />

        {/* Action Buttons - Admin Only */}
        {isAdmin && settlement.status === 'open' && (
          <Card className="shadow-dairy">
            <CardContent className="p-4">
              {(!farmerBreakdown || farmerBreakdown.length === 0) ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Cannot Lock Empty Settlement</p>
                    <p className="text-xs text-muted-foreground">
                      Add milk entries to this period before locking.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    className="w-full h-12"
                    variant="destructive"
                    onClick={() => setShowLockDialog(true)}
                    disabled={lockSettlement.isPending || breakdownLoading}
                  >
                    {lockSettlement.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Lock Settlement
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Locking will prevent all milk entry edits for this period
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isAdmin && settlement.status === 'locked' && (
          <Card className="shadow-dairy">
            <CardContent className="p-4">
              <Button
                className="w-full h-12"
                onClick={() => setShowPaidDialog(true)}
                disabled={markPaid.isPending}
              >
                {markPaid.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Mark as Paid
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Mark this settlement as paid to all farmers
              </p>
            </CardContent>
          </Card>
        )}

        {/* Staff notice for locked settlements */}
        {!isAdmin && settlement.status === 'open' && (
          <Card className="shadow-dairy border-muted bg-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only admins can lock settlements and mark them as paid
              </p>
            </CardContent>
          </Card>
        )}

        {/* Farmer Breakdown */}
        <Card className="shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Farmer-wise Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {breakdownLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : farmerBreakdown?.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No entries in this settlement period
                </p>
              </div>
            ) : (
              farmerBreakdown?.map((breakdown) => (
                <FarmerBreakdownCard 
                  key={breakdown.farmer_id} 
                  breakdown={breakdown}
                  showPDFButton={settlement.status === 'locked' || settlement.status === 'paid'}
                  onPDFClick={() => setSelectedFarmerForPDF(breakdown.farmer_id)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Lock Settlement?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Once locked:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>All milk entries in this period become read-only</li>
                <li>No new entries can be added to this period</li>
                <li>Existing entries cannot be edited or deleted</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Lock Settlement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Paid Confirmation Dialog */}
      <AlertDialog open={showPaidDialog} onOpenChange={setShowPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Mark as Paid?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the settlement as paid. Make sure all farmer payments
              have been processed before confirming.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkPaid}>
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settlement Summary PDF Sheet */}
      <PDFActionSheet
        open={showPDFSheet}
        onOpenChange={setShowPDFSheet}
        title="Settlement Summary Report"
        description={`${format(new Date(settlement.start_date), 'dd MMM')} - ${format(new Date(settlement.end_date), 'dd MMM yyyy')}`}
        generatePDF={() => generateSettlementReport(id!)}
        filename={`settlement-summary-${settlement.start_date}-to-${settlement.end_date}.pdf`}
      />

      {/* Farmer Statement PDF Sheet */}
      <PDFActionSheet
        open={!!selectedFarmerForPDF}
        onOpenChange={(open) => !open && setSelectedFarmerForPDF(null)}
        title="Farmer Statement"
        description="15-Day Settlement Statement"
        generatePDF={() => generateFarmerStatementReport(selectedFarmerForPDF!, id!)}
        filename={`farmer-statement-${selectedFarmerForPDF}-${settlement.start_date}.pdf`}
      />
    </AppLayout>
  );
}
