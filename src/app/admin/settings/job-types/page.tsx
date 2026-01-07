// =====================================================
// Job Types Settings Page
// Manage organization job type master data
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { JobTypeList } from '@/components/settings/JobTypeList';
import { JobTypeFormDialog, type JobTypeFormData } from '@/components/settings/JobTypeFormDialog';
import type { JobType } from '@/types/database';

export default function JobTypesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch job types
  const fetchJobTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/job-types');
      if (!response.ok) {
        throw new Error('職種の取得に失敗しました');
      }
      const data = await response.json();
      setJobTypes(data.jobTypes || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobTypes();
  }, [fetchJobTypes]);

  // Handle add
  const handleAdd = () => {
    setEditingJobType(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (jobType: JobType) => {
    setEditingJobType(jobType);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (jobType: JobType) => {
    try {
      const response = await fetch(`/api/settings/job-types/${jobType.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }
      toast({
        title: '削除完了',
        description: `${jobType.name} を削除しました`,
      });
      fetchJobTypes();
    } catch (err) {
      toast({
        title: 'エラー',
        description: err instanceof Error ? err.message : '削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // Handle form submit
  const handleSubmit = async (data: JobTypeFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingJobType
        ? `/api/settings/job-types/${editingJobType.id}`
        : '/api/settings/job-types';
      const method = editingJobType ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存に失敗しました');
      }

      toast({
        title: editingJobType ? '更新完了' : '作成完了',
        description: `${data.name} を${editingJobType ? '更新' : '作成'}しました`,
      });
      setIsFormOpen(false);
      fetchJobTypes();
    } catch (err) {
      toast({
        title: 'エラー',
        description: err instanceof Error ? err.message : '保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/settings')}
          data-testid="back-to-settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">職種設定</h1>
          <p className="text-muted-foreground">
            配属推薦に使用する職種マスターを管理します
          </p>
        </div>
      </div>

      {/* Job Type List */}
      <JobTypeList
        data={jobTypes}
        isLoading={isLoading}
        error={error}
        onRetry={fetchJobTypes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Dialog */}
      <JobTypeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        jobType={editingJobType}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
