'use client';

// =====================================================
// Candidate Info Form
// Collects candidate information before assessment starts
// =====================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { POSITIONS } from '@/lib/constants/positions';

interface CandidateInfoFormProps {
  token: string;
  onComplete: () => void;
}

export function CandidateInfoForm({ token, onComplete }: CandidateInfoFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePositionChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedPositions([...selectedPositions, value]);
    } else {
      setSelectedPositions(selectedPositions.filter(p => p !== value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('お名前を入力してください');
      setIsLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      setIsLoading(false);
      return;
    }
    if (selectedPositions.length === 0) {
      setError('希望職種を1つ以上選択してください');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/assessment/${token}/candidate-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          desiredPositions: selectedPositions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">適性検査</CardTitle>
        <CardDescription>
          検査を開始する前に、以下の情報をご入力ください
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">お名前 <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              type="text"
              placeholder="山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Desired Positions */}
          <div className="space-y-3">
            <Label>希望職種 <span className="text-destructive">*</span></Label>
            <p className="text-sm text-muted-foreground">
              興味のある職種を選択してください（複数選択可）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POSITIONS.map((position) => (
                <div key={position.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={position.value}
                    checked={selectedPositions.includes(position.value)}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      handlePositionChange(position.value, checked === true)
                    }
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={position.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {position.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '検査を開始する'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            入力された情報は採用選考にのみ使用されます
          </p>
        </CardContent>
      </form>
    </Card>
  );
}
