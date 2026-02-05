import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PricingSlab {
  id: string;
  min_fat: number;
  max_fat: number;
  min_snf: number | null;
  max_snf: number | null;
  rate_per_litre: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PricingSlabInput = Omit<PricingSlab, 'id' | 'created_at' | 'updated_at'>;

export function usePricingSlabs() {
  return useQuery({
    queryKey: ['pricing-slabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_slabs')
        .select('*')
        .order('min_fat', { ascending: true });

      if (error) throw error;
      return data as PricingSlab[];
    },
  });
}

export function useCreatePricingSlab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (slab: PricingSlabInput) => {
      const { data, error } = await supabase
        .from('pricing_slabs')
        .insert(slab)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-slabs'] });
      toast({
        title: 'Rate Slab Created',
        description: 'The pricing slab has been added.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePricingSlab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...slab }: Partial<PricingSlab> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_slabs')
        .update(slab)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-slabs'] });
      toast({
        title: 'Rate Slab Updated',
        description: 'The pricing slab has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeletePricingSlab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_slabs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-slabs'] });
      toast({
        title: 'Rate Slab Deleted',
        description: 'The pricing slab has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
