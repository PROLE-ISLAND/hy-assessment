// =====================================================
// Highlight Candidates Section
// Shows top performers and candidates needing attention
// =====================================================

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle, ExternalLink, Users } from 'lucide-react';
import { stateColors } from '@/lib/design-system';

interface HighPerformer {
  candidateId: string;
  name: string;
  overallScore: number;
  position: string;
}

interface NeedsAttention {
  candidateId: string;
  name: string;
  reason: string;
  detail: string;
}

interface HighlightCandidatesProps {
  highPerformers: HighPerformer[];
  needsAttention: NeedsAttention[];
}

export function HighlightCandidates({
  highPerformers,
  needsAttention,
}: HighlightCandidatesProps) {
  const hasData = highPerformers.length > 0 || needsAttention.length > 0;

  // Empty state - Generated with v0: https://v0.app/chat/tCC628ipuVu
  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-5 w-5 text-yellow-500" />
            注目候補者
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            注目の候補者はまだいません
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            検査が完了すると、高評価の候補者や要確認の候補者がここに表示されます。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-5 w-5 text-yellow-500" />
          注目候補者
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High Performers */}
        {highPerformers.length > 0 && (
          <div>
            <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${stateColors.success.light.text}`}>
              <Star className="h-4 w-4" />
              高評価 ({highPerformers.length}人)
            </div>
            <div className="space-y-2">
              {highPerformers.slice(0, 5).map((candidate) => (
                <Link
                  key={candidate.candidateId}
                  href={`/admin/candidates/${candidate.candidateId}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{candidate.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {candidate.position}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${stateColors.success.light.text}`}>
                      {candidate.overallScore}%
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div>
            <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${stateColors.warning.light.text}`}>
              <AlertTriangle className="h-4 w-4" />
              要確認 ({needsAttention.length}人)
            </div>
            <div className="space-y-2">
              {needsAttention.slice(0, 5).map((candidate) => (
                <Link
                  key={candidate.candidateId}
                  href={`/admin/candidates/${candidate.candidateId}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{candidate.name}</span>
                    <Badge variant="outline" className={`text-xs ${stateColors.warning.light.text} ${stateColors.warning.light.border}`}>
                      {candidate.reason}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {candidate.detail}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
