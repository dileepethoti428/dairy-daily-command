 import { useState } from 'react';
 import { format } from 'date-fns';
import jsPDF from 'jspdf';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Badge } from '@/components/ui/badge';
 import { EmptyState } from '@/components/ui/empty-state';
 import { ErrorDisplay, getReadableErrorMessage } from '@/components/ui/error-display';
 import { PDFActionSheet } from '@/components/pdf/PDFActionSheet';
 import {
   useCollectionReport,
   ReportPeriod,
   CollectionReportData,
 } from '@/hooks/useCollectionReports';
 import { useCenter } from '@/contexts/CenterContext';
 import {
   FileText,
   Calendar,
   Users,
   Droplets,
   TrendingUp,
   ChevronDown,
   ChevronUp,
   Download,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { generateCollectionReportPDF } from '@/lib/pdfUtils';
 
 const periodOptions: { value: ReportPeriod; label: string }[] = [
   { value: '1week', label: '1 Week' },
   { value: '15days', label: '15 Days' },
   { value: '1month', label: '1 Month' },
   { value: '6months', label: '6 Months' },
   { value: 'all', label: 'All Time' },
 ];
 
 export function CollectionReportView() {
   const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('15days');
   const [showFarmers, setShowFarmers] = useState(false);
   const [pdfOpen, setPdfOpen] = useState(false);
   const { selectedCenter } = useCenter();
 
   const { data: report, isLoading, error, refetch } = useCollectionReport(
     selectedPeriod,
     selectedCenter?.id
   );
 
   const handleGeneratePDF = () => {
    if (!report) return null as unknown as jsPDF;
     return generateCollectionReportPDF({
       centerName: selectedCenter?.name || 'Collection Center',
       startDate: report.startDate,
       endDate: report.endDate,
       periodLabel: periodOptions.find((p) => p.value === selectedPeriod)?.label || '',
       totalLitres: report.totalLitres,
       totalAmount: report.totalAmount,
       totalFarmers: report.totalFarmers,
       totalEntries: report.totalEntries,
       avgFat: report.avgFat,
       avgSnf: report.avgSnf,
       avgRate: report.avgRate,
       farmers: report.farmers.map((f) => ({
         farmerName: f.farmer_name,
         farmerId: f.farmer_code || '',
         totalLitres: f.total_litres,
         totalAmount: f.total_amount,
         entriesCount: f.entries_count,
       })),
     });
   };
 
   return (
     <div className="space-y-4">
       {/* Period Selector */}
       <Card className="shadow-dairy">
         <CardHeader className="pb-2">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Calendar className="h-5 w-5 text-primary" />
             Select Period
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex flex-wrap gap-2">
             {periodOptions.map((option) => (
               <Button
                 key={option.value}
                 variant={selectedPeriod === option.value ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setSelectedPeriod(option.value)}
               >
                 {option.label}
               </Button>
             ))}
           </div>
         </CardContent>
       </Card>
 
       {/* Report Content */}
       {isLoading ? (
         <div className="space-y-4">
           <Skeleton className="h-32 rounded-lg" />
           <Skeleton className="h-48 rounded-lg" />
         </div>
       ) : error ? (
         <ErrorDisplay
           message={getReadableErrorMessage(error)}
           onRetry={() => refetch()}
         />
       ) : !report || report.totalEntries === 0 ? (
         <EmptyState
           icon={FileText}
           title="No data for this period"
           description="There are no milk entries recorded for the selected time range."
           variant="muted"
         />
       ) : (
         <>
           {/* Summary Card */}
           <Card className="shadow-dairy">
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2 text-lg">
                   <TrendingUp className="h-5 w-5 text-primary" />
                   Collection Summary
                 </CardTitle>
                 <Badge variant="outline" className="text-xs">
                   {format(new Date(report.startDate), 'dd MMM')} -{' '}
                   {format(new Date(report.endDate), 'dd MMM yyyy')}
                 </Badge>
               </div>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-lg bg-primary/10 p-3 text-center">
                   <Droplets className="mx-auto h-6 w-6 text-primary" />
                   <p className="mt-1 text-2xl font-bold text-primary">
                     {report.totalLitres.toLocaleString()}
                   </p>
                   <p className="text-xs text-muted-foreground">Total Litres</p>
                 </div>
                 <div className="rounded-lg bg-success/10 p-3 text-center">
                   <TrendingUp className="mx-auto h-6 w-6 text-success" />
                   <p className="mt-1 text-2xl font-bold text-success">
                     ₹{report.totalAmount.toLocaleString()}
                   </p>
                   <p className="text-xs text-muted-foreground">Total Amount</p>
                 </div>
                 <div className="rounded-lg bg-secondary p-3 text-center">
                   <Users className="mx-auto h-6 w-6 text-foreground" />
                   <p className="mt-1 text-xl font-bold">{report.totalFarmers}</p>
                   <p className="text-xs text-muted-foreground">Farmers</p>
                 </div>
                 <div className="rounded-lg bg-secondary p-3 text-center">
                   <FileText className="mx-auto h-6 w-6 text-foreground" />
                   <p className="mt-1 text-xl font-bold">{report.totalEntries}</p>
                   <p className="text-xs text-muted-foreground">Entries</p>
                 </div>
               </div>
 
               {/* Quality Averages */}
               <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                 <div className="rounded-lg border p-2">
                   <p className="text-sm font-medium">{report.avgFat}%</p>
                   <p className="text-xs text-muted-foreground">Avg Fat</p>
                 </div>
                 <div className="rounded-lg border p-2">
                   <p className="text-sm font-medium">{report.avgSnf}%</p>
                   <p className="text-xs text-muted-foreground">Avg SNF</p>
                 </div>
                 <div className="rounded-lg border p-2">
                   <p className="text-sm font-medium">₹{report.avgRate}</p>
                   <p className="text-xs text-muted-foreground">Avg Rate</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           {/* Farmer Breakdown */}
           <Card className="shadow-dairy">
             <CardHeader className="pb-2">
               <button
                 className="flex w-full items-center justify-between"
                 onClick={() => setShowFarmers(!showFarmers)}
               >
                 <CardTitle className="flex items-center gap-2 text-lg">
                   <Users className="h-5 w-5 text-primary" />
                   Farmer Breakdown
                 </CardTitle>
                 {showFarmers ? (
                   <ChevronUp className="h-5 w-5 text-muted-foreground" />
                 ) : (
                   <ChevronDown className="h-5 w-5 text-muted-foreground" />
                 )}
               </button>
             </CardHeader>
             {showFarmers && (
               <CardContent className="space-y-2">
                 {report.farmers.map((farmer) => (
                   <div
                     key={farmer.farmer_id}
                     className="flex items-center justify-between rounded-lg bg-secondary p-3"
                   >
                     <div>
                       <p className="font-medium">{farmer.farmer_name}</p>
                       <p className="text-xs text-muted-foreground">
                         {farmer.farmer_code} • {farmer.village || 'N/A'} •{' '}
                         {farmer.entries_count} entries
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="font-medium">
                         {farmer.total_litres.toFixed(1)} L
                       </p>
                       <p className="text-sm text-success">
                         ₹{farmer.total_amount.toFixed(0)}
                       </p>
                     </div>
                   </div>
                 ))}
               </CardContent>
             )}
           </Card>
 
           {/* PDF Action */}
           <Button
             className="w-full"
             size="lg"
             onClick={() => setPdfOpen(true)}
           >
             <Download className="mr-2 h-4 w-4" />
             Download / Share Report
           </Button>
 
           <PDFActionSheet
             open={pdfOpen}
             onOpenChange={setPdfOpen}
            title="Collection Report"
            description="Download or share the collection report as PDF"
             generatePDF={handleGeneratePDF}
             filename={`Collection-Report-${selectedPeriod}-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
           />
         </>
       )}
     </div>
   );
 }