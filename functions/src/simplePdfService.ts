import puppeteer from 'puppeteer';
import { onRequest } from 'firebase-functions/v2/https';

/**
 * Simplified PDF Generation Service
 * 
 * Uses the existing PublicReportView page to generate PDFs.
 * This ensures perfect consistency between web and PDF views.
 * 
 * Benefits:
 * - Single source of truth for report rendering
 * - Perfect styling consistency
 * - Much simpler maintenance
 * - Smaller codebase
 */

/**
 * HTTPS onRequest Cloud Function for PDF generation
 */
export const generateReportPDF = onRequest({ region: 'europe-west1' }, async (req, res) => {
  try {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.'
      });
      return;
    }

    const { reportId, format, margin } = req.body;
    
    if (!reportId) {
      res.status(400).json({
        success: false,
        error: 'Report ID is required'
      });
      return;
    }

    // Construct the public report URL
    const baseUrl = process.env.APP_URL || 'https://agritectum-platform.web.app';
    const reportUrl = `${baseUrl}/report/public/${reportId}`;
    
    console.log(`🖨️ Generating PDF for report: ${reportId}`);
    console.log(`📄 URL: ${reportUrl}`);

    // Launch Puppeteer browser - use bundled Chromium
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--font-render-hinting=none',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
    });

    const page = await browser.newPage();
    
    // Set viewport to a standard desktop size to allow content to render properly
    await page.setViewport({
      width: 1440,  // Standard desktop width
      height: 2560, // Tall viewport for scrolling content
      deviceScaleFactor: 1
    });

    // Navigate to the public report page
    await page.goto(reportUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for the report content to load
    await page.waitForSelector('.bg-white', { timeout: 10000 });

    // Generate PDF with proper settings
    // A4 is 210mm x 297mm
    const pdfBuffer = await page.pdf({
      format: format || 'A4',
      printBackground: true,
      margin: margin || {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      },
      preferCSSPageSize: false,  // Ignore CSS page size rules for consistent A4 output
      displayHeaderFooter: false
    });

    await browser.close();

    console.log(`✅ PDF generated successfully for report: ${reportId}`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});
