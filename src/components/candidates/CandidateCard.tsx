'use client';

// =====================================================
// Candidate Card Component
// Rich card with score, judgment, and quick actions
// Uses design system for consistent styling
// =====================================================

import Link from 'next/link';
import { Briefcase, Clock, CheckCircle, AlertCircle, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  candidateStatusConfig,
  judgmentConfig,
  getScoreTextClass,
  getSelectionClasses,
  stateColors,
  type CandidateStatus,
  type JudgmentLevel,
} from '@/lib/design-system';

// Re-export CandidateStatus type for consumers
export type { CandidateStatus };

export interface CandidateCardData {
  id: string;
  name: string;
  email: string;
  position: string;
  positionLabel: string;
  status: CandidateStatus;
  overallScore?: number;
  judgment?: JudgmentLevel;
  expiresAt?: string;
  completedAt?: string;
  createdAt: string;
  assessmentId?: string;
}

interface CandidateCardProps {
  candidate: CandidateCardData;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  showCheckbox?: boolean;
}

// Status icon mapping
const statusIcons = {
  no_assessment: Circle,
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  analyzed: CheckCircle,
} as const;

function getRemainingDays(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function CandidateCard({ candidate, isSelected = false, onSelect, showCheckbox = false }: CandidateCardProps) {
  const statusInfo = candidateStatusConfig[candidate.status];
  const StatusIcon = statusIcons[candidate.status];
  const judgmentInfo = candidate.judgment ? judgmentConfig[candidate.judgment] : null;
  const JudgmentIcon = judgmentInfo?.icon;

  const remainingDays = candidate.expiresAt && (candidate.status === 'pending' || candidate.status === 'in_progress')
    ? getRemainingDays(candidate.expiresAt)
    : null;

  return (
    <Card className={`transition-all hover:shadow-sm ${getSelectionClasses(isSelected)}`}>
      <CardContent className="px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* Checkbox */}
          {showCheckbox && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(candidate.id, checked === true)}
              className="h-4 w-4"
            />
          )}

          {/* Name */}
          <Link
            href={`/admin/candidates/${candidate.id}`}
            className="font-medium hover:text-blue-600 truncate min-w-[120px] max-w-[180px]"
          >
            {candidate.name}
          </Link>

          {/* Position */}
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Briefcase className="h-3 w-3" />
            {candidate.positionLabel}
          </span>

          {/* Score (if analyzed) */}
          {candidate.status === 'analyzed' && candidate.overallScore !== undefined && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Progress value={candidate.overallScore} className="h-1 w-12" />
              <span className={`text-xs font-medium ${getScoreTextClass(candidate.overallScore)}`}>
                {candidate.overallScore}%
              </span>
            </div>
          )}

          {/* Judgment Badge */}
          {judgmentInfo && JudgmentIcon && (
            <Badge className={`${judgmentInfo.badgeClass} shrink-0 text-[11px] h-5 px-1.5`}>
              <JudgmentIcon className={`h-2.5 w-2.5 mr-0.5 ${judgmentInfo.iconClass}`} />
              {judgmentInfo.label}
            </Badge>
          )}

          {/* Status */}
          <Badge variant="outline" className={`${statusInfo.className} border-0 shrink-0 text-[11px] h-5 px-1.5`}>
            <StatusIcon className={`h-2.5 w-2.5 mr-0.5 ${statusInfo.iconClassName}`} />
            {statusInfo.label}
          </Badge>

          {remainingDays !== null && remainingDays <= 3 && (
            <span className={`text-[11px] shrink-0 ${remainingDays <= 1 ? stateColors.error.light.text : stateColors.warning.light.text}`}>
              残り{remainingDays}日
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs" asChild>
              <Link href={`/admin/candidates/${candidate.id}`}>
                詳細
              </Link>
            </Button>
            {candidate.status === 'analyzed' && candidate.assessmentId && (
              <Button variant="default" size="sm" className="h-6 px-2 text-xs" asChild>
                <Link href={`/admin/assessments/${candidate.assessmentId}?from=candidate`}>
                  分析
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
