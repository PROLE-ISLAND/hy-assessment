'use client';

// =====================================================
// Organization Form Component
// Form for editing organization settings
// =====================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { stateColors } from '@/lib/design-system';
import type { OrganizationResponse } from '@/types/settings';

// フォームスキーマ
const formSchema = z.object({
  name: z
    .string()
    .min(1, '組織名を入力してください')
    .max(100, '組織名は100文字以内で入力してください'),
  defaultValidityDays: z
    .number()
    .int()
    .min(1, '1日以上を指定してください')
    .max(365, '365日以内を指定してください'),
  autoReminder: z.boolean(),
  reminderDays: z.array(z.number()),
});

type FormData = z.infer<typeof formSchema>;

interface OrganizationFormProps {
  organization: OrganizationResponse;
  isAdmin: boolean;
  onUpdate?: () => void;
}

export function OrganizationForm({
  organization,
  isAdmin,
  onUpdate,
}: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
      defaultValidityDays: organization.settings.assessment.defaultValidityDays,
      autoReminder: organization.settings.assessment.autoReminder,
      reminderDays: organization.settings.assessment.reminderDays,
    },
  });

  const autoReminder = watch('autoReminder');

  const onSubmit = async (data: FormData) => {
    if (!isAdmin) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          settings: {
            assessment: {
              defaultValidityDays: data.defaultValidityDays,
              autoReminder: data.autoReminder,
              reminderDays: data.reminderDays,
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新に失敗しました');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本情報 */}
      <Card data-testid="organization-basic-info">
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>組織の基本情報を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">組織名</Label>
            <Input
              id="name"
              data-testid="organization-name-input"
              {...register('name')}
              disabled={!isAdmin}
              placeholder="組織名を入力"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>URL スラッグ（変更不可）</Label>
            <Input
              value={organization.slug}
              disabled
              className="bg-muted"
              data-testid="organization-slug-input"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            作成日: {new Date(organization.created_at).toLocaleDateString('ja-JP')}
          </div>
        </CardContent>
      </Card>

      {/* 検査設定 */}
      <Card data-testid="organization-assessment-settings">
        <CardHeader>
          <CardTitle>検査設定</CardTitle>
          <CardDescription>検査のデフォルト設定を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultValidityDays">デフォルト有効期限</Label>
            <Select
              value={String(watch('defaultValidityDays'))}
              onValueChange={(value) =>
                setValue('defaultValidityDays', Number(value), { shouldDirty: true })
              }
              disabled={!isAdmin}
            >
              <SelectTrigger
                id="defaultValidityDays"
                data-testid="validity-days-select"
              >
                <SelectValue placeholder="有効期限を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3日</SelectItem>
                <SelectItem value="7">7日</SelectItem>
                <SelectItem value="14">14日</SelectItem>
                <SelectItem value="30">30日</SelectItem>
              </SelectContent>
            </Select>
            {errors.defaultValidityDays && (
              <p className="text-sm text-destructive">
                {errors.defaultValidityDays.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>自動リマインドメール</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reminder-3"
                checked={watch('reminderDays').includes(3)}
                onCheckedChange={(checked) => {
                  const current = watch('reminderDays');
                  if (checked) {
                    setValue('reminderDays', [...current, 3].sort((a, b) => b - a), {
                      shouldDirty: true,
                    });
                  } else {
                    setValue(
                      'reminderDays',
                      current.filter((d: number) => d !== 3),
                      { shouldDirty: true }
                    );
                  }
                }}
                disabled={!isAdmin || !autoReminder}
                data-testid="reminder-3-checkbox"
              />
              <Label htmlFor="reminder-3" className="font-normal">
                有効期限の3日前に送信
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reminder-1"
                checked={watch('reminderDays').includes(1)}
                onCheckedChange={(checked) => {
                  const current = watch('reminderDays');
                  if (checked) {
                    setValue('reminderDays', [...current, 1].sort((a, b) => b - a), {
                      shouldDirty: true,
                    });
                  } else {
                    setValue(
                      'reminderDays',
                      current.filter((d: number) => d !== 1),
                      { shouldDirty: true }
                    );
                  }
                }}
                disabled={!isAdmin || !autoReminder}
                data-testid="reminder-1-checkbox"
              />
              <Label htmlFor="reminder-1" className="font-normal">
                有効期限の1日前に送信
              </Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoReminder"
              checked={autoReminder}
              onCheckedChange={(checked) =>
                setValue('autoReminder', checked as boolean, { shouldDirty: true })
              }
              disabled={!isAdmin}
              data-testid="auto-reminder-checkbox"
            />
            <Label htmlFor="autoReminder" className="font-normal">
              自動リマインダーを有効にする
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタンとフィードバック */}
      {isAdmin && (
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="form-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              className={`border ${stateColors.success.light.border} ${stateColors.success.light.bg} ${stateColors.success.light.text} dark:${stateColors.success.dark.bg} dark:${stateColors.success.dark.text}`}
              data-testid="form-success"
            >
              <Check className="h-4 w-4" />
              <AlertDescription>組織設定を更新しました</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            data-testid="save-organization-button"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            変更を保存
          </Button>
        </div>
      )}
    </form>
  );
}
