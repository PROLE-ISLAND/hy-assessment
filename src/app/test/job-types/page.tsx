'use client';

import { JobTypesSettings } from '@/components/job-types';

export default function JobTypesTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">職種設定テスト</h1>
        <JobTypesSettings />
      </div>
    </div>
  );
}
