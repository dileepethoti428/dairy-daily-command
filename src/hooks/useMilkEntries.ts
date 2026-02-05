import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type MilkSession = 'morning' | 'evening';

export interface MilkEntry {
  id: string;
  farmer_id: string;
  center_id: string | null;
  settlement_id: string | null;
  entry_date: string;
  session: MilkSession;
  quantity_liters: number;
  fat_percentage: number;
  snf_percentage: number;
  rate_per_litre: number | null;
  total_amount: number | null;
  is_locked: boolean;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  farmers?: {
    id: string;
    full_name: string;
    farmer_code: string | null;
    village: string | null;
    is_active: boolean;
  };
}

export interface MilkEntryFormData {
  farmer_id: string;
  entry_date: string;
  session: MilkSession;
  quantity_liters: number;
  fat_percentage: number;
  snf_percentage: number;
  rate_per_litre: number;
  total_amount: number;
  center_id?: string;
}

export interface TodayStats {
  totalMilk: number;
  totalFarmers: number;
  totalAmount: number;
  avgFat: number;
  avgSnf: number;
}

// Fetch milk entries for a specific date
export function useMilkEntries(date?: string, centerId?: string) {
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['milk-entries', targetDate, centerId],
    queryFn: async () => {
      let query = supabase
        .from('milk_entries')
        .select(`
          *,
          farmers:farmer_id (
            id,
            full_name,
            farmer_code,
            village,
            is_active
          )
        `)
        .eq('entry_date', targetDate)
        .order('created_at', { ascending: false });

      if (centerId) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MilkEntry[];
    },
  });
}

// Fetch a single milk entry
export function useMilkEntry(id: string) {
  return useQuery({
    queryKey: ['milk-entry', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milk_entries')
        .select(`
          *,
          farmers:farmer_id (
            id,
            full_name,
            farmer_code,
            village,
            is_active,
            phone,
            milk_type
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MilkEntry;
    },
    enabled: !!id,
  });
}

// Fetch today's stats for the dashboard
export function useTodayStats(centerId?: string) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['today-stats', today, centerId],
    queryFn: async () => {
      let query = supabase
        .from('milk_entries')
        .select('quantity_liters, fat_percentage, snf_percentage, total_amount, farmer_id')
        .eq('entry_date', today);

      if (centerId) {
        query = query.eq('center_id', centerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalMilk: 0,
          totalFarmers: 0,
          totalAmount: 0,
          avgFat: 0,
          avgSnf: 0,
        } as TodayStats;
      }

      const uniqueFarmers = new Set(data.map((e) => e.farmer_id));
      const totalMilk = data.reduce((sum, e) => sum + (e.quantity_liters || 0), 0);
      const totalAmount = data.reduce((sum, e) => sum + (e.total_amount || 0), 0);
      const avgFat = data.reduce((sum, e) => sum + (e.fat_percentage || 0), 0) / data.length;
      const avgSnf = data.reduce((sum, e) => sum + (e.snf_percentage || 0), 0) / data.length;

      return {
        totalMilk: Math.round(totalMilk * 100) / 100,
        totalFarmers: uniqueFarmers.size,
        totalAmount: Math.round(totalAmount * 100) / 100,
        avgFat: Math.round(avgFat * 10) / 10,
        avgSnf: Math.round(avgSnf * 10) / 10,
      } as TodayStats;
    },
  });
}

// Check if entry exists for farmer on date and session
export function useCheckDuplicateEntry(farmerId: string, date: string, session: MilkSession) {
  return useQuery({
    queryKey: ['check-duplicate', farmerId, date, session],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milk_entries')
        .select('id')
        .eq('farmer_id', farmerId)
        .eq('entry_date', date)
        .eq('session', session)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!farmerId && !!date && !!session,
  });
}

// Create a new milk entry
export function useCreateMilkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: MilkEntryFormData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('milk_entries')
        .insert({
          farmer_id: entry.farmer_id,
          entry_date: entry.entry_date,
          session: entry.session,
          quantity_liters: entry.quantity_liters,
          fat_percentage: entry.fat_percentage,
          snf_percentage: entry.snf_percentage,
          rate_per_litre: entry.rate_per_litre,
          total_amount: entry.total_amount,
          center_id: entry.center_id || null,
          recorded_by: user?.user?.id || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('An entry already exists for this farmer today');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-entries'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
    },
  });
}

// Update an existing milk entry
export function useUpdateMilkEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      entry,
    }: {
      id: string;
      entry: Partial<MilkEntryFormData>;
    }) => {
      const { data, error } = await supabase
        .from('milk_entries')
        .update({
          quantity_liters: entry.quantity_liters,
          fat_percentage: entry.fat_percentage,
          snf_percentage: entry.snf_percentage,
          rate_per_litre: entry.rate_per_litre,
          total_amount: entry.total_amount,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milk-entries'] });
      queryClient.invalidateQueries({ queryKey: ['milk-entry', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
    },
  });
}
