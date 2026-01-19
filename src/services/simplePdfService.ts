import { Report } from '../types';
import { logger } from '../utils/logger';

/**
 * Simplified PDF Service
 * 
 * Replaces the complex enhancedPdfService.ts with a simple approach
 * that uses the existing PublicReportView page for PDF generation.
 * 
 * Benefits:
 * - Perfect consistency between web and PDF views
 * - Much simpler maintenance
 * - Smaller bundle size
 * - Single source of truth for report rendering
 */

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

/**
 * Generate PDF for a report using the Cloud Function
 */
export const generateReportPDF = async (
  reportId: string,
  options: PDFGenerationOptions = {}
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    logger.log(`🖨️ Generating PDF for report: ${reportId}`);

    // Call the Cloud Function directly
    const functionUrl = 'https://generatereportpdf-yitis2ljlq-ew.a.run.app';
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId,
        format: options.format || 'A4',
        margin: options.margin || {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();
    
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
  reportId: string,
  options: PDFGenerationOptions = {}
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateReportPDF(reportId, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Create download link
    const url = URL.createObjectURL(result.blob!);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${reportId}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);

    return { success: true };

  } catch (error) {
    console.error('❌ PDF download failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Open PDF in new tab
 */
export const openReportPDF = async (
  reportId: string,
  options: PDFGenerationOptions = {}
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateReportPDF(reportId, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Open PDF in new tab
    const url = URL.createObjectURL(result.blob!);
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    return { success: true };

  } catch (error) {
    console.error('❌ PDF open failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * @deprecated Legacy compatibility function
 * @legacy
 * Maintains the same interface as the old enhancedPdfService
 * 
 * This function is deprecated and kept for backward compatibility only.
 * Migration: Use generateReportPDF(reportId, options) instead
 * 
 * @see generateReportPDF
 */
export const generateEnhancedReportPDF = async (
  report: Report,
  options: any = {}
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  console.warn('⚠️ generateEnhancedReportPDF is deprecated. Use generateReportPDF instead.');
  
  return generateReportPDF(report.id, {
    format: options.format || 'A4',
    margin: options.margin
  });
};

/**
 * Export format types for compatibility
 */
export type ExportFormat = 'detailed' | 'summary' | 'executive' | 'compliance' | 'insurance';

/**
 * Legacy export options interface for compatibility
 */
export interface EnhancedExportOptions {
  format: ExportFormat;
  includeImages?: boolean;
  includeCosts?: boolean;
  includeRecommendations?: boolean;
  includeComplianceInfo?: boolean;
  includeInsuranceInfo?: boolean;
  companyLogo?: string;
  branchLogo?: string;
  branchName?: string;
  branchCVR?: string;
  branchAddress?: string;
  branchPhone?: string;
  branchEmail?: string;
  inspectorName?: string;
  inspectorLicense?: string;
  reportLanguage?: 'da' | 'en' | 'sv' | 'no';
  includeQRCode?: boolean;
  includeDigitalSignature?: boolean;
  includeWatermark?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  includeTableOfContents?: boolean;
  includeAppendices?: boolean;
}
