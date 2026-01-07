'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { JobType } from './JobTypesSettings';

interface JobTypeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobType: JobType | null;
  onSave: (data: Partial<JobType>) => Promise<void>;
}

// スコア入力コンポーネント
function ScoreInput({
  label,
  value,
  onChange,
  weight,
  onWeightChange,
  testId,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  weight: number;
  onWeightChange: (value: number) => void;
  testId: string;
}) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">
          理想値: {value} / 重み: {weight.toFixed(1)}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground w-12">理想値</span>
          <Slider
            data-testid={`${testId}-slider`}
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            max={100}
            step={5}
            className="flex-1"
          />
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={0}
            max={100}
            className="w-16 text-center"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground w-12">重み</span>
          <Slider
            value={[weight * 10]}
            onValueChange={([v]) => onWeightChange(v / 10)}
            max={10}
            step={1}
            className="flex-1"
          />
          <Input
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            min={0}
            max={1}
            step={0.1}
            className="w-16 text-center"
          />
        </div>
      </div>
    </div>
  );
}

export function JobTypeEditDialog({
  open,
  onOpenChange,
  jobType,
  onSave,
}: JobTypeEditDialogProps) {
  // 基本情報
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // DISC
  const [idealD, setIdealD] = useState(50);
  const [idealI, setIdealI] = useState(50);
  const [idealS, setIdealS] = useState(50);
  const [idealC, setIdealC] = useState(50);
  const [weightD, setWeightD] = useState(0.5);
  const [weightI, setWeightI] = useState(0.5);
  const [weightS, setWeightS] = useState(0.5);
  const [weightC, setWeightC] = useState(0.5);

  // ストレス・EQ
  const [idealStress, setIdealStress] = useState(60);
  const [weightStress, setWeightStress] = useState(0.5);
  const [idealEq, setIdealEq] = useState(60);
  const [weightEq, setWeightEq] = useState(0.5);

  // 価値観
  const [idealAchievement, setIdealAchievement] = useState(50);
  const [idealStability, setIdealStability] = useState(50);
  const [idealGrowth, setIdealGrowth] = useState(50);
  const [idealSocialContribution, setIdealSocialContribution] = useState(50);
  const [idealAutonomy, setIdealAutonomy] = useState(50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // jobTypeが変更されたら値をリセット
  useEffect(() => {
    if (jobType) {
      setName(jobType.name);
      setDescription(jobType.description || '');
      setIsActive(jobType.is_active);
      // DISC
      setIdealD(jobType.ideal_dominance ?? 50);
      setIdealI(jobType.ideal_influence ?? 50);
      setIdealS(jobType.ideal_steadiness ?? 50);
      setIdealC(jobType.ideal_conscientiousness ?? 50);
      setWeightD(jobType.weight_dominance ?? 0.5);
      setWeightI(jobType.weight_influence ?? 0.5);
      setWeightS(jobType.weight_steadiness ?? 0.5);
      setWeightC(jobType.weight_conscientiousness ?? 0.5);
      // ストレス・EQ
      setIdealStress(jobType.ideal_stress ?? 60);
      setWeightStress(jobType.weight_stress ?? 0.5);
      setIdealEq(jobType.ideal_eq ?? 60);
      setWeightEq(jobType.weight_eq ?? 0.5);
      // 価値観
      setIdealAchievement(jobType.ideal_achievement ?? 50);
      setIdealStability(jobType.ideal_stability ?? 50);
      setIdealGrowth(jobType.ideal_growth ?? 50);
      setIdealSocialContribution(jobType.ideal_social_contribution ?? 50);
      setIdealAutonomy(jobType.ideal_autonomy ?? 50);
    }
  }, [jobType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('職種名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
        // DISC
        ideal_dominance: idealD,
        ideal_influence: idealI,
        ideal_steadiness: idealS,
        ideal_conscientiousness: idealC,
        weight_dominance: weightD,
        weight_influence: weightI,
        weight_steadiness: weightS,
        weight_conscientiousness: weightC,
        // ストレス・EQ
        ideal_stress: idealStress,
        weight_stress: weightStress,
        ideal_eq: idealEq,
        weight_eq: weightEq,
        // 価値観
        ideal_achievement: idealAchievement,
        ideal_stability: idealStability,
        ideal_growth: idealGrowth,
        ideal_social_contribution: idealSocialContribution,
        ideal_autonomy: idealAutonomy,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>職種を編集</DialogTitle>
            <DialogDescription>
              職種の基本情報と理想的なパーソナリティプロファイルを設定します
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">基本</TabsTrigger>
              <TabsTrigger value="disc" data-testid="disc-tab">
                DISC
              </TabsTrigger>
              <TabsTrigger value="stress" data-testid="stress-tab">
                ストレス
              </TabsTrigger>
              <TabsTrigger value="eq" data-testid="eq-tab">
                EQ
              </TabsTrigger>
              <TabsTrigger value="values" data-testid="values-tab">
                価値観
              </TabsTrigger>
            </TabsList>

            {/* 基本情報タブ */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">
                  職種名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  data-testid="job-type-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  data-testid="job-type-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">アクティブ状態</Label>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>

            {/* DISCタブ */}
            <TabsContent value="disc" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                この職種に適したDISCプロファイルの理想値と重みを設定します
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <ScoreInput
                  label="D（主導性）"
                  value={idealD}
                  onChange={setIdealD}
                  weight={weightD}
                  onWeightChange={setWeightD}
                  testId="ideal-dominance"
                />
                <ScoreInput
                  label="I（影響力）"
                  value={idealI}
                  onChange={setIdealI}
                  weight={weightI}
                  onWeightChange={setWeightI}
                  testId="ideal-influence"
                />
                <ScoreInput
                  label="S（安定性）"
                  value={idealS}
                  onChange={setIdealS}
                  weight={weightS}
                  onWeightChange={setWeightS}
                  testId="ideal-steadiness"
                />
                <ScoreInput
                  label="C（慎重性）"
                  value={idealC}
                  onChange={setIdealC}
                  weight={weightC}
                  onWeightChange={setWeightC}
                  testId="ideal-conscientiousness"
                />
              </div>
            </TabsContent>

            {/* ストレスタブ */}
            <TabsContent value="stress" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                この職種に求められるストレス耐性の理想値を設定します
              </p>
              <ScoreInput
                label="ストレス耐性（総合）"
                value={idealStress}
                onChange={setIdealStress}
                weight={weightStress}
                onWeightChange={setWeightStress}
                testId="ideal-stress"
              />
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>リスクレベル判定基準:</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• 70-100: 低リスク（高ストレス環境に適応可能）</li>
                  <li>• 40-69: 中リスク（通常のストレス環境に適応可能）</li>
                  <li>• 0-39: 高リスク（低ストレス環境が望ましい）</li>
                </ul>
              </div>
            </TabsContent>

            {/* EQタブ */}
            <TabsContent value="eq" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                この職種に求められる感情知性（EQ）の理想値を設定します
              </p>
              <ScoreInput
                label="EQ（総合）"
                value={idealEq}
                onChange={setIdealEq}
                weight={weightEq}
                onWeightChange={setWeightEq}
                testId="ideal-eq"
              />
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>EQ構成要素:</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• 自己認識: 自分の感情・強み・弱みを理解する能力</li>
                  <li>• 自己管理: 感情をコントロールし誠実に行動する能力</li>
                  <li>• 社会的認識: 他者の感情やニーズを読み取る能力</li>
                  <li>• 関係管理: 他者と効果的に協働する能力</li>
                </ul>
              </div>
            </TabsContent>

            {/* 価値観タブ */}
            <TabsContent value="values" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                この職種に適した価値観の理想プロファイルを設定します
              </p>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>達成志向</Label>
                    <span className="text-sm text-muted-foreground">{idealAchievement}</span>
                  </div>
                  <Slider
                    value={[idealAchievement]}
                    onValueChange={([v]) => setIdealAchievement(v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>安定志向</Label>
                    <span className="text-sm text-muted-foreground">{idealStability}</span>
                  </div>
                  <Slider
                    value={[idealStability]}
                    onValueChange={([v]) => setIdealStability(v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>成長志向</Label>
                    <span className="text-sm text-muted-foreground">{idealGrowth}</span>
                  </div>
                  <Slider
                    value={[idealGrowth]}
                    onValueChange={([v]) => setIdealGrowth(v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>社会貢献志向</Label>
                    <span className="text-sm text-muted-foreground">{idealSocialContribution}</span>
                  </div>
                  <Slider
                    value={[idealSocialContribution]}
                    onValueChange={([v]) => setIdealSocialContribution(v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>自律志向</Label>
                    <span className="text-sm text-muted-foreground">{idealAutonomy}</span>
                  </div>
                  <Slider
                    value={[idealAutonomy]}
                    onValueChange={([v]) => setIdealAutonomy(v)}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="text-sm text-destructive mt-4" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
