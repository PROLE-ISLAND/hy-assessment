'use client';

// =====================================================
// Export Buttons Component
// Client component for CSV export functionality
// =====================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

type ExportType = 'candidates' | 'domains' | 'positions';

interface ExportButtonsProps {
  disabled?: boolean;
}

export function ExportButtons({ disabled = false }: ExportButtonsProps) {
  const [loading, setLoading] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    setLoading(type);

    try {
      const response = await fetch(`/api/reports/export?type=${type}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export_${type}.csv`;

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'CSVの生成に失敗しました');
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    {
      type: 'candidates' as ExportType,
      label: '候補者一覧',
      description: '名前、スコア、判定、検査日時',
    },
    {
      type: 'domains' as ExportType,
      label: 'ドメイン別分析',
      description: '6ドメインの平均スコア',
    },
    {
      type: 'positions' as ExportType,
      label: '職種別分析',
      description: '職種ごとの候補者数と平均',
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || loading !== null}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          CSVエクスポート
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {exportOptions.map(option => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleExport(option.type)}
            disabled={loading !== null}
            className="flex items-start gap-3 p-3"
          >
            <FileSpreadsheet className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
