// =====================================================
// Assessment Complete Page
// =====================================================

import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stateColors } from '@/lib/design-system';

export default function AssessmentCompletePage() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${stateColors.success.light.bg} ${stateColors.success.dark.bg}`}>
            <CheckCircle className={`h-8 w-8 ${stateColors.success.light.text} ${stateColors.success.dark.text}`} />
          </div>
          <CardTitle className="text-2xl">検査が完了しました</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            ご回答いただきありがとうございました。
          </p>
          <p className="text-muted-foreground">
            回答内容は正常に送信されました。
          </p>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground/80">
              このページを閉じていただいて構いません。
            </p>
            <p className="text-sm text-muted-foreground/80 mt-2">
              結果については、採用担当者よりご連絡いたします。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
