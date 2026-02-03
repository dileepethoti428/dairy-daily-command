import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface Settlement {
  id: string;
  center_id: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'locked' | 'paid';
  total_litres: number | null;
  total_amount: number | null;
  locked_at: string | null;
  locked_by: string | null;
  paid_at: string | null;
  paid_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  collection_centers?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface SettlementFarmerBreakdown {
  farmer_id: string;
  farmer_name: string;
  farmer_code: string | null;
  village: string | null;
  total_litres: number;
  total_amount: number;
  entries_count: number;
}

export interface CreateSettlementData {
  center_id: string;
  start_date: string;
  end_date: string;
}

// Fetch all settlements
export function useSettlements(centerId?: string) {
  return useQuery({
    queryKey: ['settlements', centerId],
    queryFn: async () => {
      let query = supabase
        .from('settlements')
        .select(`
          *,
          collection_centers:center_id (
            id,
            name,
            code
          )
        `)
        .order('start_date', { ascending: false });

      if (centerId) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Settlement[];
    },
  });
}

// Fetch a single settlement
export function useSettlement(id: string) {
  return useQuery({
    queryKey: ['settlement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          collection_centers:center_id (
            id,
            name,
            code
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Settlement;
    },
    enabled: !!id,
  });
}

// Fetch farmer-wise breakdown for a settlement
export function useSettlementFarmerBreakdown(settlementId: string) {
  return useQuery({
    queryKey: ['settlement-farmer-breakdown', settlementId],
    queryFn: async () => {
      // First get the settlement details to get date range
      const { data: settlement, error: settleErr } = await supabase
        .from('settlements')
        .select('start_date, end_date, center_id')
        .eq('id', settlementId)
        .single();

      if (settleErr) throw settleErr;

      // Get all milk entries for this settlement period
      const { data: entries, error: entriesErr } = await supabase
        .from('milk_entries')
        .select(`
          farmer_id,
          quantity_liters,
          total_amount,
          farmers:farmer_id (
            id,
            full_name,
            farmer_code,
            village
          )
        `)
        .eq('settlement_id', settlementId);

      if (entriesErr) throw entriesErr;

      // Aggregate by farmer
      const farmerMap = new Map<string, SettlementFarmerBreakdown>();

      for (const entry of entries || []) {
        const farmerId = entry.farmer_id;
        const farmer = entry.farmers as any;
        
        if (!farmerMap.has(farmerId)) {
          farmerMap.set(farmerId, {
            farmer_id: farmerId,
            farmer_name: farmer?.full_name || 'Unknown',
            farmer_code: farmer?.farmer_code || null,
            village: farmer?.village || null,
            total_litres: 0,
            total_amount: 0,
            entries_count: 0,
          });
        }

        const existing = farmerMap.get(farmerId)!;
        existing.total_litres += entry.quantity_liters || 0;
        existing.total_amount += entry.total_amount || 0;
        existing.entries_count += 1;
      }

      return Array.from(farmerMap.values()).sort((a, b) => 
        a.farmer_name.localeCompare(b.farmer_name)
      );
    },
    enabled: !!settlementId,
  });
}

// Get the current open settlement
export function useCurrentOpenSettlement(centerId?: string) {
  return useQuery({
    queryKey: ['current-open-settlement', centerId],
    queryFn: async () => {
      let query = supabase
        .from('settlements')
        .select('*')
        .eq('status', 'open')
        .order('start_date', { ascending: false })
        .limit(1);

      if (centerId) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data?.[0] as Settlement | undefined;
    },
  });
}

// Create a new settlement
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSettlementData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: settlement, error } = await supabase
        .from('settlements')
        .insert({
          center_id: data.center_id,
          start_date: data.start_date,
          end_date: data.end_date,
          status: 'open',
          created_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return settlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['current-open-settlement'] });
    },
  });
}

// Lock a settlement
export function useLockSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settlementId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('lock_settlement', {
        p_settlement_id: settlementId,
        p_user_id: user?.user?.id || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, settlementId) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
      queryClient.invalidateQueries({ queryKey: ['current-open-settlement'] });
      queryClient.invalidateQueries({ queryKey: ['milk-entries'] });
    },
  });
}

// Mark settlement as paid
export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settlementId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('mark_settlement_paid', {
        p_settlement_id: settlementId,
        p_user_id: user?.user?.id || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, settlementId) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlement', settlementId] });
    },
  });
}

// Assign milk entries to a settlement
export function useAssignEntriesToSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      settlementId,
      startDate,
      endDate,
      centerId,
    }: {
      settlementId: string;
      startDate: string;
      endDate: string;
      centerId?: string;
    }) => {
      let query = supabase
        .from('milk_entries')
        .update({ settlement_id: settlementId })
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .is('settlement_id', null);

      if (centerId) {
        query = query.eq('center_id', centerId);
      }

      const { error } = await query;
      if (error) throw error;

      // Update settlement totals
      await supabase.rpc('update_settlement_totals', {
        p_settlement_id: settlementId,
      });

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlement', variables.settlementId] });
      queryClient.invalidateQueries({ queryKey: ['milk-entries'] });
    },
  });
}

// Calculate suggested date range for new settlement
export function getSuggestedSettlementDates() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  let startDate: Date;
  let endDate: Date;
  
  if (dayOfMonth <= 15) {
    // First half of month: 1st to 15th
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 15);
  } else {
    // Second half of month: 16th to end of month
    startDate = new Date(today.getFullYear(), today.getMonth(), 16);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
  }
  
  return {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  };
}
