'use client';

// =====================================================
// Template Editor using SurveyJS Creator
// Full-featured survey/form editor
// =====================================================

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Import SurveyJS Creator styles
import 'survey-core/survey-core.min.css';
import 'survey-creator-core/survey-creator-core.min.css';

interface TemplateEditorProps {
  templateId: string;
  templateName: string;
  version: string;
  questions: Record<string, unknown>;
}

export function TemplateEditor({
  templateId,
  templateName,
  version,
  questions,
}: TemplateEditorProps) {
  const router = useRouter();
  const [creator, setCreator] = useState<SurveyCreator | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize SurveyJS Creator
  useEffect(() => {
    const creatorOptions = {
      showLogicTab: true,
      showJSONEditorTab: true,
      showTranslationTab: false,
      showThemeTab: false,
      isAutoSave: false,
    };

    const newCreator = new SurveyCreator(creatorOptions);

    // Set Japanese locale for the creator UI
    newCreator.locale = 'ja';

    // Load existing questions
    if (questions && Object.keys(questions).length > 0) {
      newCreator.JSON = questions;
    }

    // Track changes
    newCreator.onModified.add(() => {
      setHasChanges(true);
    });

    setCreator(newCreator);

    return () => {
      // Cleanup
    };
  }, [questions]);

  const handleSave = useCallback(async () => {
    if (!creator) return;

    setSaving(true);
    setError(null);

    try {
      const questionsJson = creator.JSON;

      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsJson }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      setHasChanges(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [creator, templateId, router]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  if (!creator) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/templates/${templateId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{templateName}</h1>
            <p className="text-sm text-muted-foreground">
              バージョン: {version}
              {hasChanges && <span className="text-orange-500 ml-2">• 未保存の変更</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-sm text-destructive">{error}</span>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SurveyJS Creator */}
      <div className="border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <SurveyCreatorComponent creator={creator} />
      </div>
    </div>
  );
}
