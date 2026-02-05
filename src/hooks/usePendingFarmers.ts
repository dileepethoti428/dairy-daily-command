import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { MilkSession } from './useMilkEntries';

export interface PendingFarmer {
  id: string;
  full_name: string;
  phone: string | null;
  farmer_code: string | null;
}

export function usePendingFarmers(centerId?: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  const currentSession: MilkSession = currentHour < 12 ? 'morning' : 'evening';

  return useQuery({
    queryKey: ['pending-farmers', today, currentSession, centerId],
    queryFn: async () => {
      // Get all active farmers for the center
      let farmersQuery = supabase
        .from('farmers')
        .select('id, full_name, phone, farmer_code')
        .eq('is_active', true);

      if (centerId) {
        farmersQuery = farmersQuery.eq('center_id', centerId);
      }

      const { data: allFarmers, error: farmersError } = await farmersQuery;

      if (farmersError) throw farmersError;
      if (!allFarmers || allFarmers.length === 0) return [];

      // Get farmers who have already given milk for today's current session
      let entriesQuery = supabase
        .from('milk_entries')
        .select('farmer_id')
        .eq('entry_date', today)
        .eq('session', currentSession);

      if (centerId) {
        entriesQuery = entriesQuery.eq('center_id', centerId);
      }

      const { data: entries, error: entriesError } = await entriesQuery;

      if (entriesError) throw entriesError;

      // Get set of farmer IDs who have given milk
      const farmersWithEntries = new Set(entries?.map((e) => e.farmer_id) || []);

      // Filter to get pending farmers
      const pendingFarmers = allFarmers.filter(
        (farmer) => !farmersWithEntries.has(farmer.id)
      );

      return pendingFarmers as PendingFarmer[];
    },
  });
}

export function useFarmerAttendanceStats(centerId?: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  const currentSession: MilkSession = currentHour < 12 ? 'morning' : 'evening';

  return useQuery({
    queryKey: ['farmer-attendance-stats', today, currentSession, centerId],
    queryFn: async () => {
      // Get total active farmers count
      let farmersQuery = supabase
        .from('farmers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (centerId) {
        farmersQuery = farmersQuery.eq('center_id', centerId);
      }

      const { count: totalFarmers, error: farmersError } = await farmersQuery;

      if (farmersError) throw farmersError;

      // Get farmers who gave milk this session
      let entriesQuery = supabase
        .from('milk_entries')
        .select('farmer_id', { count: 'exact', head: true })
        .eq('entry_date', today)
        .eq('session', currentSession);

      if (centerId) {
        entriesQuery = entriesQuery.eq('center_id', centerId);
      }

      const { count: givenCount, error: entriesError } = await entriesQuery;

      if (entriesError) throw entriesError;

      return {
        totalFarmers: totalFarmers || 0,
        givenCount: givenCount || 0,
        pendingCount: (totalFarmers || 0) - (givenCount || 0),
        currentSession,
      };
    },
  });
}
