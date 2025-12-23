// =====================================================
// Scoring Engine for GFD-Gate v1
// Calculates 6-domain scores from assessment responses
// =====================================================

import { ITEM_METADATA, SJT_METADATA } from '@/lib/templates/gfd-gate-v1';
import type {
  Domain,
  DomainScore,
  ScoringResult,
  ValidityFlags,
  SJTScores,
  ResponseData,
} from './types';
import { DOMAIN_LABELS } from './types';

// =====================================================
// Score Calculation
// =====================================================

/**
 * Calculate all scores from assessment responses
 */
export function calculateScores(responses: ResponseData[]): ScoringResult {
  // Convert responses to map for quick lookup
  const responseMap = new Map<string, unknown>();
  for (const r of responses) {
    responseMap.set(r.question_id, r.answer);
  }

  // Calculate domain scores
  const domainScores = calculateDomainScores(responseMap);

  // Calculate SJT scores
  const sjtScores = calculateSJTScores(responseMap);

  // Check validity
  const validityFlags = checkValidity(responseMap, domainScores);

  // Calculate overall score (weighted average of domains, excluding VALID)
  const scorableDomains: Domain[] = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
  const totalPercentage = scorableDomains.reduce(
    (sum, d) => sum + domainScores[d].percentage,
    0
  );
  const overallScore = Math.round(totalPercentage / scorableDomains.length);

  return {
    domainScores,
    overallScore,
    validityFlags,
    sjtScores,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate scores for each domain
 */
function calculateDomainScores(
  responseMap: Map<string, unknown>
): Record<Domain, DomainScore> {
  const domains: Domain[] = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'];
  const result = {} as Record<Domain, DomainScore>;

  for (const domain of domains) {
    const items = ITEM_METADATA.filter((item) => item.domain === domain);
    let rawScore = 0;
    let answeredCount = 0;

    for (const item of items) {
      const answer = responseMap.get(item.id);
      if (typeof answer === 'number' && answer >= 1 && answer <= 5) {
        // Apply reverse scoring if needed
        const score = item.reverseKeyed ? 6 - answer : answer;
        rawScore += score;
        answeredCount++;
      }
    }

    const maxScore = items.length * 5; // Max score is 5 per item
    const percentage =
      answeredCount > 0
        ? Math.round((rawScore / (answeredCount * 5)) * 100)
        : 0;

    // Determine risk level based on percentage
    let riskLevel: 'low' | 'medium' | 'high';
    if (domain === 'COG') {
      // COG is reversed - higher score means more problematic
      riskLevel = percentage >= 70 ? 'high' : percentage >= 40 ? 'medium' : 'low';
    } else if (domain === 'VALID') {
      // VALID - lower is problematic
      riskLevel = percentage < 60 ? 'high' : percentage < 80 ? 'medium' : 'low';
    } else {
      // Other domains - lower is problematic
      riskLevel = percentage < 50 ? 'high' : percentage < 70 ? 'medium' : 'low';
    }

    result[domain] = {
      domain,
      label: DOMAIN_LABELS[domain],
      rawScore,
      maxScore,
      percentage,
      itemCount: items.length,
      riskLevel,
    };
  }

  return result;
}

/**
 * Calculate SJT scores
 */
function calculateSJTScores(responseMap: Map<string, unknown>): SJTScores {
  const itemScores: Record<string, number> = {};
  let totalScore = 0;
  let answeredCount = 0;

  for (const sjt of SJT_METADATA) {
    const answer = responseMap.get(sjt.id);
    if (typeof answer === 'string') {
      const scoring = sjt.scoring as Record<string, number>;
      if (scoring[answer] !== undefined) {
        const score = scoring[answer];
        itemScores[sjt.id] = score;
        totalScore += score;
        answeredCount++;
      }
    }
  }

  const maxScore = SJT_METADATA.length * 4; // Max score is 4 per item

  return {
    totalScore,
    maxScore,
    percentage: answeredCount > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    itemScores,
  };
}

/**
 * Check validity of responses
 */
function checkValidity(
  responseMap: Map<string, unknown>,
  domainScores: Record<Domain, DomainScore>
): ValidityFlags {
  const details: string[] = [];
  let isValid = true;

  // 1. Check Instructed Response Items (IMC)
  // L43: should be 4 (やや同意)
  // L46: should be 2 (やや反対)
  const imcL43 = responseMap.get('L43');
  const imcL46 = responseMap.get('L46');

  if (imcL43 !== 4) {
    details.push('注意チェック項目L43の回答が不正確');
    isValid = false;
  }
  if (imcL46 !== 2) {
    details.push('注意チェック項目L46の回答が不正確');
    isValid = false;
  }

  // 2. Check Social Desirability (L42, L44, L45)
  // If all are 5 (strongly agree), suspicious
  const sdItems = ['L42', 'L44', 'L45'];
  const sdScores = sdItems
    .map((id) => responseMap.get(id))
    .filter((v) => typeof v === 'number') as number[];
  const socialDesirabilityFlag =
    sdScores.length === 3 && sdScores.every((s) => s === 5);

  if (socialDesirabilityFlag) {
    details.push('社会的望ましさ検出項目が全て最高値');
    isValid = false;
  }

  // 3. Check for extreme response patterns
  const likertResponses: number[] = [];
  for (const [key, value] of responseMap.entries()) {
    if (key.startsWith('L') && typeof value === 'number') {
      likertResponses.push(value);
    }
  }

  const all1s = likertResponses.length > 0 && likertResponses.every((r) => r === 1);
  const all5s = likertResponses.length > 0 && likertResponses.every((r) => r === 5);
  const extremeResponseFlag = all1s || all5s;

  if (extremeResponseFlag) {
    details.push('極端な回答パターン（全て同じ値）');
    isValid = false;
  }

  // 4. Check for inconsistency (reverse-keyed pairs should be negatively correlated)
  // Simple check: if both reverse and non-reverse items in same construct are both high
  const inconsistencyFlag = checkInconsistency(responseMap);
  if (inconsistencyFlag) {
    details.push('逆転項目との矛盾回答');
    // Note: inconsistency is a warning, not necessarily invalid
  }

  return {
    isValid,
    socialDesirabilityFlag,
    inconsistencyFlag,
    extremeResponseFlag,
    details,
  };
}

/**
 * Check for inconsistency between reverse-keyed and non-reverse-keyed items
 */
function checkInconsistency(responseMap: Map<string, unknown>): boolean {
  // Group items by construct
  const constructGroups = new Map<string, { normal: number[]; reversed: number[] }>();

  for (const item of ITEM_METADATA) {
    const answer = responseMap.get(item.id);
    if (typeof answer !== 'number') continue;

    if (!constructGroups.has(item.construct)) {
      constructGroups.set(item.construct, { normal: [], reversed: [] });
    }

    const group = constructGroups.get(item.construct)!;
    if (item.reverseKeyed) {
      group.reversed.push(answer);
    } else {
      group.normal.push(answer);
    }
  }

  // Check each construct for inconsistency
  for (const [construct, group] of constructGroups.entries()) {
    if (group.normal.length === 0 || group.reversed.length === 0) continue;

    const normalAvg = group.normal.reduce((a, b) => a + b, 0) / group.normal.length;
    const reversedAvg = group.reversed.reduce((a, b) => a + b, 0) / group.reversed.length;

    // If both are high (>4) or both are low (<2), inconsistent
    if ((normalAvg > 4 && reversedAvg > 4) || (normalAvg < 2 && reversedAvg < 2)) {
      return true;
    }
  }

  return false;
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get risk summary based on domain scores
 */
export function getRiskSummary(
  domainScores: Record<Domain, DomainScore>
): {
  highRiskDomains: Domain[];
  mediumRiskDomains: Domain[];
  lowRiskDomains: Domain[];
} {
  const highRiskDomains: Domain[] = [];
  const mediumRiskDomains: Domain[] = [];
  const lowRiskDomains: Domain[] = [];

  for (const [domain, score] of Object.entries(domainScores)) {
    switch (score.riskLevel) {
      case 'high':
        highRiskDomains.push(domain as Domain);
        break;
      case 'medium':
        mediumRiskDomains.push(domain as Domain);
        break;
      case 'low':
        lowRiskDomains.push(domain as Domain);
        break;
    }
  }

  return { highRiskDomains, mediumRiskDomains, lowRiskDomains };
}

/**
 * Generate score percentile description
 */
export function getScoreDescription(percentage: number): string {
  if (percentage >= 80) return '非常に高い';
  if (percentage >= 70) return '高い';
  if (percentage >= 50) return '平均的';
  if (percentage >= 30) return '低め';
  return '要注意';
}
