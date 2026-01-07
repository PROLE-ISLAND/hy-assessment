'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Brain, ArrowRight } from 'lucide-react';

export type AssessmentType = 'gate' | 'personality';

interface AssessmentSelectorProps {
  onSelect: (type: AssessmentType) => void;
  completedTypes?: AssessmentType[];
}

export function AssessmentSelector({ onSelect, completedTypes = [] }: AssessmentSelectorProps) {
  const isGateCompleted = completedTypes.includes('gate');
  const isPersonalityCompleted = completedTypes.includes('personality');

  return (
    <div data-testid="assessment-selector" className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">適性検査</h1>
        <p className="text-muted-foreground">
          受検する検査を選択してください
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gate検査 */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
            isGateCompleted ? 'opacity-60' : ''
          }`}
          onClick={() => !isGateCompleted && onSelect('gate')}
          data-testid="assessment-option-gate"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <ClipboardCheck className="h-8 w-8 text-blue-500" />
              {isGateCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  完了
                </span>
              )}
            </div>
            <CardTitle className="text-lg">Gate検査</CardTitle>
            <CardDescription>
              論理的思考力・判断力を測定する検査です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              <p>所要時間: 約30分</p>
              <p>問題数: 約50問</p>
            </div>
            <Button
              className="w-full"
              disabled={isGateCompleted}
              variant={isGateCompleted ? 'outline' : 'default'}
            >
              {isGateCompleted ? '完了済み' : (
                <>
                  検査を開始
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 適職診断 */}
        <Card
          className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
            isPersonalityCompleted ? 'opacity-60' : ''
          }`}
          onClick={() => !isPersonalityCompleted && onSelect('personality')}
          data-testid="assessment-option-personality"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <Brain className="h-8 w-8 text-purple-500" />
              {isPersonalityCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  完了
                </span>
              )}
            </div>
            <CardTitle className="text-lg">適職診断</CardTitle>
            <CardDescription>
              行動スタイル・価値観から適職を診断します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              <p>所要時間: 約15分</p>
              <p>問題数: 67問</p>
            </div>
            <Button
              className="w-full"
              disabled={isPersonalityCompleted}
              variant={isPersonalityCompleted ? 'outline' : 'default'}
            >
              {isPersonalityCompleted ? '完了済み' : (
                <>
                  診断を開始
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {(isGateCompleted || isPersonalityCompleted) && (
        <p className="text-center text-sm text-muted-foreground">
          すべての検査が完了すると結果をお送りします
        </p>
      )}
    </div>
  );
}
