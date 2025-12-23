'use client';

// =====================================================
// Candidate Comparison Client Component - Glassmorphism Style
// Interactive comparison with selection and charts
// Uses design system for consistent glassmorphism styling
// =====================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, ExternalLink } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { DOMAIN_LABELS } from '@/lib/analysis';
import {
  chartColors,
  chartConfig,
  chartTheme,
  judgmentConfig,
  selectionColors,
  type JudgmentLevel,
} from '@/lib/design-system';
import type { CandidateForComparison } from './page';

interface Position {
  value: string;
  label: string;
}

interface CandidateComparisonClientProps {
  candidates: CandidateForComparison[];
  positions: Position[];
}

const RADAR_DOMAINS = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'] as const;

function getJudgmentIcon(level: string) {
  const config = judgmentConfig[level as JudgmentLevel];
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className={`h-4 w-4 ${config.iconClass}`} />;
}

function getJudgmentBadgeClass(level: string) {
  const config = judgmentConfig[level as JudgmentLevel];
  return config?.badgeClass || '';
}

export function CandidateComparisonClient({
  candidates,
  positions,
}: CandidateComparisonClientProps) {
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter candidates by position
  const filteredCandidates = useMemo(() => {
    if (selectedPosition === 'all') {
      return candidates;
    }
    return candidates.filter(c => c.position === selectedPosition);
  }, [candidates, selectedPosition]);

  // Get selected candidates
  const selectedCandidates = useMemo(() => {
    return filteredCandidates.filter(c => selectedIds.has(c.id));
  }, [filteredCandidates, selectedIds]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    return RADAR_DOMAINS.map(domain => {
      const dataPoint: Record<string, string | number> = {
        domain: DOMAIN_LABELS[domain],
      };
      selectedCandidates.forEach(c => {
        dataPoint[c.name] = c.scores[domain] || 0;
      });
      return dataPoint;
    });
  }, [selectedCandidates]);

  const handleSelectCandidate = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      if (newSet.size < 5) {
        newSet.add(id);
      }
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.slice(0, 5).map(c => c.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">候補者比較</h1>
        <p className="text-muted-foreground">
          複数の候補者を並べて比較できます（最大5人）
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">職種:</span>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {positions.map(pos => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedIds.size}人選択中
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedIds.size === filteredCandidates.length ? '選択解除' : '上位5人を選択'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            候補者一覧
          </CardTitle>
          <CardDescription>
            比較したい候補者を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCandidates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              該当する候補者がいません
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedIds.has(candidate.id)
                      ? `${selectionColors.selected.border} ${selectionColors.selected.bg} ${selectionColors.selected.bgDark}`
                      : selectionColors.hover.bg
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.has(candidate.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCandidate(candidate.id, checked as boolean)
                      }
                      disabled={!selectedIds.has(candidate.id) && selectedIds.size >= 5}
                    />
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {candidate.positionLabel}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{candidate.overallScore}%</span>
                    <Badge className={getJudgmentBadgeClass(candidate.judgment.level)}>
                      {getJudgmentIcon(candidate.judgment.level)}
                      <span className="ml-1">{candidate.judgment.label}</span>
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/candidates/${candidate.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedCandidates.length >= 2 && (
        <>
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>スコア比較表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">候補者</TableHead>
                      <TableHead className="text-center">GOV</TableHead>
                      <TableHead className="text-center">CONFLICT</TableHead>
                      <TableHead className="text-center">REL</TableHead>
                      <TableHead className="text-center">COG</TableHead>
                      <TableHead className="text-center">WORK</TableHead>
                      <TableHead className="text-center">VALID</TableHead>
                      <TableHead className="text-center font-bold">総合</TableHead>
                      <TableHead className="text-center">判定</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCandidates.map((candidate, idx) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: chartColors[idx]?.stroke }}
                            />
                            <span className="font-medium">{candidate.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{candidate.scores.GOV || 0}%</TableCell>
                        <TableCell className="text-center">{candidate.scores.CONFLICT || 0}%</TableCell>
                        <TableCell className="text-center">{candidate.scores.REL || 0}%</TableCell>
                        <TableCell className="text-center">{candidate.scores.COG || 0}%</TableCell>
                        <TableCell className="text-center">{candidate.scores.WORK || 0}%</TableCell>
                        <TableCell className="text-center">{candidate.scores.VALID || 0}%</TableCell>
                        <TableCell className="text-center font-bold">{candidate.overallScore}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getJudgmentBadgeClass(candidate.judgment.level)}>
                            {candidate.judgment.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart - Glassmorphism Style */}
          <Card>
            <CardHeader>
              <CardTitle>レーダーチャート比較</CardTitle>
              <CardDescription>
                5つのドメインスコアを視覚的に比較
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    {/* Glassmorphism gradient definitions for each candidate */}
                    <defs>
                      {selectedCandidates.map((candidate, idx) => (
                        <linearGradient
                          key={`compareGradient-${idx}`}
                          id={`compareGradient-${idx}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={chartColors[idx]?.fill} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={chartColors[idx]?.fill} stopOpacity={0.15} />
                        </linearGradient>
                      ))}
                      <filter id="compareGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <PolarGrid
                      stroke={chartConfig.gridColor}
                      strokeOpacity={chartTheme.radar.polarGrid.strokeOpacity}
                    />
                    <PolarAngleAxis
                      dataKey="domain"
                      tick={{
                        fontSize: 12,
                        fill: chartTheme.radar.polarAngleAxis.tick.fill,
                        fontWeight: chartTheme.radar.polarAngleAxis.tick.fontWeight,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: chartConfig.axisTextColor }}
                    />
                    {selectedCandidates.map((candidate, idx) => (
                      <Radar
                        key={candidate.id}
                        name={candidate.name}
                        dataKey={candidate.name}
                        stroke={chartColors[idx]?.stroke}
                        fill={`url(#compareGradient-${idx})`}
                        fillOpacity={1}
                        strokeWidth={chartConfig.strokeWidth}
                        strokeOpacity={chartConfig.strokeOpacity}
                        filter="url(#compareGlow)"
                      />
                    ))}
                    <Legend />
                    <Tooltip
                      contentStyle={chartTheme.tooltip.contentStyle}
                      wrapperStyle={chartTheme.tooltip.wrapperStyle}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {selectedCandidates.length < 2 && filteredCandidates.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">候補者を選択してください</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              2人以上の候補者を選択すると、比較表とレーダーチャートが表示されます。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
