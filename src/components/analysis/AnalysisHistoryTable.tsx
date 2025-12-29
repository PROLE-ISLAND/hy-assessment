'use client';

// =====================================================
// Analysis History Table Component
// Displays all analysis versions with actions
// =====================================================

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { VersionBadge } from './VersionBadge';
import { Eye, Download } from 'lucide-react';
import { getScoreTextClass } from '@/lib/design-system';

// Type for history item from API
export interface AnalysisHistoryItem {
  id: string;
  version: number;
  is_latest: boolean;
  model_version: string;
  prompt_version: string;
  tokens_used: number;
  analyzed_at: string;
  created_at: string;
  overallScore: number;
  scores: Record<string, number>;
}

interface AnalysisHistoryTableProps {
  assessmentId: string;
  history: AnalysisHistoryItem[];
  selectedVersion?: number;
  onSelectVersion: (version: number) => void;
  onCompare?: (version1: number, version2: number) => void;
  onDownloadPdf?: (version: number) => void;
}

export function AnalysisHistoryTable({
  assessmentId,
  history,
  selectedVersion,
  onSelectVersion,
  onCompare,
  onDownloadPdf,
}: AnalysisHistoryTableProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<number[]>([]);

  const handleVersionSelect = (version: number) => {
    if (compareMode) {
      if (compareVersions.includes(version)) {
        setCompareVersions(compareVersions.filter((v) => v !== version));
      } else if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, version]);
      }
    } else {
      onSelectVersion(version);
    }
  };

  const handleCompare = () => {
    if (compareVersions.length === 2 && onCompare) {
      onCompare(compareVersions[0], compareVersions[1]);
      setCompareMode(false);
      setCompareVersions([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadPdf = (version: number) => {
    if (onDownloadPdf) {
      onDownloadPdf(version);
    } else {
      // Default download behavior
      const url = `/api/analysis/pdf/${assessmentId}?version=${version}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Compare mode toggle */}
      {onCompare && (
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([]);
            }}
          >
            {compareMode ? '比較モード終了' : 'バージョン比較'}
          </Button>
          {compareMode && (
            <>
              <span className="text-sm text-muted-foreground">
                {compareVersions.length}/2 選択中
              </span>
              <Button
                size="sm"
                onClick={handleCompare}
                disabled={compareVersions.length !== 2}
              >
                比較する
              </Button>
            </>
          )}
        </div>
      )}

      {/* History table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">バージョン</TableHead>
              <TableHead className="w-24">総合スコア</TableHead>
              <TableHead>モデル</TableHead>
              <TableHead>プロンプト</TableHead>
              <TableHead>分析日時</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow
                key={item.id}
                className={`cursor-pointer ${
                  selectedVersion === item.version
                    ? 'bg-muted'
                    : compareVersions.includes(item.version)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                }`}
                onClick={() => handleVersionSelect(item.version)}
              >
                <TableCell>
                  <VersionBadge
                    version={item.version}
                    isLatest={item.is_latest}
                  />
                </TableCell>
                <TableCell>
                  <span className={getScoreTextClass(item.overallScore)}>
                    {item.overallScore}%
                  </span>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {item.model_version}
                  </code>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {item.prompt_version}
                  </code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(item.analyzed_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVersion(item.version);
                      }}
                      title="詳細表示"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(item.version);
                      }}
                      title="PDF出力"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {history.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          分析履歴がありません
        </div>
      )}
    </div>
  );
}
