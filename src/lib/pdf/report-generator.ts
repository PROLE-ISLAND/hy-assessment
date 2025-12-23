// =====================================================
// PDF Report Generator
// Generates PDF reports from assessment analysis data
// Supports serverless environments (Vercel) via @sparticuz/chromium
// =====================================================

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from '@/lib/analysis';

// Remote chromium binary for Vercel serverless (must match @sparticuz/chromium-min version)
// Using x64 for Vercel's AWS Lambda environment
const CHROMIUM_REMOTE_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar';
import type { Domain } from '@/lib/analysis';

export interface ReportData {
  candidateName: string;
  candidateEmail: string;
  position: string;
  templateName: string;
  completedAt: string;
  analyzedAt: string;
  overallScore: number;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  recommendation: string | null;
}

function getRiskLevel(domain: Domain, score: number): 'low' | 'medium' | 'high' {
  if (domain === 'COG') {
    return score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  } else if (domain === 'VALID') {
    return score < 60 ? 'high' : score < 80 ? 'medium' : 'low';
  } else {
    return score < 50 ? 'high' : score < 70 ? 'medium' : 'low';
  }
}

const riskColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const riskLabels = {
  low: '良好',
  medium: '注意',
  high: '要注意',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateHTML(data: ReportData): string {
  const domains: Domain[] = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'];

  const domainScoresHTML = domains
    .map((domain) => {
      const score = data.scores[domain] || 0;
      const riskLevel = getRiskLevel(domain, score);
      return `
        <div class="domain-score">
          <div class="domain-header">
            <span class="domain-name">${DOMAIN_LABELS[domain]}</span>
            <span class="risk-badge" style="background-color: ${riskColors[riskLevel]}20; color: ${riskColors[riskLevel]}">
              ${riskLabels[riskLevel]}
            </span>
          </div>
          <div class="score-value">${score}%</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${score}%; background-color: ${riskColors[riskLevel]}"></div>
          </div>
          <div class="domain-description">${DOMAIN_DESCRIPTIONS[domain]}</div>
        </div>
      `;
    })
    .join('');

  const strengthsHTML = data.strengths
    .map((s) => `<li>${s}</li>`)
    .join('');

  const weaknessesHTML = data.weaknesses
    .map((w) => `<li>${w}</li>`)
    .join('');

  const overallScoreColor =
    data.overallScore >= 70 ? '#22c55e' :
    data.overallScore >= 50 ? '#f59e0b' :
    '#ef4444';

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>適性検査結果レポート</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 30px;
    }

    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }

    .logo span {
      color: #6b7280;
      font-weight: normal;
    }

    .report-title {
      font-size: 14px;
      color: #6b7280;
    }

    .report-date {
      font-size: 11px;
      color: #9ca3af;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }

    .info-item {
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
    }

    .info-label {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 13px;
      font-weight: 500;
      color: #1f2937;
    }

    .overall-score {
      text-align: center;
      padding: 30px;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 30px;
    }

    .overall-score-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 10px;
    }

    .overall-score-value {
      font-size: 48px;
      font-weight: bold;
    }

    .domain-scores {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .domain-score {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
    }

    .domain-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .domain-name {
      font-weight: 600;
      font-size: 13px;
    }

    .risk-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }

    .score-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .score-bar {
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .score-fill {
      height: 100%;
      border-radius: 3px;
    }

    .domain-description {
      font-size: 10px;
      color: #6b7280;
    }

    .two-columns {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .strength-weakness {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }

    .sw-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sw-title.strength {
      color: #22c55e;
    }

    .sw-title.weakness {
      color: #f59e0b;
    }

    .sw-list {
      list-style: none;
      padding: 0;
    }

    .sw-list li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 8px;
      font-size: 11px;
      line-height: 1.5;
    }

    .sw-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .strength .sw-list li::before {
      background: #22c55e;
    }

    .weakness .sw-list li::before {
      background: #f59e0b;
    }

    .summary-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.8;
    }

    .recommendation-box {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      font-size: 12px;
      line-height: 1.8;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }

    .confidential {
      color: #ef4444;
      font-weight: 500;
      margin-bottom: 5px;
    }

    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">HY <span>Assessment</span></div>
      <div class="report-title">適性検査結果レポート</div>
    </div>
    <div class="report-date">
      発行日: ${formatDate(new Date().toISOString())}
    </div>
  </div>

  <!-- Basic Info -->
  <div class="section">
    <div class="section-title">候補者情報</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">氏名</div>
        <div class="info-value">${data.candidateName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">メール</div>
        <div class="info-value">${data.candidateEmail}</div>
      </div>
      <div class="info-item">
        <div class="info-label">応募職種</div>
        <div class="info-value">${data.position}</div>
      </div>
      <div class="info-item">
        <div class="info-label">検査完了日</div>
        <div class="info-value">${formatDate(data.completedAt)}</div>
      </div>
    </div>
  </div>

  <!-- Overall Score -->
  <div class="overall-score">
    <div class="overall-score-label">総合スコア</div>
    <div class="overall-score-value" style="color: ${overallScoreColor}">
      ${data.overallScore}%
    </div>
  </div>

  <!-- Domain Scores -->
  <div class="section">
    <div class="section-title">ドメイン別スコア</div>
    <div class="domain-scores">
      ${domainScoresHTML}
    </div>
  </div>

  <!-- Strengths and Weaknesses -->
  <div class="section">
    <div class="section-title">分析結果</div>
    <div class="two-columns">
      <div class="strength-weakness strength">
        <div class="sw-title strength">
          <span>&#10004;</span> 強み
        </div>
        <ul class="sw-list">
          ${strengthsHTML}
        </ul>
      </div>
      <div class="strength-weakness weakness">
        <div class="sw-title weakness">
          <span>&#9888;</span> 注意点
        </div>
        <ul class="sw-list">
          ${weaknessesHTML}
        </ul>
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div class="section">
    <div class="section-title">総合評価</div>
    <div class="summary-box">
      ${data.summary || '総合評価が生成されていません。'}
    </div>
  </div>

  <!-- Recommendation -->
  <div class="section">
    <div class="section-title">採用推奨事項</div>
    <div class="recommendation-box">
      ${data.recommendation || '推奨事項が生成されていません。'}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="confidential">機密情報 - 社外秘</div>
    <div>本レポートは採用判断の参考資料です。最終判断は面接等を含めて総合的に行ってください。</div>
    <div>Generated by HY Assessment System</div>
  </div>
</body>
</html>
  `;
}

export async function generatePDF(data: ReportData): Promise<Buffer> {
  const html = generateHTML(data);

  // Configure chromium for serverless (Vercel) environment
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1200, height: 800 },
    executablePath: await chromium.executablePath(CHROMIUM_REMOTE_URL),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
