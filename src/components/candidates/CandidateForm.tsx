'use client';

// =====================================================
// Candidate Registration Form
// Updated: Support desired_positions (multiple selection)
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { POSITIONS } from '@/lib/constants/positions';

interface CandidateFormProps {
  organizationId: string;
}

interface PersonInsert {
  organization_id: string;
  name: string;
  email: string;
}

interface PersonRow {
  id: string;
  organization_id: string;
  name: string;
  email: string;
}

interface CandidateInsert {
  organization_id: string;
  person_id: string;
  position: string;
  desired_positions: string[];
  notes: string | null;
}

export function CandidateForm({ organizationId }: CandidateFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
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
    if (selectedPositions.length === 0) {
      setError('希望職種を1つ以上選択してください');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 1. Create person record
      const personData: PersonInsert = {
        organization_id: organizationId,
        name,
        email,
      };
      const { data: person, error: personError } = await supabase
        .from('persons')
        .insert(personData as never)
        .select()
        .single<PersonRow>();

      if (personError) {
        if (personError.code === '23505') {
          setError('このメールアドレスは既に登録されています');
        } else {
          setError('登録に失敗しました: ' + personError.message);
        }
        return;
      }

      // Get position label for the first selected position
      const firstPosition = POSITIONS.find(p => p.value === selectedPositions[0]);
      const positionLabel = firstPosition?.label || selectedPositions[0];

      // 2. Create candidate record
      const candidateData: CandidateInsert = {
        organization_id: organizationId,
        person_id: person.id,
        position: positionLabel, // For backward compatibility
        desired_positions: selectedPositions,
        notes: notes || null,
      };
      const { error: candidateError } = await supabase
        .from('candidates')
        .insert(candidateData as never);

      if (candidateError) {
        setError('候補者の登録に失敗しました: ' + candidateError.message);
        return;
      }

      // Success - redirect to candidates list
      router.push('/admin/candidates');
      router.refresh();
    } catch {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>候補者登録</CardTitle>
        <CardDescription>
          新しい候補者の情報を入力してください
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                氏名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                data-testid="candidate-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                メールアドレス <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="yamada@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="candidate-email"
              />
            </div>
          </div>

          {/* Desired Positions - Multiple Selection */}
          <div className="space-y-3">
            <Label>
              希望職種 <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              該当する職種を選択してください（複数選択可）
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

          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              placeholder="面接メモや特記事項など（任意）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            data-testid="candidate-cancel"
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="candidate-submit">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </>
            ) : (
              '登録する'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
