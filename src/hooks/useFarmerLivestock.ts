import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FarmerLivestock {
  id: string;
  farmer_id: string;
  animal_type: 'cow' | 'buffalo';
  breed: string;
  animal_count: number;
  expected_daily_liters: number;
  created_at: string;
  updated_at: string;
}

export interface LivestockInput {
  animal_type: 'cow' | 'buffalo';
  breed: string;
  animal_count: number;
  expected_daily_liters: number;
}

export function useFarmerLivestock(farmerId?: string) {
  return useQuery({
    queryKey: ['farmer-livestock', farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmer_livestock')
        .select('*')
        .eq('farmer_id', farmerId!)
        .order('animal_type');

      if (error) throw error;
      return data as FarmerLivestock[];
    },
    enabled: !!farmerId,
  });
}

export function useSaveFarmerLivestock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      farmerId,
      livestock,
    }: {
      farmerId: string;
      livestock: LivestockInput[];
    }) => {
      // Delete existing livestock for farmer, then insert new ones
      const { error: deleteError } = await supabase
        .from('farmer_livestock')
        .delete()
        .eq('farmer_id', farmerId);

      if (deleteError) throw deleteError;

      if (livestock.length === 0) return [];

      const rows = livestock.map((l) => ({
        farmer_id: farmerId,
        animal_type: l.animal_type,
        breed: l.breed,
        animal_count: l.animal_count,
        expected_daily_liters: l.expected_daily_liters,
      }));

      const { data, error } = await supabase
        .from('farmer_livestock')
        .insert(rows)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farmer-livestock', variables.farmerId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving livestock details',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Helper: get quantity warning for a given quantity vs expected
export function getQuantityWarning(
  quantity: number,
  expectedDailyLiters: number
): { level: 'amber' | 'red'; message: string } | null {
  if (!expectedDailyLiters || expectedDailyLiters <= 0 || !quantity) return null;

  const dangerThreshold = expectedDailyLiters * 1.2;

  if (quantity > dangerThreshold) {
    return {
      level: 'red',
      message: `Quantity (${quantity}L) is significantly above expected yield (${expectedDailyLiters}L). Possible fraud — verify source.`,
    };
  } else if (quantity > expectedDailyLiters) {
    return {
      level: 'amber',
      message: `Quantity (${quantity}L) is above expected daily yield (${expectedDailyLiters}L). Please verify.`,
    };
  }

  return null;
}
