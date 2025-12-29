'use client';

// =====================================================
// Profile Form Component
// Client component for profile editing
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, User, Lock, Mail } from 'lucide-react';

interface ProfileFormProps {
  userId: string;
  initialName: string;
  email: string;
  role: string;
}

export function ProfileForm({ userId, initialName, email, role }: ProfileFormProps) {
  const router = useRouter();

  // Profile state
  const [name, setName] = useState(initialName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新に失敗しました');
      }

      setNameSuccess(true);
      router.refresh();
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードが一致しません');
      setIsSavingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください');
      setIsSavingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワード変更に失敗しました');
      }

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'パスワード変更に失敗しました');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const roleLabel = role === 'admin' ? '管理者' : role === 'reviewer' ? 'レビュアー' : 'ユーザー';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本情報
          </CardTitle>
          <CardDescription>
            名前とメールアドレスを確認・変更できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                メールアドレス
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                メールアドレスは変更できません
              </p>
            </div>

            <div className="space-y-2">
              <Label>権限</Label>
              <div>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
            </div>

            {nameError && (
              <Alert variant="destructive">
                <AlertDescription>{nameError}</AlertDescription>
              </Alert>
            )}

            {nameSuccess && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <Check className="h-4 w-4" />
                <AlertDescription>名前を更新しました</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSavingName || name === initialName}
            >
              {isSavingName ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '変更を保存'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            パスワード変更
          </CardTitle>
          <CardDescription>
            ログインパスワードを変更できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">現在のパスワード</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
              />
            </div>

            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {passwordSuccess && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <Check className="h-4 w-4" />
                <AlertDescription>パスワードを変更しました</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  変更中...
                </>
              ) : (
                'パスワードを変更'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
