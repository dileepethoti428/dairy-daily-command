import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCenter } from '@/contexts/CenterContext';

export type PricingMode = 'manual' | 'auto' | 'hybrid';

export interface PricingFormula {
  id: string;
  collection_center_id: string | null;
  fat_multiplier: number;
  snf_multiplier: number;
  constant_value: number;
  mode: PricingMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingFormulaInput {
  fat_multiplier: number;
  snf_multiplier: number;
  constant_value: number;
  mode: PricingMode;
}

/**
 * Calculate rate per litre using the formula:
 * rate = (fat × fat_multiplier) + (snf × snf_multiplier) - constant_value
 */
export function calculateRate(
  fat: number,
  snf: number,
  formula: PricingFormula | null
): number | null {
  if (!formula) return null;
  
  const rate = 
    (fat * formula.fat_multiplier) + 
    (snf * formula.snf_multiplier) - 
    formula.constant_value;
  
  // Round to 2 decimal places and ensure non-negative
  return Math.max(0, Math.round(rate * 100) / 100);
}

/**
 * Get the breakdown of rate calculation for display
 */
export function getRateBreakdown(
  fat: number,
  snf: number,
  formula: PricingFormula | null
): {
  fatContribution: number;
  snfContribution: number;
  constantSubtract: number;
  finalRate: number;
  formula: string;
} | null {
  if (!formula) return null;
  
  const fatContribution = Math.round(fat * formula.fat_multiplier * 100) / 100;
  const snfContribution = Math.round(snf * formula.snf_multiplier * 100) / 100;
  const constantSubtract = formula.constant_value;
  const finalRate = Math.max(0, Math.round((fatContribution + snfContribution - constantSubtract) * 100) / 100);
  
  return {
    fatContribution,
    snfContribution,
    constantSubtract,
    finalRate,
    formula: `(${fat} × ${formula.fat_multiplier}) + (${snf} × ${formula.snf_multiplier}) − ${formula.constant_value}`,
  };
}

// Fetch pricing formula for current center (or global)
export function usePricingFormula() {
  const { selectedCenter } = useCenter();
  
  return useQuery({
    queryKey: ['pricing-formula', selectedCenter?.id],
    queryFn: async () => {
      // First try to get center-specific formula
      if (selectedCenter?.id) {
        const { data: centerFormula, error: centerError } = await supabase
          .from('pricing_formula')
          .select('*')
          .eq('collection_center_id', selectedCenter.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (centerError) throw centerError;
        if (centerFormula) return centerFormula as PricingFormula;
      }
      
      // Fall back to global formula (null center_id)
      const { data: globalFormula, error: globalError } = await supabase
        .from('pricing_formula')
        .select('*')
        .is('collection_center_id', null)
        .eq('is_active', true)
        .maybeSingle();
      
      if (globalError) throw globalError;
      return globalFormula as PricingFormula | null;
    },
  });
}

// Update or create pricing formula
export function useUpdatePricingFormula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedCenter } = useCenter();

  return useMutation({
    mutationFn: async (input: PricingFormulaInput) => {
      // Try to update existing global formula first
      const { data: existingFormula } = await supabase
        .from('pricing_formula')
        .select('id')
        .is('collection_center_id', null)
        .eq('is_active', true)
        .maybeSingle();
      
      if (existingFormula) {
        // Update existing
        const { data, error } = await supabase
          .from('pricing_formula')
          .update({
            fat_multiplier: input.fat_multiplier,
            snf_multiplier: input.snf_multiplier,
            constant_value: input.constant_value,
            mode: input.mode,
          })
          .eq('id', existingFormula.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('pricing_formula')
          .insert({
            collection_center_id: null, // Global formula
            fat_multiplier: input.fat_multiplier,
            snf_multiplier: input.snf_multiplier,
            constant_value: input.constant_value,
            mode: input.mode,
            is_active: true,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-formula'] });
      toast({
        title: 'Pricing Formula Updated',
        description: 'The pricing formula has been saved.',
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
