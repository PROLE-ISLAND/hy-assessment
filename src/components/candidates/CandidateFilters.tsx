'use client';

// =====================================================
// Candidate Filters Component
// Search, filter, and sort controls
// =====================================================

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterState {
  search: string;
  position: string;
  status: string;
  judgment: string;
  sortBy: 'created_at' | 'score' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface CandidateFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  positions: { value: string; label: string }[];
  totalCount: number;
  displayCount: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'no_assessment', label: '検査未発行' },
  { value: 'pending', label: '未開始' },
  { value: 'in_progress', label: '回答中' },
  { value: 'completed', label: '検査完了' },
  { value: 'analyzed', label: '分析済み' },
];

const JUDGMENT_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'recommended', label: '推奨' },
  { value: 'consider', label: '要検討' },
  { value: 'caution', label: '慎重検討' },
  { value: 'none', label: '未分析' },
];

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: '登録日が新しい順' },
  { value: 'created_at_asc', label: '登録日が古い順' },
  { value: 'score_desc', label: 'スコアが高い順' },
  { value: 'score_asc', label: 'スコアが低い順' },
  { value: 'name_asc', label: '名前順（あ→わ）' },
  { value: 'name_desc', label: '名前順（わ→あ）' },
];

export function CandidateFilters({
  filters,
  onFilterChange,
  positions,
  totalCount,
  displayCount,
}: CandidateFiltersProps) {
  const handleSortChange = (value: string) => {
    // Handle compound sort values like 'created_at_desc'
    if (value.startsWith('created_at')) {
      onFilterChange({ sortBy: 'created_at', sortOrder: value.endsWith('asc') ? 'asc' : 'desc' });
    } else if (value.startsWith('score')) {
      onFilterChange({ sortBy: 'score', sortOrder: value.endsWith('asc') ? 'asc' : 'desc' });
    } else if (value.startsWith('name')) {
      onFilterChange({ sortBy: 'name', sortOrder: value.endsWith('asc') ? 'asc' : 'desc' });
    }
  };

  const currentSortValue = `${filters.sortBy}_${filters.sortOrder}`;

  const hasActiveFilters = filters.search || filters.position !== 'all' || filters.status !== 'all' || filters.judgment !== 'all';

  const clearFilters = () => {
    onFilterChange({
      search: '',
      position: 'all',
      status: 'all',
      judgment: 'all',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="名前・メールで検索..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Position Filter */}
        <Select
          value={filters.position}
          onValueChange={(value) => onFilterChange({ position: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="職種" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全職種</SelectItem>
            {positions.map((pos) => (
              <SelectItem key={pos.value} value={pos.value}>
                {pos.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ status: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Judgment Filter */}
        <Select
          value={filters.judgment}
          onValueChange={(value) => onFilterChange({ judgment: value })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="判定" />
          </SelectTrigger>
          <SelectContent>
            {JUDGMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={currentSortValue}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="並び替え" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count + Clear Filters */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalCount === displayCount
            ? `${totalCount}件`
            : `${displayCount}件 / ${totalCount}件中`}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
            フィルターをクリア
          </Button>
        )}
      </div>
    </div>
  );
}
