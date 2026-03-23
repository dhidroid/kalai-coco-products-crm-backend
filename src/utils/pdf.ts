/**
 * PDF Generation Utility
 * Converts HTML to PDF using Puppeteer
 */
import { logger } from './logger';
import { InternalServerError } from './errors';

type Browser = any;
type Page = any;

let browser: Browser | null = null;

/**
 * Initialize browser instance (singleton pattern)
 */
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    try {
      // Dynamic import for ESM compatibility
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      logger.info('Puppeteer browser initialized');
    } catch (error) {
      logger.error('Failed to launch browser: ', error);
      throw new InternalServerError('Failed to initialize PDF generator');
    }
  }
  return browser;
}

/**
 * Convert HTML to PDF buffer
 */
export async function htmlToPdf(htmlContent: string, options?: any): Promise<Buffer> {
  let page: Page | null = null;
  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();

    // Set viewport for better rendering
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2,
    });

    // Load HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF with options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      displayHeaderFooter: false,
      ...options,
    });

    logger.info('PDF generated successfully');
    return Buffer.from(pdfBuffer);
  } catch (error) {
    logger.error(`PDF generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new InternalServerError('Failed to generate PDF');
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Close browser gracefully
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
      browser = null;
      logger.info('Puppeteer browser closed');
    } catch (error) {
      logger.error(`Error closing browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Check if browser is running
 */
export function isBrowserRunning(): boolean {
  return browser !== null;
}
