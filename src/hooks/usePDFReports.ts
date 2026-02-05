import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  generateDailyCollectionPDF,
  generateFarmerStatementPDF,
  generateSettlementSummaryPDF,
  type DailyCollectionData,
  type FarmerStatementData,
  type SettlementSummaryData,
} from '@/lib/pdfUtils';
import type jsPDF from 'jspdf';

// Generate Daily Collection Report PDF
export async function generateDailyReport(date: string, centerId?: string): Promise<jsPDF> {
  // Fetch entries for the date
  let query = supabase
    .from('milk_entries')
    .select(`
      *,
      farmers:farmer_id (
        id,
        full_name,
        farmer_code,
        village
      )
    `)
    .eq('entry_date', date)
    .order('created_at', { ascending: true });

  if (centerId) {
    query = query.eq('center_id', centerId);
  }

  const { data: entries, error } = await query;

  if (error) throw error;

  // Fetch center name if provided, otherwise try to get from user assignment
  let centerName = '';
  if (centerId) {
    const { data: center } = await supabase
      .from('collection_centers')
      .select('name')
      .eq('id', centerId)
      .single();
    centerName = center?.name || '';
  }

  const data: DailyCollectionData = {
    date,
    centerName,
    totalMilk: entries?.reduce((sum, e) => sum + (e.quantity_liters || 0), 0) || 0,
    totalFarmers: new Set(entries?.map(e => e.farmer_id)).size,
    entries: (entries || []).map(entry => ({
      farmerName: (entry.farmers as any)?.full_name || 'Unknown',
      farmerId: (entry.farmers as any)?.farmer_code || '',
      quantity: entry.quantity_liters || 0,
      fat: entry.fat_percentage || 0,
      snf: entry.snf_percentage || 0,
      rate: entry.rate_per_litre || 0,
      amount: entry.total_amount || 0,
    })),
  };

  return generateDailyCollectionPDF(data);
}

// Generate Farmer-wise Settlement Statement PDF
export async function generateFarmerStatementReport(
  farmerId: string,
  settlementId: string
): Promise<jsPDF> {
  // Fetch farmer details
  const { data: farmer, error: farmerErr } = await supabase
    .from('farmers')
    .select('full_name, farmer_code, village')
    .eq('id', farmerId)
    .single();

  if (farmerErr) throw farmerErr;

  // Fetch settlement details
  const { data: settlement, error: settleErr } = await supabase
    .from('settlements')
    .select('start_date, end_date, status')
    .eq('id', settlementId)
    .single();

  if (settleErr) throw settleErr;

  // Fetch milk entries for this farmer in this settlement
  const { data: entries, error: entriesErr } = await supabase
    .from('milk_entries')
    .select('*')
    .eq('farmer_id', farmerId)
    .eq('settlement_id', settlementId)
    .order('entry_date', { ascending: true });

  if (entriesErr) throw entriesErr;

  const totalLitres = entries?.reduce((sum, e) => sum + (e.quantity_liters || 0), 0) || 0;
  const totalAmount = entries?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0;

  const data: FarmerStatementData = {
    farmerName: farmer?.full_name || 'Unknown',
    farmerId: farmer?.farmer_code || '',
    village: farmer?.village || '',
    startDate: settlement?.start_date || '',
    endDate: settlement?.end_date || '',
    entries: (entries || []).map(entry => ({
      date: entry.entry_date,
      quantity: entry.quantity_liters || 0,
      fat: entry.fat_percentage || 0,
      snf: entry.snf_percentage || 0,
      rate: entry.rate_per_litre || 0,
      amount: entry.total_amount || 0,
    })),
    totalLitres,
    totalAmount,
    paymentStatus: settlement?.status === 'paid' ? 'paid' : 'pending',
  };

  return generateFarmerStatementPDF(data);
}

// Generate Settlement Summary Report PDF
export async function generateSettlementReport(settlementId: string): Promise<jsPDF> {
  // Fetch settlement with center
  const { data: settlement, error: settleErr } = await supabase
    .from('settlements')
    .select(`
      *,
      collection_centers:center_id (
        name
      )
    `)
    .eq('id', settlementId)
    .single();

  if (settleErr) throw settleErr;

  // Fetch farmer-wise breakdown
  const { data: entries, error: entriesErr } = await supabase
    .from('milk_entries')
    .select(`
      farmer_id,
      quantity_liters,
      total_amount,
      farmers:farmer_id (
        full_name
      )
    `)
    .eq('settlement_id', settlementId);

  if (entriesErr) throw entriesErr;

  // Aggregate by farmer
  const farmerMap = new Map<string, { name: string; litres: number; amount: number }>();
  
  for (const entry of entries || []) {
    const farmerId = entry.farmer_id;
    const farmerName = (entry.farmers as any)?.full_name || 'Unknown';
    
    if (!farmerMap.has(farmerId)) {
      farmerMap.set(farmerId, { name: farmerName, litres: 0, amount: 0 });
    }
    
    const existing = farmerMap.get(farmerId)!;
    existing.litres += entry.quantity_liters || 0;
    existing.amount += entry.total_amount || 0;
  }

  const data: SettlementSummaryData = {
    centerName: (settlement.collection_centers as any)?.name || 'Collection Center',
    startDate: settlement.start_date,
    endDate: settlement.end_date,
    status: settlement.status as 'open' | 'locked' | 'paid',
    totalMilk: settlement.total_litres || 0,
    totalAmount: settlement.total_amount || 0,
    farmers: Array.from(farmerMap.entries())
      .map(([_, data]) => ({
        farmerName: data.name,
        totalLitres: data.litres,
        totalAmount: data.amount,
        paymentStatus: settlement.status === 'paid' ? 'paid' as const : 'pending' as const,
      }))
      .sort((a, b) => a.farmerName.localeCompare(b.farmerName)),
  };

  return generateSettlementSummaryPDF(data);
}
