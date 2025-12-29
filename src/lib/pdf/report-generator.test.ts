// =====================================================
// PDF Report Generator Unit Tests
// Tests for memory management and resource cleanup
// =====================================================

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock puppeteer-core and chromium before imports
vi.mock('puppeteer-core', () => ({
  default: {
    launch: vi.fn(),
  },
}));

vi.mock('@sparticuz/chromium-min', () => ({
  default: {
    args: ['--no-sandbox'],
    executablePath: vi.fn().mockResolvedValue('/fake/chromium'),
  },
}));

// Now import after mocks are set up
import puppeteer from 'puppeteer-core';
import { generatePDF, type ReportData } from './report-generator';

describe('generatePDF', () => {
  const testData: ReportData = {
    candidateName: 'Test User',
    candidateEmail: 'test@example.com',
    position: 'Engineer',
    templateName: 'GFD-Gate',
    completedAt: '2024-01-01T00:00:00Z',
    analyzedAt: '2024-01-01T01:00:00Z',
    overallScore: 75,
    scores: {
      GOV: 80,
      CONFLICT: 70,
      REL: 75,
      COG: 30,
      WORK: 80,
      VALID: 90,
    },
    strengths: ['Strong leadership', 'Good communication'],
    weaknesses: ['Time management'],
    summary: 'Test summary',
    recommendation: 'Test recommendation',
  };

  // Create fresh mocks for each test
  function createMocks() {
    const mockPage = {
      setDefaultTimeout: vi.fn(),
      setDefaultNavigationTimeout: vi.fn(),
      setContent: vi.fn().mockResolvedValue(undefined),
      evaluateHandle: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    return { mockPage, mockBrowser };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes page and browser after successful PDF generation', async () => {
    const { mockPage, mockBrowser } = createMocks();
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);

    await generatePDF(testData);

    // Verify page was created and content was set
    expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
    expect(mockPage.setContent).toHaveBeenCalledTimes(1);
    expect(mockPage.pdf).toHaveBeenCalledTimes(1);

    // Verify cleanup: page.close() then browser.close()
    expect(mockPage.close).toHaveBeenCalledTimes(1);
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });

  it('closes page and browser even when PDF generation fails', async () => {
    const { mockPage, mockBrowser } = createMocks();
    mockPage.pdf.mockRejectedValue(new Error('PDF generation failed'));
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);

    await expect(generatePDF(testData)).rejects.toThrow('PDF generation failed');

    // Verify cleanup still happens
    expect(mockPage.close).toHaveBeenCalledTimes(1);
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });

  it('closes browser when page creation fails', async () => {
    const { mockPage, mockBrowser } = createMocks();
    mockBrowser.newPage.mockRejectedValue(new Error('Failed to create page'));
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);

    await expect(generatePDF(testData)).rejects.toThrow('Failed to create page');

    // Page never created, so page.close() not called
    expect(mockPage.close).not.toHaveBeenCalled();
    // But browser should still be closed
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });

  it('handles page.close() error gracefully', async () => {
    const { mockPage, mockBrowser } = createMocks();
    mockPage.close.mockRejectedValue(new Error('Close failed'));
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Should not throw even if page.close() fails
    const result = await generatePDF(testData);
    expect(result).toBeDefined();

    // Error should be logged
    expect(consoleSpy).toHaveBeenCalledWith('[PDF] Failed to close page:', 'Close failed');
    // Browser should still be closed
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('handles browser.close() error gracefully', async () => {
    const { mockPage, mockBrowser } = createMocks();
    mockBrowser.close.mockRejectedValue(new Error('Browser close failed'));
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Should not throw even if browser.close() fails
    const result = await generatePDF(testData);
    expect(result).toBeDefined();

    // Error should be logged
    expect(consoleSpy).toHaveBeenCalledWith('[PDF] Failed to close browser:', 'Browser close failed');

    consoleSpy.mockRestore();
  });

  it('returns a valid Buffer', async () => {
    const { mockBrowser } = createMocks();
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);

    const result = await generatePDF(testData);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('sets correct PDF options', async () => {
    const { mockPage, mockBrowser } = createMocks();
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);

    await generatePDF(testData);

    expect(mockPage.pdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });
  });

  it('waits for fonts to load before generating PDF', async () => {
    const { mockPage, mockBrowser } = createMocks();
    (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);

    await generatePDF(testData);

    // Verify font loading was awaited
    expect(mockPage.evaluateHandle).toHaveBeenCalledWith('document.fonts.ready');
  });
});
