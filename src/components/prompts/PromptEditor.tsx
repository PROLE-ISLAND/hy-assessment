'use client';

// =====================================================
// Prompt Editor Component
// Monaco Editor integration for prompt editing
// =====================================================

import { useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function PromptEditor({
  value,
  onChange,
  height = '400px',
  readOnly = false,
}: PromptEditorProps) {
  const { resolvedTheme } = useTheme();

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    // Configure editor settings
    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: 'on',
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      tabSize: 2,
      padding: { top: 16, bottom: 16 },
    });

    // Add custom language configuration for prompts
    monaco.languages.register({ id: 'prompt' });
    monaco.languages.setMonarchTokensProvider('prompt', {
      tokenizer: {
        root: [
          // JSON format hints
          [/"[^"]*"(?=\s*:)/, 'key'],
          [/"[^"]*"/, 'string'],
          [/\{|\}|\[|\]/, 'delimiter.bracket'],

          // Section headers (## style)
          [/^##\s.*$/, 'keyword'],
          [/^#\s.*$/, 'type'],

          // Bullet points
          [/^\s*[-*]\s/, 'operator'],
          [/^\d+\.\s/, 'number'],

          // Variables/placeholders
          [/\{\{[^}]+\}\}/, 'variable'],
          [/\$\{[^}]+\}/, 'variable'],

          // Emphasis
          [/\*\*[^*]+\*\*/, 'strong'],
          [/\*[^*]+\*/, 'emphasis'],
        ],
      },
    });

    // Theme colors for prompt language
    monaco.editor.defineTheme('prompt-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0066cc', fontStyle: 'bold' },
        { token: 'type', foreground: '0099cc', fontStyle: 'bold' },
        { token: 'variable', foreground: 'cc6600' },
        { token: 'string', foreground: '008800' },
        { token: 'key', foreground: '660066' },
        { token: 'strong', fontStyle: 'bold' },
      ],
      colors: {},
    });

    monaco.editor.defineTheme('prompt-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '66ccff', fontStyle: 'bold' },
        { token: 'type', foreground: '88ddff', fontStyle: 'bold' },
        { token: 'variable', foreground: 'ffaa44' },
        { token: 'string', foreground: '88cc88' },
        { token: 'key', foreground: 'cc88cc' },
        { token: 'strong', fontStyle: 'bold' },
      ],
      colors: {},
    });
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        language="prompt"
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme={resolvedTheme === 'dark' ? 'prompt-dark' : 'prompt-light'}
        options={{
          readOnly,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-muted">
            <span className="text-muted-foreground">エディタを読み込み中...</span>
          </div>
        }
      />
    </div>
  );
}
