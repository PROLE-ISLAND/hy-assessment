// =====================================================
// Assessment Not Found Page
// =====================================================

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stateColors } from '@/lib/design-system';

export default function AssessmentNotFound() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${stateColors.error.light.bg} ${stateColors.error.dark.bg}`}>
            <AlertCircle className={`h-8 w-8 ${stateColors.error.light.text} ${stateColors.error.dark.text}`} />
          </div>
          <CardTitle className="text-2xl">検査が見つかりません</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            お探しの検査URLは存在しないか、削除されています。
          </p>
          <p className="text-sm text-muted-foreground/80">
            URLが正しいかご確認ください。問題が解決しない場合は、採用担当者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
