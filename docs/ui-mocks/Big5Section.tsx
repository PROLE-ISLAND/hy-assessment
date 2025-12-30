"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Printer, Lightbulb, BarChart3 } from "lucide-react";

// Types
interface Big5Factor {
  id: string;
  name: string;
  nameEn: string;
  score: number;
  level: "低" | "中" | "高";
  description: string;
  color: string;
}

interface Big5Data {
  factors: Big5Factor[];
  insight: string;
  jobProfileScores?: number[];
}

// Mock data
const mockBig5Data: Big5Data = {
  factors: [
    {
      id: "openness",
      name: "開放性",
      nameEn: "Openness",
      score: 78,
      level: "高",
      description: "新しい経験や知識への好奇心が高く、創造的なアプローチを好みます",
      color: "bg-blue-500",
    },
    {
      id: "conscientiousness",
      name: "誠実性",
      nameEn: "Conscientiousness",
      score: 92,
      level: "高",
      description: "計画的で責任感が強く、目標達成に向けて着実に行動します",
      color: "bg-green-500",
    },
    {
      id: "extraversion",
      name: "外向性",
      nameEn: "Extraversion",
      score: 65,
      level: "中",
      description: "社交的でエネルギッシュですが、一人の時間も大切にします",
      color: "bg-yellow-500",
    },
    {
      id: "agreeableness",
      name: "協調性",
      nameEn: "Agreeableness",
      score: 80,
      level: "高",
      description: "チームワークを重視し、他者への配慮ができます",
      color: "bg-purple-500",
    },
    {
      id: "neuroticism",
      name: "情緒安定性",
      nameEn: "Emotional Stability",
      score: 58,
      level: "中",
      description: "ストレス耐性は平均的で、適切なサポートがあれば安定します",
      color: "bg-orange-500",
    },
  ],
  insight: `この候補者は高い誠実性（92%）と開放性（78%）を持ち、新しいプロジェクトや挑戦的な業務に高い適性があります。

チームでの協力も得意ですが（協調性80%）、情緒安定性が58%と平均的なため、高ストレス環境では適切なサポートが必要になる可能性があります。

**推奨される配属先**: 企画・開発部門、プロジェクトチーム
**注意点**: 明確な目標設定と定期的なフィードバックが効果的`,
  jobProfileScores: [75, 85, 70, 75, 65], // 比較用の職種プロファイル
};

// Level badge color mapping
const levelColors = {
  低: "bg-red-100 text-red-800",
  中: "bg-yellow-100 text-yellow-800",
  高: "bg-green-100 text-green-800",
};

// Big5 Score Card Component
function Big5ScoreCard({ factor }: { factor: Big5Factor }) {
  return (
    <Card
      className="transition-all hover:shadow-md"
      data-testid={`big5-score-${factor.id}`}
    >
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{factor.name}</span>
            <Badge className={levelColors[factor.level]}>{factor.level}</Badge>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {factor.score}%
          </span>
        </div>
        <Progress value={factor.score} className="h-2 mb-3" />
        <p className="text-sm text-muted-foreground">{factor.description}</p>
      </CardContent>
    </Card>
  );
}

// Big5 Radar Chart Component
function Big5RadarChartComponent({
  factors,
  showComparison,
  jobProfileScores,
}: {
  factors: Big5Factor[];
  showComparison: boolean;
  jobProfileScores?: number[];
}) {
  const chartData = factors.map((factor, index) => ({
    factor: factor.name,
    candidate: factor.score,
    profile: jobProfileScores?.[index] || 0,
  }));

  return (
    <div className="w-full h-[350px]" data-testid="big5-radar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name="候補者スコア"
            dataKey="candidate"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.5}
          />
          {showComparison && jobProfileScores && (
            <Radar
              name="職種プロファイル"
              dataKey="profile"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
            />
          )}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// AI Insight Component
function Big5Insight({ insight }: { insight: string }) {
  return (
    <Card className="bg-blue-50 border-blue-200" data-testid="big5-insight">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          AI分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {insight.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm text-gray-700 mb-2 last:mb-0">
              {paragraph.split("**").map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-blue-800">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Big5 Section Component
export function Big5Section({ data = mockBig5Data }: { data?: Big5Data }) {
  const [showComparison, setShowComparison] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="space-y-6" data-testid="big5-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Big5 性格特性分析
          </h2>
          <p className="text-muted-foreground">
            5因子モデルによる性格特性評価
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2" data-testid="big5-comparison-toggle">
            <Switch
              id="comparison-mode"
              checked={showComparison}
              onCheckedChange={setShowComparison}
            />
            <Label htmlFor="comparison-mode" className="text-sm">
              職種プロファイルと比較
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">スコア分布</CardTitle>
            <CardDescription>
              5因子の相対的なバランスを視覚化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Big5RadarChartComponent
              factors={data.factors}
              showComparison={showComparison}
              jobProfileScores={data.jobProfileScores}
            />
          </CardContent>
        </Card>

        {/* Score Cards */}
        <div className="space-y-4">
          {data.factors.map((factor) => (
            <Big5ScoreCard key={factor.id} factor={factor} />
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <Big5Insight insight={data.insight} />

      {/* Legend */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={levelColors["高"]}>高</Badge>
              <span>75%以上</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={levelColors["中"]}>中</Badge>
              <span>40-74%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={levelColors["低"]}>低</Badge>
              <span>40%未満</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default Big5Section;
