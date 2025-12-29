// =====================================================
// Pipeline Funnel Component
// Shows candidate pipeline status with soft glassmorphism colors
// =====================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

interface PipelineStage {
  label: string;
  count: number;
  color: string;
}

interface PipelineFunnelProps {
  stages: PipelineStage[];
}

export function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-5 w-5" />
          採用パイプライン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className="font-medium">{stage.count}人</span>
              </div>
              {/* Custom progress bar with dynamic color */}
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  role="progressbar"
                  aria-valuenow={Math.round((stage.count / maxCount) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${stage.label}: ${stage.count}人`}
                  className={`h-full rounded-full transition-all ${stage.color}`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
