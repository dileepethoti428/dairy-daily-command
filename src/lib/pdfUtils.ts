import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface PDFHeader {
  appName: string;
  collectionCenter: string;
  reportType: string;
}

export interface DailyCollectionEntry {
  farmerName: string;
  farmerId: string;
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  amount: number;
}

export interface DailyCollectionData {
  date: string;
  centerName: string;
  totalMilk: number;
  totalFarmers: number;
  entries: DailyCollectionEntry[];
}

export interface FarmerStatementEntry {
  date: string;
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  amount: number;
}

export interface FarmerStatementData {
  farmerName: string;
  farmerId: string;
  village: string;
  startDate: string;
  endDate: string;
  entries: FarmerStatementEntry[];
  totalLitres: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
}

export interface SettlementFarmerSummary {
  farmerName: string;
  totalLitres: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
}

export interface SettlementSummaryData {
  centerName: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'locked' | 'paid';
  totalMilk: number;
  totalAmount: number;
  farmers: SettlementFarmerSummary[];
}

function addHeader(doc: jsPDF, header: PDFHeader) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // App name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(header.appName, pageWidth / 2, 15, { align: 'center' });
  
  // Collection center
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(header.collectionCenter, pageWidth / 2, 22, { align: 'center' });
  
  // Report type
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(header.reportType, pageWidth / 2, 32, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 36, pageWidth - 14, 36);
  
  return 40;
}

function addFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  
  const generatedDate = format(new Date(), 'dd MMM yyyy, HH:mm');
  doc.text(`Generated on: ${generatedDate}`, 14, pageHeight - 10);
  doc.text('This is a system-generated document', pageWidth - 14, pageHeight - 10, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
}

function formatCurrency(amount: number): string {
  // Using "Rs." instead of ₹ symbol as jsPDF doesn't support Unicode rupee symbol
  return `Rs.${amount.toFixed(2)}`;
}

// Daily Collection Report PDF
export function generateDailyCollectionPDF(data: DailyCollectionData): jsPDF {
  const doc = new jsPDF();
  
  // Don't show "All Centers" - show empty or use specific center name only
  const centerDisplay = data.centerName && data.centerName !== 'All Centers' 
    ? data.centerName 
    : '';
  
  const startY = addHeader(doc, {
    appName: 'Milk Procurement System',
    collectionCenter: centerDisplay,
    reportType: 'Daily Collection Report',
  });
  
  // Date and summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${format(new Date(data.date), 'dd MMMM yyyy')}`, 14, startY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Milk Collected: ${data.totalMilk.toFixed(2)} Litres`, 14, startY + 12);
  doc.text(`Total Farmers: ${data.totalFarmers}`, 14, startY + 19);
  
  // Entries table
  const tableData = data.entries.map((entry, index) => [
    (index + 1).toString(),
    entry.farmerName,
    entry.farmerId || '-',
    entry.quantity.toFixed(2),
    entry.fat.toFixed(1),
    entry.snf.toFixed(1),
    formatCurrency(entry.rate),
    formatCurrency(entry.amount),
  ]);
  
  // Calculate totals
  const totalQty = data.entries.reduce((sum, e) => sum + e.quantity, 0);
  const totalAmt = data.entries.reduce((sum, e) => sum + e.amount, 0);
  const avgFat = data.entries.length > 0 
    ? data.entries.reduce((sum, e) => sum + e.fat, 0) / data.entries.length 
    : 0;
  const avgSnf = data.entries.length > 0 
    ? data.entries.reduce((sum, e) => sum + e.snf, 0) / data.entries.length 
    : 0;
  
  autoTable(doc, {
    startY: startY + 28,
    head: [['#', 'Farmer Name', 'ID', 'Qty (L)', 'Fat %', 'SNF %', 'Rate', 'Amount']],
    body: tableData,
    foot: [['', 'TOTAL', '', totalQty.toFixed(2), avgFat.toFixed(1), avgSnf.toFixed(1), '', formatCurrency(totalAmt)]],
    theme: 'striped',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'right', cellWidth: 32 },
    },
    tableWidth: 'auto',
    margin: { left: 14, right: 14 },
  });
  
  addFooter(doc);
  
  return doc;
}

// Farmer-wise 15-Day Statement PDF
export function generateFarmerStatementPDF(data: FarmerStatementData): jsPDF {
  const doc = new jsPDF();
  
  const startY = addHeader(doc, {
    appName: 'Milk Procurement System',
    collectionCenter: 'Farmer Settlement Statement',
    reportType: '15-Day Statement',
  });
  
  // Farmer details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Details:', 14, startY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.farmerName}`, 14, startY + 12);
  doc.text(`ID: ${data.farmerId}`, 14, startY + 19);
  doc.text(`Village: ${data.village || 'N/A'}`, 14, startY + 26);
  
  // Period
  doc.setFont('helvetica', 'bold');
  doc.text(`Settlement Period: ${format(new Date(data.startDate), 'dd MMM')} - ${format(new Date(data.endDate), 'dd MMM yyyy')}`, 14, startY + 36);
  
  // Daily entries table
  const tableData = data.entries.map((entry, index) => [
    (index + 1).toString(),
    format(new Date(entry.date), 'dd/MM'),
    entry.quantity.toFixed(2),
    entry.fat.toFixed(1),
    entry.snf.toFixed(1),
    formatCurrency(entry.rate),
    formatCurrency(entry.amount),
  ]);
  
  autoTable(doc, {
    startY: startY + 44,
    head: [['#', 'Date', 'Qty (L)', 'Fat %', 'SNF %', 'Rate', 'Amount']],
    body: tableData,
    foot: [['', 'TOTAL', data.totalLitres.toFixed(2), '', '', '', formatCurrency(data.totalAmount)]],
    theme: 'striped',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: 255,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 35 },
    },
  });
  
  // Payment summary box
  const finalY = doc.lastAutoTable?.finalY || startY + 100;
  
  doc.setDrawColor(76, 175, 80);
  doc.setFillColor(240, 248, 240);
  doc.roundedRect(14, finalY + 10, 180, 35, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', 20, finalY + 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Litres: ${data.totalLitres.toFixed(2)} L`, 20, finalY + 28);
  doc.text(`Total Payable: ${formatCurrency(data.totalAmount)}`, 20, finalY + 36);
  
  // Payment status
  const statusColor = data.paymentStatus === 'paid' ? [76, 175, 80] : [255, 152, 0];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(140, finalY + 18, 45, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(data.paymentStatus.toUpperCase(), 162.5, finalY + 30, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  addFooter(doc);
  
  return doc;
}

// Settlement Summary PDF
export function generateSettlementSummaryPDF(data: SettlementSummaryData): jsPDF {
  const doc = new jsPDF();
  
  const startY = addHeader(doc, {
    appName: 'Milk Procurement System',
    collectionCenter: data.centerName || 'Collection Center',
    reportType: 'Settlement Summary Report',
  });
  
  // Period and status
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Period: ${format(new Date(data.startDate), 'dd MMM')} - ${format(new Date(data.endDate), 'dd MMM yyyy')}`, 14, startY + 5);
  
  const statusText = data.status.toUpperCase();
  const statusColor = data.status === 'paid' ? [76, 175, 80] : data.status === 'locked' ? [255, 152, 0] : [33, 150, 243];
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(140, startY, 40, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(statusText, 160, startY + 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Summary stats
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Milk Collected: ${data.totalMilk.toFixed(2)} Litres`, 14, startY + 16);
  doc.text(`Total Payable Amount: ${formatCurrency(data.totalAmount)}`, 14, startY + 23);
  doc.text(`Total Farmers: ${data.farmers.length}`, 14, startY + 30);
  
  // Farmer-wise breakdown table
  const tableData = data.farmers.map((farmer, index) => [
    (index + 1).toString(),
    farmer.farmerName,
    farmer.totalLitres.toFixed(2),
    formatCurrency(farmer.totalAmount),
    farmer.paymentStatus === 'paid' ? 'PAID' : 'PENDING',
  ]);
  
  autoTable(doc, {
    startY: startY + 40,
    head: [['#', 'Farmer Name', 'Total Litres', 'Total Amount', 'Status']],
    body: tableData,
    foot: [['', 'GRAND TOTAL', data.totalMilk.toFixed(2), formatCurrency(data.totalAmount), '']],
    theme: 'striped',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: 255,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 60 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === 'body') {
        const value = data.cell.raw as string;
        if (value === 'PAID') {
          data.cell.styles.textColor = [76, 175, 80];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [255, 152, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  
  addFooter(doc);
  
  return doc;
}

// Share PDF using Web Share API
export async function sharePDF(doc: jsPDF, filename: string): Promise<boolean> {
  try {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: filename.replace('.pdf', ''),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}

// Download PDF
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

// Preview PDF in new tab
export function previewPDF(doc: jsPDF) {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// Collection Report PDF (new)
export interface CollectionReportPDFData {
  centerName: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  totalLitres: number;
  totalAmount: number;
  totalFarmers: number;
  totalEntries: number;
  avgFat: number;
  avgSnf: number;
  avgRate: number;
  farmers: {
    farmerName: string;
    farmerId: string;
    totalLitres: number;
    totalAmount: number;
    entriesCount: number;
  }[];
}

export function generateCollectionReportPDF(data: CollectionReportPDFData): jsPDF {
  const doc = new jsPDF();

  // Don't show "All Centers" - show empty or use specific center name only
  const centerDisplay = data.centerName && data.centerName !== 'All Centers' && data.centerName !== 'Collection Center'
    ? data.centerName
    : '';

  const startY = addHeader(doc, {
    appName: 'Milk Procurement System',
    collectionCenter: centerDisplay,
    reportType: `Collection Report (${data.periodLabel})`,
  });

  // Period
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Period: ${format(new Date(data.startDate), 'dd MMM yyyy')} - ${format(new Date(data.endDate), 'dd MMM yyyy')}`,
    14,
    startY + 5
  );

  // Summary stats
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Milk Collected: ${data.totalLitres.toFixed(2)} Litres`, 14, startY + 14);
  doc.text(`Total Amount: ${formatCurrency(data.totalAmount)}`, 14, startY + 21);
  doc.text(`Total Farmers: ${data.totalFarmers}`, 14, startY + 28);
  doc.text(`Total Entries: ${data.totalEntries}`, 110, startY + 14);
  doc.text(`Avg Fat: ${data.avgFat}%`, 110, startY + 21);
  doc.text(`Avg SNF: ${data.avgSnf}%`, 110, startY + 28);

  // Farmer breakdown table
  const tableData = data.farmers.map((farmer, index) => [
    (index + 1).toString(),
    farmer.farmerName,
    farmer.farmerId || '-',
    farmer.entriesCount.toString(),
    farmer.totalLitres.toFixed(2),
    formatCurrency(farmer.totalAmount),
  ]);

  autoTable(doc, {
    startY: startY + 38,
    head: [['#', 'Farmer Name', 'ID', 'Entries', 'Total (L)', 'Amount']],
    body: tableData,
    foot: [
      [
        '',
        'GRAND TOTAL',
        '',
        data.totalEntries.toString(),
        data.totalLitres.toFixed(2),
        formatCurrency(data.totalAmount),
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 45 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 35 },
    },
    tableWidth: 'auto',
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);

  return doc;
}
