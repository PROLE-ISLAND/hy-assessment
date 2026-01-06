'use client';

// =====================================================
// Organization Settings Page
// Manage organization information and settings
// =====================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationForm } from '@/components/settings/OrganizationForm';
import { DeleteOrganizationDialog } from '@/components/settings/DeleteOrganizationDialog';
import type { OrganizationResponse } from '@/types/settings';

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = organization?.userRole === 'admin';

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/settings/organization');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '組織情報の取得に失敗しました');
      }

      setOrganization(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '組織情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  // ローディング状態
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="organization-settings-skeleton">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="space-y-6" data-testid="organization-settings-error">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">組織設定</h1>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button
              onClick={fetchOrganization}
              variant="outline"
              className="mt-4"
              data-testid="retry-button"
            >
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="organization-settings-page">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">組織設定</h1>
          <p className="text-muted-foreground">
            組織の基本情報を管理します
          </p>
        </div>
      </div>

      {/* 編集フォーム */}
      <OrganizationForm
        organization={organization}
        isAdmin={isAdmin}
        onUpdate={fetchOrganization}
      />

      {/* 危険な操作（Admin のみ） */}
      {isAdmin && (
        <Card className="border-destructive" data-testid="danger-zone">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              危険な操作
            </CardTitle>
            <CardDescription>
              組織を削除すると、すべてのデータが失われます。この操作は取り消せません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteOrganizationDialog organizationName={organization.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
