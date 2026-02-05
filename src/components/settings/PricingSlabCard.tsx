import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Plus, Pencil, Trash2 } from 'lucide-react';
import { usePricingSlabs, useDeletePricingSlab, PricingSlab } from '@/hooks/usePricingSlabs';
import { PricingSlabDialog } from './PricingSlabDialog';
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

export function PricingSlabCard() {
  const { data: slabs, isLoading } = usePricingSlabs();
  const deleteSlab = useDeletePricingSlab();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<PricingSlab | null>(null);
  const [deletingSlabId, setDeletingSlabId] = useState<string | null>(null);

  const handleEdit = (slab: PricingSlab) => {
    setEditingSlab(slab);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingSlab(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingSlabId) {
      await deleteSlab.mutateAsync(deletingSlabId);
      setDeletingSlabId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-dairy">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-dairy">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Pricing Configuration
            </div>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add Slab
            </Button>
          </CardTitle>
          <CardDescription>
            Configure rate slabs based on FAT/SNF content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {slabs && slabs.length > 0 ? (
            slabs.map((slab) => (
              <div
                key={slab.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      FAT: {slab.min_fat}% - {slab.max_fat}%
                    </span>
                    {slab.min_snf !== null && slab.max_snf !== null && (
                      <span className="text-sm text-muted-foreground">
                        | SNF: {slab.min_snf}% - {slab.max_snf}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slab.is_active ? 'default' : 'secondary'}>
                      ₹{slab.rate_per_litre}/L
                    </Badge>
                    {!slab.is_active && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(slab)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeletingSlabId(slab.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-6 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No Rate Slabs Configured</p>
              <p className="text-xs text-muted-foreground">
                Add rate slabs to automatically calculate milk prices based on quality
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PricingSlabDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingSlab={editingSlab}
      />

      <AlertDialog
        open={!!deletingSlabId}
        onOpenChange={(open) => !open && setDeletingSlabId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rate Slab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rate slab? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
