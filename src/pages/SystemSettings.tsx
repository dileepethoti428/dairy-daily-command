import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useSystemSettings, useUpdateBusinessInfo, BusinessInfo } from '@/hooks/useSystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings as SettingsIcon,
  Building2,
  Cog,
  DollarSign,
  AlertCircle,
  Loader2,
  Lock,
  Info,
} from 'lucide-react';

export default function SystemSettings() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: settings, isLoading } = useSystemSettings();
  const updateBusinessInfo = useUpdateBusinessInfo();

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    currency: '₹',
    contact_email: '',
    contact_phone: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.business_info) {
      setBusinessInfo(settings.business_info);
    }
  }, [settings]);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              Only administrators can access system settings.
            </p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  const handleBusinessInfoChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveBusinessInfo = async () => {
    try {
      await updateBusinessInfo.mutateAsync(businessInfo);
      setHasChanges(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your application settings
          </p>
        </div>

        {/* Business Information */}
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Business Information
            </CardTitle>
            <CardDescription>
              This information appears on reports and PDFs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="e.g., MilkPro Dairy"
                value={businessInfo.name}
                onChange={(e) => handleBusinessInfoChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency Symbol</Label>
              <Input
                id="currency"
                placeholder="₹"
                value={businessInfo.currency}
                onChange={(e) => handleBusinessInfoChange('currency', e.target.value)}
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@example.com"
                value={businessInfo.contact_email}
                onChange={(e) => handleBusinessInfoChange('contact_email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="9876543210"
                value={businessInfo.contact_phone}
                onChange={(e) => handleBusinessInfoChange('contact_phone', e.target.value)}
              />
            </div>

            {hasChanges && (
              <Button
                className="w-full"
                onClick={handleSaveBusinessInfo}
                disabled={updateBusinessInfo.isPending}
              >
                {updateBusinessInfo.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Operational Settings */}
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cog className="h-5 w-5 text-primary" />
              Operational Settings
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Core operational parameters (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
              <div>
                <p className="text-sm font-medium">Default Unit</p>
                <p className="text-xs text-muted-foreground">Measurement unit for milk</p>
              </div>
              <Badge variant="secondary">
                {settings?.operational_settings?.default_unit || 'Litres'}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
              <div>
                <p className="text-sm font-medium">Settlement Cycle</p>
                <p className="text-xs text-muted-foreground">Days between settlements</p>
              </div>
              <Badge variant="secondary">
                {settings?.operational_settings?.settlement_cycle_days || 15} days
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Configuration (Coming Soon) */}
        <Card className="border-dashed shadow-dairy">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
              <DollarSign className="h-5 w-5" />
              Pricing Configuration
              <Badge variant="outline" className="ml-2">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Configure rate slabs based on FAT/SNF content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Feature in Development</p>
                <p className="text-xs text-muted-foreground">
                  Automatic rate calculation based on milk quality parameters will be
                  available in a future update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Quick Links */}
        <Card className="shadow-dairy">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/centers')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Manage Collection Centers
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
