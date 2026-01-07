'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Briefcase,
  Edit,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { JobTypeCreateDialog } from './JobTypeCreateDialog';
import { JobTypeEditDialog } from './JobTypeEditDialog';
import { JobTypeDeleteDialog } from './JobTypeDeleteDialog';

// 型定義
export interface JobType {
  id: string;
  name: string;
  description?: string;
  // DISC理想プロファイル
  ideal_dominance?: number;
  ideal_influence?: number;
  ideal_steadiness?: number;
  ideal_conscientiousness?: number;
  weight_dominance?: number;
  weight_influence?: number;
  weight_steadiness?: number;
  weight_conscientiousness?: number;
  // ストレス耐性
  ideal_stress?: number;
  weight_stress?: number;
  // EQ
  ideal_eq?: number;
  weight_eq?: number;
  // 価値観
  ideal_achievement?: number;
  ideal_stability?: number;
  ideal_growth?: number;
  ideal_social_contribution?: number;
  ideal_autonomy?: number;
  // メタデータ
  is_active: boolean;
  created_at: string;
}

interface JobTypesSettingsProps {
  jobTypes?: JobType[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onAdd?: (data: Partial<JobType>) => Promise<void>;
  onEdit?: (jobType: JobType) => Promise<void>;
  onDelete?: (jobType: JobType) => Promise<void>;
}

// DISC主要因子を計算
function getPrimaryDISCFactor(jobType: JobType): string {
  const factors = [
    { label: 'D', value: jobType.ideal_dominance ?? 0 },
    { label: 'I', value: jobType.ideal_influence ?? 0 },
    { label: 'S', value: jobType.ideal_steadiness ?? 0 },
    { label: 'C', value: jobType.ideal_conscientiousness ?? 0 },
  ];
  const sorted = [...factors].sort((a, b) => b.value - a.value);
  return sorted[0].value > 0 ? sorted[0].label : '-';
}

// スケルトンUI
function JobTypesSettingsSkeleton() {
  return (
    <Card data-testid="job-types-settings-skeleton">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 空状態UI
function JobTypesSettingsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <Card data-testid="job-types-settings-empty">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          職種設定
        </CardTitle>
        <CardDescription>
          組織の職種マスターと理想プロファイルを管理します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">職種がありません</h3>
          <p className="text-muted-foreground mb-6">
            最初の職種を追加して、理想的なパーソナリティプロファイルを設定しましょう
          </p>
          <Button onClick={onAdd} data-testid="add-job-type-button">
            <Plus className="h-4 w-4 mr-2" />
            職種を追加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// エラーUI
function JobTypesSettingsError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card data-testid="job-types-settings-error">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          職種設定
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">
            職種の読み込みに失敗しました
          </h3>
          <p className="text-muted-foreground mb-6">
            {error.message || 'エラーが発生しました。再度お試しください。'}
          </p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// デフォルトUI（職種一覧）
function JobTypesSettingsDefault({
  jobTypes,
  onAdd,
  onEdit,
  onDelete,
}: {
  jobTypes: JobType[];
  onAdd?: () => void;
  onEdit?: (jobType: JobType) => void;
  onDelete?: (jobType: JobType) => void;
}) {
  return (
    <Card data-testid="job-types-settings">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              職種設定
            </CardTitle>
            <CardDescription>
              組織の職種マスターと理想プロファイルを管理します
            </CardDescription>
          </div>
          <Button onClick={onAdd} data-testid="add-job-type-button">
            <Plus className="h-4 w-4 mr-2" />
            職種を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>職種名</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="text-center">DISC</TableHead>
              <TableHead className="text-center">ストレス</TableHead>
              <TableHead className="text-center">EQ</TableHead>
              <TableHead className="text-center">状態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobTypes.map((jobType) => (
              <TableRow key={jobType.id} data-testid={`job-type-row-${jobType.id}`}>
                <TableCell className="font-medium">{jobType.name}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {jobType.description || '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {getPrimaryDISCFactor(jobType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {jobType.ideal_stress ?? '-'}
                </TableCell>
                <TableCell className="text-center">
                  {jobType.ideal_eq ?? '-'}
                </TableCell>
                <TableCell className="text-center">
                  {jobType.is_active ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">
                      アクティブ
                    </Badge>
                  ) : (
                    <Badge variant="secondary">非アクティブ</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(jobType)}
                      data-testid={`edit-job-type-button-${jobType.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete?.(jobType)}
                      data-testid={`delete-job-type-button-${jobType.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// メインコンポーネント
export function JobTypesSettings({
  jobTypes,
  isLoading,
  error,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: JobTypesSettingsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [deletingJobType, setDeletingJobType] = useState<JobType | null>(null);

  // 早期リターンパターン
  if (isLoading) {
    return <JobTypesSettingsSkeleton />;
  }

  if (error) {
    return <JobTypesSettingsError error={error} onRetry={onRetry} />;
  }

  if (!jobTypes || jobTypes.length === 0) {
    return (
      <>
        <JobTypesSettingsEmpty onAdd={() => setIsCreateDialogOpen(true)} />
        <JobTypeCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSave={async (data) => {
            await onAdd?.(data);
            setIsCreateDialogOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <JobTypesSettingsDefault
        jobTypes={jobTypes}
        onAdd={() => setIsCreateDialogOpen(true)}
        onEdit={(jobType) => setEditingJobType(jobType)}
        onDelete={(jobType) => setDeletingJobType(jobType)}
      />

      {/* 作成ダイアログ */}
      <JobTypeCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={async (data) => {
          await onAdd?.(data);
          setIsCreateDialogOpen(false);
        }}
      />

      {/* 編集ダイアログ */}
      <JobTypeEditDialog
        open={!!editingJobType}
        onOpenChange={(open) => !open && setEditingJobType(null)}
        jobType={editingJobType}
        onSave={async (data) => {
          if (editingJobType) {
            await onEdit?.({ ...editingJobType, ...data });
          }
          setEditingJobType(null);
        }}
      />

      {/* 削除確認ダイアログ */}
      <JobTypeDeleteDialog
        open={!!deletingJobType}
        onOpenChange={(open) => !open && setDeletingJobType(null)}
        jobType={deletingJobType}
        onConfirm={async () => {
          if (deletingJobType) {
            await onDelete?.(deletingJobType);
          }
          setDeletingJobType(null);
        }}
      />
    </>
  );
}
