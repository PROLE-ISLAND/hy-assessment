'use client';

// =====================================================
// Candidate List Client Component
// Interactive table with filters, sorting, and selection
// Uses design system for consistent styling
// =====================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Users, UserCheck, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CandidateFilters, type FilterState } from './CandidateFilters';
import type { CandidateCardData } from './CandidateCard';
import {
  candidateStatusConfig,
  judgmentConfig,
  getScoreTextClass,
  type JudgmentLevel,
} from '@/lib/design-system';

interface CandidateListClientProps {
  candidates: CandidateCardData[];
  positions: { value: string; label: string }[];
}

export function CandidateListClient({ candidates, positions }: CandidateListClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    position: 'all',
    status: 'all',
    judgment: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower)
      );
    }

    // Position filter
    if (filters.position !== 'all') {
      result = result.filter((c) => c.position === filters.position);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((c) => c.status === filters.status);
    }

    // Judgment filter
    if (filters.judgment !== 'all') {
      if (filters.judgment === 'none') {
        result = result.filter((c) => !c.judgment);
      } else {
        result = result.filter((c) => c.judgment === filters.judgment);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'score':
          const scoreA = a.overallScore ?? -1;
          const scoreB = b.overallScore ?? -1;
          comparison = scoreA - scoreB;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ja');
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [candidates, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSelectCandidate = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
    }
  };

  const selectedCandidates = filteredCandidates.filter((c) => selectedIds.has(c.id));

  // Build compare URL with selected candidate IDs
  const compareUrl = selectedCandidates.length >= 2
    ? `/admin/compare?preselect=${selectedCandidates.map((c) => c.id).join(',')}`
    : null;

  const isEmpty = filteredCandidates.length === 0;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">候補者管理</h1>
          <p className="text-sm text-muted-foreground">候補者の登録・検査状況・分析結果を管理</p>
        </div>
        <Button size="sm" asChild data-testid="add-candidate-button">
          <Link href="/admin/candidates/new">
            <Plus className="mr-1 h-4 w-4" />
            候補者を追加
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <CandidateFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            positions={positions}
            totalCount={candidates.length}
            displayCount={filteredCandidates.length}
          />
        </CardContent>
      </Card>

      {/* Bulk Actions (when selected) */}
      {selectedIds.size > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-7" onClick={handleSelectAll} data-testid="select-all-button">
                  {selectedIds.size === filteredCandidates.length ? '選択解除' : '全て選択'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size}件選択中
                </span>
              </div>
              <div className="flex items-center gap-2">
                {compareUrl && (
                  <Button variant="outline" size="sm" className="h-7" asChild data-testid="compare-button">
                    <Link href={compareUrl}>
                      <UserCheck className="mr-1 h-4 w-4" />
                      比較する ({selectedCandidates.length}人)
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates Table */}
      {candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-semibold">候補者がいません</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
              最初の候補者を登録しましょう。登録後、検査URLが発行されます。
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/candidates/new">
                <Plus className="mr-1 h-4 w-4" />
                最初の候補者を追加
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-semibold">条件に一致する候補者がいません</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
              フィルター条件を変更してみてください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">候補者一覧</CardTitle>
            <CardDescription className="text-xs">
              {filteredCandidates.length}件の候補者
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                      onCheckedChange={() => handleSelectAll()}
                    />
                  </TableHead>
                  <TableHead>候補者</TableHead>
                  <TableHead>希望職種</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>判定</TableHead>
                  <TableHead>総合スコア</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => {
                  const statusInfo = candidateStatusConfig[candidate.status];
                  const judgmentInfo = candidate.judgment ? judgmentConfig[candidate.judgment] : null;

                  return (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(candidate.id)}
                          onCheckedChange={(checked) => handleSelectCandidate(candidate.id, checked === true)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link
                            href={`/admin/candidates/${candidate.id}`}
                            className="font-medium hover:text-blue-600"
                          >
                            {candidate.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {candidate.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{candidate.positionLabel}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className} variant="secondary">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {judgmentInfo ? (
                          <Badge className={judgmentInfo.badgeClass} variant="secondary">
                            {judgmentInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {candidate.overallScore !== undefined ? (
                          <span className={`font-semibold ${getScoreTextClass(candidate.overallScore)}`}>
                            {candidate.overallScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7" asChild data-testid={`candidate-detail-${candidate.id}`}>
                            <Link href={`/admin/candidates/${candidate.id}`}>
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              詳細
                            </Link>
                          </Button>
                          {candidate.status === 'analyzed' && candidate.assessmentId && (
                            <Button variant="ghost" size="sm" className="h-7" asChild data-testid={`candidate-analysis-${candidate.id}`}>
                              <Link href={`/admin/assessments/${candidate.assessmentId}?from=candidate`}>
                                <BarChart3 className="mr-1 h-3.5 w-3.5" />
                                分析
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
