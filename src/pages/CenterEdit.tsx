import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollectionCenter, useUpdateCollectionCenter } from '@/hooks/useCollectionCenters';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Building2, AlertCircle, Loader2 } from 'lucide-react';

export default function CenterEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: center, isLoading } = useCollectionCenter(id || '');
  const updateCenter = useUpdateCollectionCenter();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    village_or_area: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    if (center) {
      setFormData({
        name: center.name,
        code: center.code,
        village_or_area: center.village_or_area || '',
        address: center.address || '',
        phone: center.phone || '',
      });
    }
  }, [center]);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              Only administrators can edit collection centers.
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
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateCenter.mutateAsync({
        id: id!,
        name: formData.name,
        code: formData.code.toUpperCase(),
        village_or_area: formData.village_or_area || null,
        address: formData.address || null,
        phone: formData.phone || null,
      });
      navigate(`/centers/${id}`);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name.trim() !== '' && formData.code.trim() !== '';

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/centers/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Edit Center</h1>
            <p className="text-sm text-muted-foreground">Update collection center details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-dairy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Center Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Center Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Collection Center"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Center Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., MC001"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this center (max 10 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="village_or_area">Village / Area</Label>
                <Input
                  id="village_or_area"
                  placeholder="e.g., Rajpur Village"
                  value={formData.village_or_area}
                  onChange={(e) => handleChange('village_or_area', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter the complete address..."
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., 9876543210"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/centers/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || updateCenter.isPending}
            >
              {updateCenter.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
