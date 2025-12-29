// =====================================================
// Assessment Expired Page
// =====================================================

import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stateColors } from '@/lib/design-system';

export default function AssessmentExpiredPage() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${stateColors.warning.light.bg} ${stateColors.warning.dark.bg}`}>
            <Clock className={`h-8 w-8 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
          </div>
          <CardTitle className="text-2xl">検査URLの有効期限が切れています</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            この検査URLは有効期限が過ぎているため、アクセスできません。
          </p>
          <p className="text-sm text-muted-foreground/80">
            新しい検査URLが必要な場合は、採用担当者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
