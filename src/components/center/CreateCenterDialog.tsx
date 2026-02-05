import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated: (centerId: string) => void;
}

export function CreateCenterDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
}: CreateCenterDialogProps) {
  const [centerName, setCenterName] = useState('');
  const [centerCode, setCenterCode] = useState('');
  const [villageOrArea, setVillageOrArea] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const generateCode = (name: string) => {
    // Generate a simple code from the name
    const baseCode = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${baseCode}${randomSuffix}`;
  };

  const handleNameChange = (name: string) => {
    setCenterName(name);
    if (!centerCode || centerCode === generateCode(centerName)) {
      setCenterCode(generateCode(name));
    }
  };

  const handleCreate = async () => {
    if (!centerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a center name',
        variant: 'destructive',
      });
      return;
    }

    if (!centerCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a center code',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the collection center
      const { data: centerData, error: centerError } = await supabase
        .from('collection_centers')
        .insert({
          name: centerName.trim(),
          code: centerCode.trim().toUpperCase(),
          village_or_area: villageOrArea.trim() || null,
          phone: phone.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (centerError) throw centerError;

      // Create the user center assignment
      const { error: assignmentError } = await supabase
        .from('user_center_assignments')
        .insert({
          user_id: userId,
          center_id: centerData.id,
          is_primary: true,
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Collection Center Created',
        description: 'Your collection center has been created and assigned to you.',
      });

      onCreated(centerData.id);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating center:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create collection center',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create Your Collection Center
          </DialogTitle>
          <DialogDescription>
            Before adding farmers, please create your collection center. 
            This is a one-time setup and will be visible only to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="center-name">Center Name *</Label>
            <Input
              id="center-name"
              placeholder="e.g., Ram's Dairy Center"
              value={centerName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="center-code">Center Code *</Label>
            <Input
              id="center-code"
              placeholder="e.g., RDC001"
              value={centerCode}
              onChange={(e) => setCenterCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              A unique code for your center (auto-generated)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="village">Village/Area</Label>
            <Input
              id="village"
              placeholder="e.g., Anantapur"
              value={villageOrArea}
              onChange={(e) => setVillageOrArea(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="e.g., 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!centerName.trim() || !centerCode.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creating...' : 'Create & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
