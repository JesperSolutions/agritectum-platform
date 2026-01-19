import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Report } from '../types';
import { logger } from '../utils/logger';

/**
 * Client-side PDF Generation Service
 * 
 * Renders the actual PublicReportView HTML as a PDF using html2canvas + jsPDF.
 * Ensures the PDF matches exactly what users see on screen - a true 1:1 visual match.
 */

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  branchInfo?: {
    name: string;
    logoUrl?: string;
  };
}

/**
 * Render HTML element to PDF using html2canvas
 * This captures the exact rendered HTML as a canvas and converts it to PDF
 */
const renderElementToPDF = async (
  element: HTMLElement
): Promise<Blob> => {
  // Capture the visible element dimensions
  const elementWidth = element.offsetWidth || element.scrollWidth;
  const elementHeight = element.scrollHeight;

  logger.log('Element dimensions:', { elementWidth, elementHeight });

  // Capture the element with a fixed high-quality scale
  const canvas = await html2canvas(element, {
    scale: 2, // Use 2x for crisp rendering
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: elementWidth,
    height: elementHeight,
  });

  logger.log('Canvas dimensions:', { width: canvas.width, height: canvas.height });

  // Create PDF with A4 dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  // Convert pixels to mm assuming 96 DPI (html2canvas uses this)
  const pxPerMm = 96 / 25.4;
  const imgWidthMm = canvas.width / pxPerMm;
  const imgHeightMm = canvas.height / pxPerMm;

  // Scale so width fills page minus margin
  const maxWidth = pageWidth - 2 * margin;
  const scale = maxWidth / imgWidthMm;
  const displayWidth = imgWidthMm * scale;
  const displayHeight = imgHeightMm * scale;

  // Top align content (you can center if you prefer)
  const posX = margin;
  const posY = margin;

  // If longer than one page, split automatically
  let remainingHeight = displayHeight;
  let currentY = posY;

  const imgData = canvas.toDataURL('image/png', 0.95);

  while (remainingHeight > 0) {
    pdf.addImage(
      imgData,
      'PNG',
      posX,
      currentY - (displayHeight - remainingHeight),
      displayWidth,
      displayHeight
    );

    remainingHeight -= (pageHeight - 2 * margin);
    if (remainingHeight > 0) pdf.addPage();
  }

  return pdf.output('blob');
};

/**
 * Find and render the report content element to PDF
 */
export const generateReportPDF = async (
  report: Report,
  _options: PDFGenerationOptions = {}
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    logger.log(`🖨️ Generating PDF for report: ${report.id}`);

    // Find the report root element which includes header and content
    const reportRoot = document.getElementById('report-root');
    
    if (!reportRoot) {
      throw new Error('Could not find report-root element to render');
    }

    const pdfBlob = await renderElementToPDF(reportRoot);
    logger.log(`✅ PDF generated successfully: ${pdfBlob.size} bytes`);

    return {
      success: true,
      blob: pdfBlob
    };

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Download PDF for a report
 */
export const downloadReportPDF = async (
  report: Report,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const result = await generateReportPDF(report, options);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate PDF');
  }

  const pdfBlob = result.blob!;

  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  
  // Safe date formatting for filename
  const safeDate = (() => {
    try {
      const date = new Date(report.inspectionDate);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  })();

  link.download = `taklaget-report-${report.id}-${safeDate}.pdf`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};


