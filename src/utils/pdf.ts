/**
 * PDF Generation Utility
 * Converts HTML to PDF using Puppeteer with Chromium
 */
import { logger } from './logger';
import { InternalServerError } from './errors';

type Browser = any;
type Page = any;

let browser: Browser | null = null;

/**
 * Get the correct Chrome/Chromium executable path
 */
async function getChromiumPath(): Promise<string | undefined> {
  // Check for explicit environment variable first
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    logger.info(`Using PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
    // Try to use @sparticuz/chromium first (works in production and dev)
    const chromium = await import('@sparticuz/chromium');
    // executablePath is an async function, not a property
    if (typeof chromium.executablePath === 'function') {
      const path = await chromium.executablePath();
      if (path) {
        logger.info('Using @sparticuz/chromium');
        return path;
      }
    }
  } catch (error) {
    logger.warn('Sparticuz chromium not available:', error instanceof Error ? error.message : String(error));
  }

  // Fallback: try common system Chrome/Chromium paths
  const commonPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const path of commonPaths) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(path)) {
        logger.info(`Found Chrome at: ${path}`);
        return path;
      }
    } catch {
      // Continue to next path
    }
  }

  return undefined;
}

/**
 * Initialize browser instance (singleton pattern)
 */
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    try {
      // Use puppeteer-core (no bundled browser)
      const puppeteer = await import('puppeteer-core');
      
      const executablePath = await getChromiumPath();
      
      if (!executablePath) {
        throw new Error(
          'No Chrome/Chromium executable found. ' +
          'For development: sudo apt install chromium-browser (Linux) or brew install chromium (macOS)\n' +
          'Or set PUPPETEER_EXECUTABLE_PATH environment variable.'
        );
      }
      
      const launchConfig: any = {
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      };
      
      browser = await puppeteer.default.launch(launchConfig);
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
