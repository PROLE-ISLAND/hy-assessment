'use client';

// =====================================================
// Back Navigation Button
// Smart back button that remembers where user came from
// =====================================================

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BackNavigationButtonProps {
  candidateId: string;
  candidateName: string;
}

export function BackNavigationButton({
  candidateId,
  candidateName,
}: BackNavigationButtonProps) {
  const searchParams = useSearchParams();

  const from = searchParams.get('from');

  // If coming from candidate page, show direct back link
  if (from === 'candidate') {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/candidates/${candidateId}?tab=analysis`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {candidateName} に戻る
        </Link>
      </Button>
    );
  }

  // Otherwise, show dropdown with options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <Link href={`/admin/candidates/${candidateId}`} className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            {candidateName} の詳細
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/assessments" className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" />
            検査結果一覧
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
