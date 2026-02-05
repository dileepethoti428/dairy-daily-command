 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { subDays, subMonths, format } from 'date-fns';
 
 export type ReportPeriod = '1week' | '15days' | '1month' | '6months' | 'all';
 
 export interface FarmerReportSummary {
   farmer_id: string;
   farmer_name: string;
   farmer_code: string | null;
   village: string | null;
   total_litres: number;
   total_amount: number;
   entries_count: number;
   avg_fat: number;
   avg_snf: number;
 }
 
 export interface CollectionReportData {
   period: ReportPeriod;
   startDate: string;
   endDate: string;
   totalLitres: number;
   totalAmount: number;
   totalFarmers: number;
   totalEntries: number;
   avgFat: number;
   avgSnf: number;
   avgRate: number;
   farmers: FarmerReportSummary[];
 }
 
 export function getPeriodDates(period: ReportPeriod): { startDate: string; endDate: string } {
   const today = new Date();
   const endDate = format(today, 'yyyy-MM-dd');
   let startDate: string;
 
   switch (period) {
     case '1week':
       startDate = format(subDays(today, 7), 'yyyy-MM-dd');
       break;
     case '15days':
       startDate = format(subDays(today, 15), 'yyyy-MM-dd');
       break;
     case '1month':
       startDate = format(subMonths(today, 1), 'yyyy-MM-dd');
       break;
     case '6months':
       startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
       break;
     case 'all':
     default:
       startDate = '2000-01-01'; // Far past date for "all time"
       break;
   }
 
   return { startDate, endDate };
 }
 
 export function useCollectionReport(period: ReportPeriod, centerId?: string) {
   const { startDate, endDate } = getPeriodDates(period);
 
   return useQuery({
     queryKey: ['collection-report', period, centerId, startDate, endDate],
     queryFn: async () => {
       let query = supabase
         .from('milk_entries')
         .select(`
           id,
           farmer_id,
           quantity_liters,
           fat_percentage,
           snf_percentage,
           rate_per_litre,
           total_amount,
           farmers:farmer_id (
             id,
             full_name,
             farmer_code,
             village
           )
         `)
         .gte('entry_date', startDate)
         .lte('entry_date', endDate);
 
       if (centerId) {
         query = query.eq('center_id', centerId);
       }
 
       const { data: entries, error } = await query;
 
       if (error) throw error;
 
       if (!entries || entries.length === 0) {
         return {
           period,
           startDate,
           endDate,
           totalLitres: 0,
           totalAmount: 0,
           totalFarmers: 0,
           totalEntries: 0,
           avgFat: 0,
           avgSnf: 0,
           avgRate: 0,
           farmers: [],
         } as CollectionReportData;
       }
 
       // Aggregate by farmer
       const farmerMap = new Map<string, FarmerReportSummary>();
 
       let totalFat = 0;
       let totalSnf = 0;
       let totalRate = 0;
       let rateCount = 0;
 
       for (const entry of entries) {
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
             avg_fat: 0,
             avg_snf: 0,
           });
         }
 
         const existing = farmerMap.get(farmerId)!;
         existing.total_litres += entry.quantity_liters || 0;
         existing.total_amount += entry.total_amount || 0;
         existing.entries_count += 1;
         existing.avg_fat += entry.fat_percentage || 0;
         existing.avg_snf += entry.snf_percentage || 0;
 
         totalFat += entry.fat_percentage || 0;
         totalSnf += entry.snf_percentage || 0;
         if (entry.rate_per_litre) {
           totalRate += entry.rate_per_litre;
           rateCount++;
         }
       }
 
       // Calculate averages for each farmer
       const farmers = Array.from(farmerMap.values()).map((f) => ({
         ...f,
         avg_fat: f.entries_count > 0 ? Math.round((f.avg_fat / f.entries_count) * 10) / 10 : 0,
         avg_snf: f.entries_count > 0 ? Math.round((f.avg_snf / f.entries_count) * 10) / 10 : 0,
       })).sort((a, b) => a.farmer_name.localeCompare(b.farmer_name));
 
       const totalLitres = entries.reduce((sum, e) => sum + (e.quantity_liters || 0), 0);
       const totalAmount = entries.reduce((sum, e) => sum + (e.total_amount || 0), 0);
 
       return {
         period,
         startDate,
         endDate,
         totalLitres: Math.round(totalLitres * 100) / 100,
         totalAmount: Math.round(totalAmount * 100) / 100,
         totalFarmers: farmerMap.size,
         totalEntries: entries.length,
         avgFat: entries.length > 0 ? Math.round((totalFat / entries.length) * 10) / 10 : 0,
         avgSnf: entries.length > 0 ? Math.round((totalSnf / entries.length) * 10) / 10 : 0,
         avgRate: rateCount > 0 ? Math.round((totalRate / rateCount) * 100) / 100 : 0,
         farmers,
       } as CollectionReportData;
     },
   });
 }