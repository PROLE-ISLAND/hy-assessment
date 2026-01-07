'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// 型定義
interface Question {
  id: string;
  text: string;
  category: 'disc' | 'stress' | 'eq' | 'values';
  type: 'likert' | 'forced_choice' | 'ranking';
  options?: { value: string; label: string }[];
}

interface AssessmentSection {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface PersonalityAssessmentProps {
  candidateId: string;
  template?: AssessmentSection[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onSubmit?: (responses: Record<string, string>) => Promise<void>;
}

// デフォルトのLikert選択肢
const likertOptions = [
  { value: '1', label: '全くそう思わない' },
  { value: '2', label: 'あまりそう思わない' },
  { value: '3', label: 'どちらともいえない' },
  { value: '4', label: 'ややそう思う' },
  { value: '5', label: '強くそう思う' },
];

// 行動スタイル（DISC）質問 - 24問
const discQuestions: Question[] = [
  { id: 'disc_1', text: 'チームで新しいプロジェクトが始まるとき、あなたは最初に何をしますか？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: 'ゴールと期限を明確にする' },
    { value: 'I', label: 'メンバーの意気込みを高める' },
    { value: 'S', label: '全員の役割と負担を確認する' },
    { value: 'C', label: '過去の類似案件を調査する' },
  ]},
  { id: 'disc_2', text: '会議で議論が煮詰まったとき、あなたはどうしますか？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '決断して先に進める提案をする' },
    { value: 'I', label: '場の雰囲気を変える話題を出す' },
    { value: 'S', label: '全員が発言できるよう促す' },
    { value: 'C', label: '論点を整理して可視化する' },
  ]},
  { id: 'disc_3', text: '予期せぬ問題が発生したとき、まず何をしますか？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: 'すぐに対策を決めて実行する' },
    { value: 'I', label: '関係者に状況を共有して相談する' },
    { value: 'S', label: '落ち着いて情報を集める' },
    { value: 'C', label: '問題の根本原因を分析する' },
  ]},
  { id: 'disc_4', text: '上司から曖昧な指示を受けたとき、どうしますか？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '自分の判断で進めて後で報告する' },
    { value: 'I', label: '上司と話して意図を確認する' },
    { value: 'S', label: '同僚に相談してから動く' },
    { value: 'C', label: '詳細な確認事項をリスト化する' },
  ]},
  { id: 'disc_5', text: '締め切りが厳しいとき、あなたの対応は？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '優先順位をつけて重要なものに集中' },
    { value: 'I', label: 'チームを鼓舞して乗り越える' },
    { value: 'S', label: '残業してでも全て完遂する' },
    { value: 'C', label: '品質を落とさず効率化を図る' },
  ]},
  { id: 'disc_6', text: '新しいアイデアを思いついたとき、どうしますか？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: 'すぐに実行に移す' },
    { value: 'I', label: '周りに話して反応を見る' },
    { value: 'S', label: 'まず信頼できる人に相談する' },
    { value: 'C', label: 'データで裏付けを取ってから提案' },
  ]},
  { id: 'disc_7', text: 'チームメンバーの仕事が遅れているとき？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '直接指摘して改善を求める' },
    { value: 'I', label: '励ましながらサポートを申し出る' },
    { value: 'S', label: '黙って手伝う' },
    { value: 'C', label: '遅れの原因を一緒に分析する' },
  ]},
  { id: 'disc_8', text: '成功したプロジェクトの後、何を最も喜びますか？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '目標を達成したこと' },
    { value: 'I', label: 'チームで喜びを分かち合うこと' },
    { value: 'S', label: '誰も無理せず完了したこと' },
    { value: 'C', label: '計画通り高品質で仕上がったこと' },
  ]},
  { id: 'disc_9', text: '意見の対立があるとき、あなたの立場は？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '自分の意見を論理的に主張する' },
    { value: 'I', label: '双方の意見を取り入れた案を提案' },
    { value: 'S', label: '対立を避けて妥協点を探る' },
    { value: 'C', label: '客観的データで判断を仰ぐ' },
  ]},
  { id: 'disc_10', text: '仕事の進捗を報告するとき、重視するのは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '結果と達成度' },
    { value: 'I', label: 'プロセスとチームの雰囲気' },
    { value: 'S', label: '安定的な進行状況' },
    { value: 'C', label: '詳細なデータと分析' },
  ]},
  { id: 'disc_11', text: 'リスクのある決断を迫られたとき？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: 'リターンが見合えば果敢に挑戦' },
    { value: 'I', label: '皆の意見を聞いて判断する' },
    { value: 'S', label: '慎重に様子を見る' },
    { value: 'C', label: 'リスク分析を徹底してから判断' },
  ]},
  { id: 'disc_12', text: '新しい環境に配属されたとき、最初にすることは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '成果を出せる仕事を見つける' },
    { value: 'I', label: '周囲との関係構築を優先する' },
    { value: 'S', label: '既存のやり方を理解する' },
    { value: 'C', label: '業務プロセスを把握する' },
  ]},
  { id: 'disc_13', text: 'モチベーションが上がるのはどんなとき？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '難しい目標を達成したとき' },
    { value: 'I', label: '周囲から認められたとき' },
    { value: 'S', label: 'チームが円滑に動いているとき' },
    { value: 'C', label: '完璧な仕事ができたとき' },
  ]},
  { id: 'disc_14', text: '後輩を指導するとき、重視するのは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '結果を出す方法を教える' },
    { value: 'I', label: '楽しく仕事できるよう配慮する' },
    { value: 'S', label: '安心して質問できる雰囲気作り' },
    { value: 'C', label: '正確な手順と根拠を伝える' },
  ]},
  { id: 'disc_15', text: '長期プロジェクトで最も気になるのは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '最終的な成果と評価' },
    { value: 'I', label: 'チームのモチベーション維持' },
    { value: 'S', label: 'メンバーの負担と健康' },
    { value: 'C', label: '計画からのズレと品質' },
  ]},
  { id: 'disc_16', text: 'クライアントへのプレゼンで重視するのは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '結論と提案の明確さ' },
    { value: 'I', label: '相手を惹きつけるストーリー' },
    { value: 'S', label: '丁寧で誠実な説明' },
    { value: 'C', label: 'データと根拠の正確さ' },
  ]},
  { id: 'disc_17', text: '自分の強みを一言で表すと？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '決断力と行動力' },
    { value: 'I', label: '人を巻き込む力' },
    { value: 'S', label: '安定感と信頼性' },
    { value: 'C', label: '正確さと専門性' },
  ]},
  { id: 'disc_18', text: 'ストレスを感じるのはどんな状況？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '進捗が遅い・権限がない' },
    { value: 'I', label: '孤立している・注目されない' },
    { value: 'S', label: '急な変化・対立がある' },
    { value: 'C', label: '曖昧・情報不足・ミスがある' },
  ]},
  { id: 'disc_19', text: '理想の上司像は？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '明確な方向性を示す' },
    { value: 'I', label: '一緒に盛り上がってくれる' },
    { value: 'S', label: '安心して相談できる' },
    { value: 'C', label: '専門的知識が豊富' },
  ]},
  { id: 'disc_20', text: '仕事で最も避けたいことは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '負けること・失敗すること' },
    { value: 'I', label: '無視されること・孤立すること' },
    { value: 'S', label: '対立すること・争うこと' },
    { value: 'C', label: 'ミスすること・不正確なこと' },
  ]},
  { id: 'disc_21', text: 'チームの雰囲気が悪いとき、どうする？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '問題点を直接指摘して改善を促す' },
    { value: 'I', label: 'ムードメーカーとして場を和ませる' },
    { value: 'S', label: '一人一人に声をかけて話を聞く' },
    { value: 'C', label: '問題の構造を分析して提案する' },
  ]},
  { id: 'disc_22', text: '仕事の優先順位をつけるとき、基準は？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '成果へのインパクトの大きさ' },
    { value: 'I', label: '関係者の期待と約束' },
    { value: 'S', label: '既存業務への影響' },
    { value: 'C', label: '論理的な重要度と緊急度' },
  ]},
  { id: 'disc_23', text: '初対面の人と仕事をするとき？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '早く成果を出すことに集中する' },
    { value: 'I', label: '積極的にコミュニケーションを取る' },
    { value: 'S', label: '相手のペースに合わせる' },
    { value: 'C', label: 'まず相手の専門性を確認する' },
  ]},
  { id: 'disc_24', text: '仕事で最も大切にしていることは？', category: 'disc', type: 'forced_choice', options: [
    { value: 'D', label: '結果を出すこと' },
    { value: 'I', label: '人とのつながり' },
    { value: 'S', label: 'チームの調和' },
    { value: 'C', label: '仕事の質と正確さ' },
  ]},
];

// ストレス対処質問 - 12問
const stressQuestions: Question[] = [
  { id: 'stress_1', text: '締め切りが厳しいほど、集中力が高まる', category: 'stress', type: 'likert' },
  { id: 'stress_2', text: '複数の仕事が重なっても、落ち着いて優先順位をつけられる', category: 'stress', type: 'likert' },
  { id: 'stress_3', text: '高い目標を設定されると、やる気が出る', category: 'stress', type: 'likert' },
  { id: 'stress_4', text: '失敗しても、翌日には切り替えて前向きになれる', category: 'stress', type: 'likert' },
  { id: 'stress_5', text: '批判を受けても、建設的に受け止められる', category: 'stress', type: 'likert' },
  { id: 'stress_6', text: '困難な状況でも、「なんとかなる」と思える', category: 'stress', type: 'likert' },
  { id: 'stress_7', text: '感情的になりそうなとき、一度立ち止まって冷静になれる', category: 'stress', type: 'likert' },
  { id: 'stress_8', text: '理不尽なことがあっても、表に出さずに対処できる', category: 'stress', type: 'likert' },
  { id: 'stress_9', text: '不安を感じても、仕事のパフォーマンスに影響しない', category: 'stress', type: 'likert' },
  { id: 'stress_10', text: '予定外の変更があっても、柔軟に対応できる', category: 'stress', type: 'likert' },
  { id: 'stress_11', text: '新しい環境や人にも、すぐに馴染める', category: 'stress', type: 'likert' },
  { id: 'stress_12', text: '曖昧な状況でも、不安なく行動できる', category: 'stress', type: 'likert' },
];

// コミュニケーション（EQ）質問 - 16問
const eqQuestions: Question[] = [
  { id: 'eq_1', text: '自分の強みと弱みを、具体的に説明できる', category: 'eq', type: 'likert' },
  { id: 'eq_2', text: '自分がイライラしているとき、その原因を理解している', category: 'eq', type: 'likert' },
  { id: 'eq_3', text: '自分の言動が周囲にどう影響するか、意識している', category: 'eq', type: 'likert' },
  { id: 'eq_4', text: '自分のパフォーマンスを客観的に評価できる', category: 'eq', type: 'likert' },
  { id: 'eq_5', text: '衝動的に発言せず、考えてから話す', category: 'eq', type: 'likert' },
  { id: 'eq_6', text: '約束や締め切りは必ず守る', category: 'eq', type: 'likert' },
  { id: 'eq_7', text: '困難な状況でも、前向きな態度を維持できる', category: 'eq', type: 'likert' },
  { id: 'eq_8', text: '自分のミスは素直に認め、改善に活かす', category: 'eq', type: 'likert' },
  { id: 'eq_9', text: '相手の表情や声のトーンから、気持ちを察することができる', category: 'eq', type: 'likert' },
  { id: 'eq_10', text: '会議で発言していない人の考えを気にかける', category: 'eq', type: 'likert' },
  { id: 'eq_11', text: '相手の立場に立って物事を考えられる', category: 'eq', type: 'likert' },
  { id: 'eq_12', text: 'チームの雰囲気の変化に敏感に気づく', category: 'eq', type: 'likert' },
  { id: 'eq_13', text: '意見が対立しても、建設的な議論ができる', category: 'eq', type: 'likert' },
  { id: 'eq_14', text: '相手のモチベーションを高めるのが得意だ', category: 'eq', type: 'likert' },
  { id: 'eq_15', text: '初対面の人とも、すぐに信頼関係を築ける', category: 'eq', type: 'likert' },
  { id: 'eq_16', text: 'チーム全体の成果のために、自分の意見を調整できる', category: 'eq', type: 'likert' },
];

// 仕事観（価値観）質問 - 15問
const valuesQuestions: Question[] = [
  { id: 'values_1', text: '高い目標を達成することに、強いやりがいを感じる', category: 'values', type: 'likert' },
  { id: 'values_2', text: '同期や他チームより良い成績を出したい', category: 'values', type: 'likert' },
  { id: 'values_3', text: '数字で成果が見える仕事が好きだ', category: 'values', type: 'likert' },
  { id: 'values_4', text: '長期的に安定した環境で働きたい', category: 'values', type: 'likert' },
  { id: 'values_5', text: '急な変化より、予測可能な仕事が好きだ', category: 'values', type: 'likert' },
  { id: 'values_6', text: '福利厚生や制度が充実している会社が良い', category: 'values', type: 'likert' },
  { id: 'values_7', text: '常に新しいスキルや知識を学びたい', category: 'values', type: 'likert' },
  { id: 'values_8', text: '今の仕事がキャリアにつながるかを重視する', category: 'values', type: 'likert' },
  { id: 'values_9', text: '難しい仕事に挑戦することで成長を感じる', category: 'values', type: 'likert' },
  { id: 'values_10', text: '社会に良い影響を与える仕事がしたい', category: 'values', type: 'likert' },
  { id: 'values_11', text: '人の役に立っていると感じることが重要だ', category: 'values', type: 'likert' },
  { id: 'values_12', text: '会社の理念やビジョンへの共感が大切だ', category: 'values', type: 'likert' },
  { id: 'values_13', text: '自分の裁量で仕事を進めたい', category: 'values', type: 'likert' },
  { id: 'values_14', text: '細かく管理されるより、任せてほしい', category: 'values', type: 'likert' },
  { id: 'values_15', text: '働く時間や場所を自分で決めたい', category: 'values', type: 'likert' },
];

// テンプレート組み立て
const sampleTemplate: AssessmentSection[] = [
  {
    id: 'disc',
    name: '行動スタイル',
    description: '仕事での行動傾向について、最も当てはまるものを選んでください',
    questions: discQuestions,
  },
  {
    id: 'stress',
    name: 'ストレス対処',
    description: '以下の文章について、あなたにどの程度当てはまるか回答してください',
    questions: stressQuestions,
  },
  {
    id: 'eq',
    name: 'コミュニケーション',
    description: '対人関係について、あなたにどの程度当てはまるか回答してください',
    questions: eqQuestions,
  },
  {
    id: 'values',
    name: '仕事観',
    description: '仕事に対する考え方について、あなたにどの程度当てはまるか回答してください',
    questions: valuesQuestions,
  },
];

// LocalStorageキー生成
const getStorageKey = (candidateId: string) =>
  `personality_assessment_${candidateId}`;

// スケルトンUI
function AssessmentSkeleton() {
  return (
    <div data-testid="personality-assessment-skeleton" className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// エラーUI
function AssessmentError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card data-testid="personality-assessment-error">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">診断の読み込みに失敗しました</h3>
        <p className="text-muted-foreground mb-6">
          {error.message || 'エラーが発生しました'}
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  );
}

// 完了UI
function AssessmentCompleted() {
  return (
    <Card data-testid="personality-assessment-completed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2">診断が完了しました</h3>
        <p className="text-muted-foreground">
          ご回答ありがとうございました。
          <br />
          結果は担当者よりご連絡いたします。
        </p>
      </CardContent>
    </Card>
  );
}

// メインコンポーネント
export function PersonalityAssessment({
  candidateId,
  template = sampleTemplate,
  isLoading,
  error,
  onRetry,
  onSubmit,
}: PersonalityAssessmentProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedResponses, setSavedResponses] = useState<Record<string, string> | null>(null);

  // 全質問数
  const totalQuestions = template.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );

  // 現在のセクションと質問
  const currentSection = template[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  // 回答済み質問数
  const answeredCount = Object.keys(responses).length;

  // 進捗率
  const progressPercent = (answeredCount / totalQuestions) * 100;

  // LocalStorageから復元
  useEffect(() => {
    const storageKey = getStorageKey(candidateId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          setSavedResponses(parsed);
          setShowResumeDialog(true);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [candidateId]);

  // 自動保存
  const saveToLocalStorage = useCallback(() => {
    if (Object.keys(responses).length > 0) {
      localStorage.setItem(getStorageKey(candidateId), JSON.stringify(responses));
    }
  }, [candidateId, responses]);

  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  // 再開処理
  const handleResume = () => {
    if (savedResponses) {
      setResponses(savedResponses);
      // 最後の回答位置を特定
      const answeredIds = Object.keys(savedResponses);
      for (let sIdx = 0; sIdx < template.length; sIdx++) {
        for (let qIdx = 0; qIdx < template[sIdx].questions.length; qIdx++) {
          if (!answeredIds.includes(template[sIdx].questions[qIdx].id)) {
            setCurrentSectionIndex(sIdx);
            setCurrentQuestionIndex(qIdx);
            setShowResumeDialog(false);
            return;
          }
        }
      }
    }
    setShowResumeDialog(false);
  };

  // 最初から開始
  const handleStartFresh = () => {
    localStorage.removeItem(getStorageKey(candidateId));
    setResponses({});
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setShowResumeDialog(false);
  };

  // 回答を記録（自動進行付き）
  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // 最後の質問でなければ自動で次へ進む
    const isLast =
      currentSectionIndex === template.length - 1 &&
      currentQuestionIndex === currentSection?.questions.length - 1;

    if (!isLast) {
      setTimeout(() => {
        if (currentQuestionIndex < currentSection.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else if (currentSectionIndex < template.length - 1) {
          setCurrentSectionIndex((prev) => prev + 1);
          setCurrentQuestionIndex(0);
        }
      }, 300);
    }
  };

  // 次の質問へ
  const goToNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSectionIndex < template.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };

  // 前の質問へ
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      setCurrentQuestionIndex(template[currentSectionIndex - 1].questions.length - 1);
    }
  };

  // 送信
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit?.(responses);
      localStorage.removeItem(getStorageKey(candidateId));
      setIsCompleted(true);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 最後の質問かどうか
  const isLastQuestion =
    currentSectionIndex === template.length - 1 &&
    currentQuestionIndex === currentSection?.questions.length - 1;

  // 全問回答済みかどうか
  const isAllAnswered = answeredCount === totalQuestions;

  // 現在の質問番号（全体での位置）
  const currentQuestionNumber =
    template
      .slice(0, currentSectionIndex)
      .reduce((sum, s) => sum + s.questions.length, 0) +
    currentQuestionIndex +
    1;

  // 早期リターンパターン
  if (isLoading) {
    return <AssessmentSkeleton />;
  }

  if (error) {
    return <AssessmentError error={error} onRetry={onRetry} />;
  }

  if (isCompleted) {
    return <AssessmentCompleted />;
  }

  return (
    <>
      {/* 再開確認ダイアログ */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent data-testid="personality-assessment-resume">
          <AlertDialogHeader>
            <AlertDialogTitle>中断した診断があります</AlertDialogTitle>
            <AlertDialogDescription>
              前回の続きから再開しますか？
              {savedResponses && (
                <span className="block mt-2">
                  進捗: {Object.keys(savedResponses).length} / {totalQuestions} 問
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              最初から
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>続きから再開</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 検査メイン */}
      <div data-testid="personality-assessment" className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                適職診断
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentQuestionNumber} / {totalQuestions}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2"
              data-testid="assessment-progress-bar"
            />
            <CardDescription className="mt-4">
              {currentSection?.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 質問 */}
            {currentQuestion && (
              <div
                key={currentQuestion.id}
                data-testid={`personality-question-${currentQuestionNumber}`}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium">{currentQuestion.text}</h3>

                <RadioGroup
                  value={responses[currentQuestion.id] || ''}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {(currentQuestion.options || likertOptions).map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`${currentQuestion.id}_${option.value}`}
                      />
                      <Label
                        htmlFor={`${currentQuestion.id}_${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* ナビゲーション */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                前へ
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isAllAnswered || isSubmitting}
                  data-testid="personality-submit"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  送信
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  disabled={!responses[currentQuestion?.id]}
                >
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
