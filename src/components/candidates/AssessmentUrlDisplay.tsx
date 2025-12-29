'use client';

// =====================================================
// Assessment URL Display
// Shows the assessment URL with copy functionality
// =====================================================

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AssessmentUrlDisplayProps {
  token: string;
}

export function AssessmentUrlDisplay({ token }: AssessmentUrlDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Build assessment URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const assessmentUrl = `${baseUrl}/assessment/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(assessmentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">検査URL</p>
      <div className="flex gap-2">
        <Input
          value={assessmentUrl}
          readOnly
          className="font-mono text-xs"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="URLをコピー"
          aria-label="URLをコピー"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          asChild
          title="新しいタブで開く"
          aria-label="新しいタブで開く"
        >
          <a href={assessmentUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        このURLを候補者に送信してください
      </p>
    </div>
  );
}
