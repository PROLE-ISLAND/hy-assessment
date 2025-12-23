// =====================================================
// Assessment Not Found Page
// =====================================================

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssessmentNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">検査が見つかりません</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            お探しの検査URLは存在しないか、削除されています。
          </p>
          <p className="text-sm text-gray-500">
            URLが正しいかご確認ください。問題が解決しない場合は、採用担当者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
