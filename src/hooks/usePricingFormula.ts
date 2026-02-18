import { useEffect } from 'react';
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

// Fetch pricing formula — for a specific center or global fallback
// Returns { formula, isInherited } where isInherited=true means it came from the global fallback
export function usePricingFormula(centerId?: string | null) {
  const { selectedCenter } = useCenter();
  const effectiveCenterId = centerId !== undefined ? centerId : selectedCenter?.id;
  
  return useQuery({
    queryKey: ['pricing-formula', effectiveCenterId],
    queryFn: async () => {
      // First try to get center-specific formula
      if (effectiveCenterId) {
        const { data: centerFormula, error: centerError } = await supabase
          .from('pricing_formula')
          .select('*')
          .eq('collection_center_id', effectiveCenterId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (centerError) throw centerError;
        if (centerFormula) return { formula: centerFormula as PricingFormula, isInherited: false };
      }
      
      // Fall back to global formula (null center_id)
      const { data: globalFormula, error: globalError } = await supabase
        .from('pricing_formula')
        .select('*')
        .is('collection_center_id', null)
        .eq('is_active', true)
        .maybeSingle();
      
      if (globalError) throw globalError;
      return { formula: globalFormula as PricingFormula | null, isInherited: true };
    },
  });
}

/**
 * Auto-creates a center-specific formula row by copying from global when a partner's
 * center has no formula yet. This ensures full isolation — admin changes to global
 * will never affect a center that has been auto-initialized.
 */
export function useEnsureCenterFormula(centerId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!centerId) return;

    async function ensureFormula() {
      // Check if center-specific formula already exists
      const { data: existing } = await supabase
        .from('pricing_formula')
        .select('id')
        .eq('collection_center_id', centerId)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) return; // Already has its own formula

      // Get global formula to copy from
      const { data: global } = await supabase
        .from('pricing_formula')
        .select('*')
        .is('collection_center_id', null)
        .eq('is_active', true)
        .maybeSingle();

      // Create center-specific formula (copy from global or use defaults)
      const { error } = await supabase
        .from('pricing_formula')
        .insert({
          collection_center_id: centerId,
          fat_multiplier: global?.fat_multiplier ?? 6,
          snf_multiplier: global?.snf_multiplier ?? 2,
          constant_value: global?.constant_value ?? 6.8,
          mode: (global?.mode as PricingMode) ?? 'hybrid',
          is_active: true,
        });

      if (!error) {
        // Refresh the formula query so UI reflects the new center-specific row
        queryClient.invalidateQueries({ queryKey: ['pricing-formula', centerId] });
      }
    }

    ensureFormula();
  }, [centerId, queryClient]);
}

// Update or create pricing formula for a specific center (or global if no centerId)
export function useUpdatePricingFormula(centerId?: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: PricingFormulaInput) => {
      const targetCenterId = centerId ?? null;

      // Try to find existing formula for this center (or global)
      let existingQuery = supabase
        .from('pricing_formula')
        .select('id')
        .eq('is_active', true);

      if (targetCenterId) {
        existingQuery = existingQuery.eq('collection_center_id', targetCenterId);
      } else {
        existingQuery = existingQuery.is('collection_center_id', null);
      }

      const { data: existingFormula } = await existingQuery.maybeSingle();
      
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
          .maybeSingle();
        
        if (error) throw error;
        return data;
      } else {
        // Create new formula for this center
        const { data, error } = await supabase
          .from('pricing_formula')
          .insert({
            collection_center_id: targetCenterId,
            fat_multiplier: input.fat_multiplier,
            snf_multiplier: input.snf_multiplier,
            constant_value: input.constant_value,
            mode: input.mode,
            is_active: true,
          })
          .select()
          .maybeSingle();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-formula'] });
      toast({
        title: 'Pricing Formula Updated',
        description: centerId
          ? 'The pricing formula for this center has been saved.'
          : 'The global pricing formula has been saved.',
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
