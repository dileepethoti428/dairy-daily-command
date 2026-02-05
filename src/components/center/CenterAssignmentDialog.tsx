import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CenterAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centers: Array<{ id: string; name: string; code: string }>;
  userId: string;
  onAssigned: (centerId: string) => void;
}

export function CenterAssignmentDialog({
  open,
  onOpenChange,
  centers,
  userId,
  onAssigned,
}: CenterAssignmentDialogProps) {
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!selectedCenterId) return;

    setIsSubmitting(true);
    try {
      // Create the user center assignment
      const { error } = await supabase
        .from('user_center_assignments')
        .insert({
          user_id: userId,
          center_id: selectedCenterId,
          is_primary: true,
        });

      if (error) throw error;

      toast({
        title: 'Center Assigned',
        description: 'You have been assigned to the collection center.',
      });

      onAssigned(selectedCenterId);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign center',
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
            Select Your Collection Center
          </DialogTitle>
          <DialogDescription>
            Before adding farmers, please select the collection center you will be working at. 
            This is a one-time setup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select
            value={selectedCenterId}
            onValueChange={setSelectedCenterId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a collection center" />
            </SelectTrigger>
            <SelectContent>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name} ({center.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAssign}
            disabled={!selectedCenterId || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Assigning...' : 'Confirm & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
