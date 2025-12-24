'use client';

// =====================================================
// Candidate Report View Component
// Displays disclosure-ready report for candidates
// =====================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Sparkles, Heart, AlertCircle } from 'lucide-react';
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
            <Sparkles className="h-5 w-5 text-blue-600" />
            あなたの強み
          </CardTitle>
          <CardDescription>
            検査結果から見える、あなたの特徴的な行動傾向
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.strengths.map((strength, index) => (
              <div key={index} className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
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
            <Lightbulb className="h-5 w-5 text-yellow-600" />
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
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-700 dark:text-yellow-400 text-sm font-medium">
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
            <Heart className="h-5 w-5 text-rose-600" />
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
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {report.note}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
