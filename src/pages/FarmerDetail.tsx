import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PDFActionSheet } from '@/components/pdf/PDFActionSheet';
import { useFarmer } from '@/hooks/useFarmers';
import { useSettlements } from '@/hooks/useSettlements';
import { generateFarmerStatementReport } from '@/hooks/usePDFReports';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Building2,
  Edit,
  FileText,
  History,
  Lock,
  MapPin,
  Milk,
  Phone,
  Plus,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FarmerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { data: farmer, isLoading, error } = useFarmer(id || '');
  const { data: settlements } = useSettlements(farmer?.center_id || undefined);
  const [selectedSettlementForPDF, setSelectedSettlementForPDF] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  // Get locked/paid settlements for PDF generation
  const availableSettlements = settlements?.filter(s => s.status === 'locked' || s.status === 'paid') || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !farmer) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-4">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate('/farmers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="rounded-lg bg-destructive/10 p-6 text-center text-destructive">
            Farmer not found or an error occurred.
          </div>
        </div>
      </AppLayout>
    );
  }

  const milkTypeLabel =
    farmer.milk_type === 'both'
      ? 'Cow & Buffalo'
      : farmer.milk_type === 'cow'
      ? 'Cow'
      : 'Buffalo';

  const hasBankDetails =
    farmer.bank_account_holder_name ||
    farmer.bank_account_number ||
    farmer.bank_ifsc ||
    farmer.bank_name;

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg p-4 pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => navigate('/farmers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Farmer Details</h1>
        </div>

        {/* Summary Card */}
        <Card className="mb-4 shadow-dairy">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {farmer.full_name}
                  </h2>
                  <Badge
                    variant={farmer.is_active ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      farmer.is_active
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {farmer.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-lg font-medium text-primary">{farmer.farmer_code}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{farmer.village || farmer.address || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Milk className="h-4 w-4" />
                <span>{milkTypeLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{farmer.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{farmer.collection_centers?.name || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Card */}
        <Card className="mb-4 shadow-dairy">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Bank Details
              {!isAdmin && (
                <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  View Only
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasBankDetails ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Holder</span>
                  <span className="font-medium">
                    {farmer.bank_account_holder_name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-medium font-mono">
                    {farmer.bank_account_number
                      ? `****${farmer.bank_account_number.slice(-4)}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IFSC Code</span>
                  <span className="font-medium font-mono uppercase">
                    {farmer.bank_ifsc || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-medium">{farmer.bank_name || '-'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bank details added</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="h-14 w-full"
            onClick={() => navigate(`/milk/add?farmerId=${farmer.id}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Milk Entry
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-14"
              onClick={() => navigate(`/farmers/${farmer.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Farmer
            </Button>
            {availableSettlements.length > 0 && (
              <Button
                variant="outline"
                className="h-14"
                onClick={() => setSelectedSettlementForPDF(availableSettlements[0].id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Statement
              </Button>
            )}
          </div>
        </div>

        {/* Farmer Statement PDF Sheet */}
        {selectedSettlementForPDF && (
          <PDFActionSheet
            open={!!selectedSettlementForPDF}
            onOpenChange={(open) => !open && setSelectedSettlementForPDF(null)}
            title="Farmer Statement"
            description={`Statement for ${farmer.full_name}`}
            generatePDF={() => generateFarmerStatementReport(farmer.id, selectedSettlementForPDF)}
            filename={`farmer-statement-${farmer.farmer_code || farmer.id}.pdf`}
          />
        )}
      </div>
    </AppLayout>
  );
}
