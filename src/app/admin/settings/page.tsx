// =====================================================
// Settings Page
// System settings overview
// =====================================================

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  User,
  Building2,
  Bell,
  Shield,
  ChevronRight,
} from 'lucide-react';

interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  disabled?: boolean;
}

function SettingCard({ title, description, icon, href, disabled }: SettingCardProps) {
  const content = (
    <Card className={`group hover:shadow-md transition-shadow ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </CardHeader>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          システムとアカウントの設定を管理します
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-4">
        <SettingCard
          title="プロフィール"
          description="名前、メールアドレス、パスワードの変更"
          icon={<User className="h-5 w-5" />}
          href="/admin/settings/profile"
        />
        <SettingCard
          title="組織設定"
          description="組織情報の確認・編集"
          icon={<Building2 className="h-5 w-5" />}
          href="/admin/settings/organization"
        />
        <SettingCard
          title="通知設定"
          description="メール通知の設定"
          icon={<Bell className="h-5 w-5" />}
          href="/admin/settings/notifications"
          disabled
        />
        <SettingCard
          title="セキュリティ"
          description="セッション管理、ログイン履歴"
          icon={<Shield className="h-5 w-5" />}
          href="/admin/settings/security"
        />
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            一部の設定項目は現在準備中です。今後のアップデートでご利用いただけるようになります。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
