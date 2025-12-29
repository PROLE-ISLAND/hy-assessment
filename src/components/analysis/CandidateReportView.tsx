'use client';

// =====================================================
// Candidate Report View Component
// Displays disclosure-ready report for candidates
// =====================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Heart, AlertCircle } from 'lucide-react';
import { stateColors } from '@/lib/design-system';
import type { CandidateReport } from '@/types/database';

interface CandidateReportViewProps {
  report: CandidateReport;
}

export function CandidateReportView({ report }: CandidateReportViewProps) {
  return (
    <div className="space-y-6">
      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className={`h-5 w-5 ${stateColors.info.light.text} ${stateColors.info.dark.text}`} />
            あなたの強み
          </CardTitle>
          <CardDescription>
            検査結果から見える、あなたの特徴的な行動傾向
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.strengths.map((strength, index) => (
              <div key={index} className={`border rounded-lg p-4 ${stateColors.info.light.bg}/50 ${stateColors.info.dark.bg}`}>
                <div className={`font-semibold mb-1 ${stateColors.info.light.text} ${stateColors.info.dark.text}`}>
                  {strength.title}
                </div>
                <p className="text-sm text-muted-foreground">
                  {strength.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leverage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className={`h-5 w-5 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
            活かし方のヒント
          </CardTitle>
          <CardDescription>
            あなたの特性を仕事で活かすためのアドバイス
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.leverage_tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${stateColors.warning.light.bg} ${stateColors.warning.dark.bg} ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`}>
                  {index + 1}
                </div>
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Stress Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className={`h-5 w-5 ${stateColors.error.light.text} ${stateColors.error.dark.text}`} />
            負荷が高い時の工夫
          </CardTitle>
          <CardDescription>
            プレッシャーがかかる場面でのセルフケア
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.stress_tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Values Tags */}
      <Card>
        <CardHeader>
          <CardTitle>大切にしやすい価値観</CardTitle>
          <CardDescription>
            あなたが重視しやすい傾向にある要素
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.values_tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className={`${stateColors.warning.light.border} ${stateColors.warning.dark.border} ${stateColors.warning.light.bg}/50 ${stateColors.warning.dark.bg}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
            <p className={`text-sm ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`}>
              {report.note}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
