import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Download, Eye, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { downloadPDF, previewPDF, sharePDF } from '@/lib/pdfUtils';

interface PDFActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  generatePDF: () => jsPDF | Promise<jsPDF>;
  filename: string;
}

export function PDFActionSheet({
  open,
  onOpenChange,
  title,
  description,
  generatePDF,
  filename,
}: PDFActionSheetProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [action, setAction] = useState<'preview' | 'download' | 'share' | null>(null);

  const handleAction = async (actionType: 'preview' | 'download' | 'share') => {
    setAction(actionType);
    setIsGenerating(true);

    try {
      const doc = await generatePDF();

      switch (actionType) {
        case 'preview':
          previewPDF(doc);
          break;
        case 'download':
          downloadPDF(doc, filename);
          toast.success('PDF downloaded successfully');
          break;
        case 'share':
          const shared = await sharePDF(doc, filename);
          if (!shared) {
            // Fall back to download if sharing not supported
            downloadPDF(doc, filename);
            toast.info('Sharing not supported, PDF downloaded instead');
          }
          break;
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
      setAction(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3"
            onClick={() => handleAction('preview')}
            disabled={isGenerating}
          >
            {action === 'preview' && isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Eye className="h-5 w-5 text-primary" />
            )}
            <div className="text-left">
              <p className="font-medium">Preview PDF</p>
              <p className="text-xs text-muted-foreground">Open in new tab</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3"
            onClick={() => handleAction('download')}
            disabled={isGenerating}
          >
            {action === 'download' && isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
            <div className="text-left">
              <p className="font-medium">Download PDF</p>
              <p className="text-xs text-muted-foreground">Save to device</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3"
            onClick={() => handleAction('share')}
            disabled={isGenerating}
          >
            {action === 'share' && isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Share2 className="h-5 w-5 text-primary" />
            )}
            <div className="text-left">
              <p className="font-medium">Share PDF</p>
              <p className="text-xs text-muted-foreground">Via apps on your device</p>
            </div>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
