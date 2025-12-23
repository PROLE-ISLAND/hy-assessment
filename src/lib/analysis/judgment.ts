// =====================================================
// Candidate Judgment Logic
// Calculates recommendation level based on scores
// Uses design system for consistent styling
// =====================================================

import { DOMAIN_LABELS } from './index';
import { judgmentConfig, type JudgmentLevel } from '@/lib/design-system';

// Re-export for convenience
export type { JudgmentLevel };

export interface JudgmentResult {
  level: JudgmentLevel;
  label: string;
  /** @deprecated Use className instead */
  color: string;
  /** @deprecated Use className instead */
  bgColor: string;
  /** Combined className for styling */
  className: string;
  reasons: string[];
}

export interface DomainScores {
  GOV: number;
  CONFLICT: number;
  REL: number;
  COG: number;
  WORK: number;
  VALID: number;
}

// Calculate overall score from domain scores
export function calculateOverallScore(scores: Partial<DomainScores>): number {
  const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'] as const;
  const total = scorableDomains.reduce((sum, d) => sum + (scores[d] || 0), 0);
  return Math.round(total / scorableDomains.length);
}

// Calculate judgment level based on scores
export function calculateJudgment(scores: Partial<DomainScores>): JudgmentResult {
  const overall = calculateOverallScore(scores);
  const cog = scores.COG || 0;
  const valid = scores.VALID || 0;
  const reasons: string[] = [];

  // Recommended: Overall >= 75%, COG <= 40%, VALID >= 70%
  if (overall >= 75 && cog <= 40 && valid >= 70) {
    reasons.push(`総合スコア${overall}%と高水準`);

    // Add specific strengths
    const strongDomains = Object.entries(scores)
      .filter(([domain, score]) =>
        domain !== 'VALID' && domain !== 'COG' && score && score >= 80
      )
      .map(([domain]) => DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]);

    if (strongDomains.length > 0) {
      reasons.push(`${strongDomains.join('、')}が特に優れている`);
    }

    const config = judgmentConfig.recommended;
    return {
      level: 'recommended',
      label: config.label,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      className: config.className,
      reasons,
    };
  }

  // Consider: Overall >= 50%, COG <= 60%, VALID >= 60%
  if (overall >= 50 && cog <= 60 && valid >= 60) {
    reasons.push(`総合スコア${overall}%`);

    // Note areas for improvement
    const weakDomains = Object.entries(scores)
      .filter(([domain, score]) =>
        domain !== 'VALID' && domain !== 'COG' && score && score < 60
      )
      .map(([domain]) => DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]);

    if (weakDomains.length > 0) {
      reasons.push(`${weakDomains.join('、')}の確認を推奨`);
    }

    if (cog > 40 && cog <= 60) {
      reasons.push('認知スタイルに軽微な注意点あり');
    }

    const config = judgmentConfig.consider;
    return {
      level: 'consider',
      label: config.label,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      className: config.className,
      reasons,
    };
  }

  // Caution: Below thresholds
  if (overall < 50) {
    reasons.push(`総合スコア${overall}%と基準未達`);
  }

  if (cog > 60) {
    reasons.push('認知スタイルに注意（被害者意識傾向）');
  }

  if (valid < 60) {
    reasons.push('回答の妥当性に疑問');
  }

  // Add weak domains
  const veryWeakDomains = Object.entries(scores)
    .filter(([domain, score]) =>
      domain !== 'VALID' && domain !== 'COG' && score && score < 50
    )
    .map(([domain]) => DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]);

  if (veryWeakDomains.length > 0) {
    reasons.push(`${veryWeakDomains.join('、')}が低スコア`);
  }

  const config = judgmentConfig.caution;
  return {
    level: 'caution',
    label: config.label,
    color: 'text-rose-700',
    bgColor: 'bg-rose-100',
    className: config.className,
    reasons,
  };
}

// Interview point templates
const STRENGTH_TEMPLATES: Record<string, string> = {
  GOV: 'ガバナンス意識が高く、ルール遵守の姿勢が強い',
  CONFLICT: '対立場面での適切な対処能力がある',
  REL: '他者への敬意とフィードバック受容性が高い',
  WORK: '業務遂行能力が高く、計画的に仕事を進められる',
};

const CONFIRM_TEMPLATES: Record<string, string> = {
  GOV: 'ガバナンス意識について確認を推奨',
  CONFLICT: '対立場面での対応経験を確認',
  REL: 'フィードバック受容性を確認',
  WORK: '業務計画性・遂行能力を確認',
};

const QUESTION_TEMPLATES: Record<string, string> = {
  GOV: '会社のルールと自分の考えが合わない時、どう対処しますか？',
  CONFLICT: 'チームで意見が対立した時、どのように解決しますか？',
  REL: '厳しいフィードバックを受けた経験と、その時の対応を教えてください',
  WORK: '複数のタスクを同時に抱えた時の優先順位の付け方を教えてください',
  COG: '過去に理不尽だと感じた出来事と、その時どう対処したか教えてください',
};

export interface InterviewPoint {
  type: 'strength' | 'confirm';
  domain: string;
  domainLabel: string;
  point: string;
  suggestedQuestion?: string;
}

// Generate interview points based on scores
export function generateInterviewPoints(scores: Partial<DomainScores>): InterviewPoint[] {
  const points: InterviewPoint[] = [];

  // Strengths (80% or above)
  Object.entries(scores).forEach(([domain, score]) => {
    if (domain !== 'VALID' && domain !== 'COG' && score && score >= 80) {
      const template = STRENGTH_TEMPLATES[domain];
      if (template) {
        points.push({
          type: 'strength',
          domain,
          domainLabel: DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS],
          point: template,
        });
      }
    }
  });

  // Confirm points (60% or below)
  Object.entries(scores).forEach(([domain, score]) => {
    if (domain !== 'VALID' && domain !== 'COG' && score && score <= 60) {
      const template = CONFIRM_TEMPLATES[domain];
      const question = QUESTION_TEMPLATES[domain];
      if (template) {
        points.push({
          type: 'confirm',
          domain,
          domainLabel: DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS],
          point: template,
          suggestedQuestion: question,
        });
      }
    }
  });

  // Special handling for COG (higher is worse)
  const cog = scores.COG || 0;
  if (cog > 50) {
    points.push({
      type: 'confirm',
      domain: 'COG',
      domainLabel: DOMAIN_LABELS.COG,
      point: '被害者意識や感情的反応の傾向が見られます',
      suggestedQuestion: QUESTION_TEMPLATES.COG,
    });
  }

  return points;
}

// Judgment level badge component props
export function getJudgmentBadgeProps(level: JudgmentLevel) {
  const config = judgmentConfig[level];
  return {
    variant: 'default' as const,
    className: `${config.badgeClass} hover:${config.badgeClass.split(' ')[0]}`,
    Icon: config.icon,
    iconClass: config.iconClass,
    label: config.label,
  };
}
