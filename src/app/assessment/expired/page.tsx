// =====================================================
// Assessment Expired Page
// =====================================================

import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssessmentExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">検査URLの有効期限が切れています</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            この検査URLは有効期限が過ぎているため、アクセスできません。
          </p>
          <p className="text-sm text-gray-500">
            新しい検査URLが必要な場合は、採用担当者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
