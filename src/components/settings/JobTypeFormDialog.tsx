"use client"

/**
 * JobTypeFormDialog component
 * Generated with v0: https://v0.app/chat/eUTSF9mn0MH
 * Modified: デザインシステム適用、型定義を@/types/databaseから参照
 *
 * Features:
 * - 職種の新規作成・編集ダイアログ
 * - react-hook-form + zod バリデーション
 * - DISCプロファイル設定スライダー
 * - ストレス耐性・EQ設定
 */

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { JobType } from "@/types/database"

// Zodスキーマ
const jobTypeFormSchema = z.object({
  name: z.string().min(1, "職種名は必須です").max(100, "職種名は100文字以内で入力してください"),
  description: z.string().max(1000, "説明は1000文字以内で入力してください").nullable().optional(),
  is_active: z.boolean(),
  // DISC理想プロファイル (0-100)
  ideal_dominance: z.number().min(0).max(100).nullable(),
  ideal_influence: z.number().min(0).max(100).nullable(),
  ideal_steadiness: z.number().min(0).max(100).nullable(),
  ideal_conscientiousness: z.number().min(0).max(100).nullable(),
  // 重み (0-1)
  weight_dominance: z.number().min(0).max(1),
  weight_influence: z.number().min(0).max(1),
  weight_steadiness: z.number().min(0).max(1),
  weight_conscientiousness: z.number().min(0).max(1),
  // ストレス耐性
  ideal_stress: z.number().min(0).max(100).nullable(),
  weight_stress: z.number().min(0).max(1),
  // EQ
  ideal_eq: z.number().min(0).max(100).nullable(),
  weight_eq: z.number().min(0).max(1),
})

export type JobTypeFormData = z.infer<typeof jobTypeFormSchema>

// Props型定義
interface JobTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobType?: JobType | null
  onSubmit: (data: JobTypeFormData) => Promise<void>
  isSubmitting?: boolean
}

export function JobTypeFormDialog({
  open,
  onOpenChange,
  jobType = null,
  onSubmit,
  isSubmitting = false,
}: JobTypeFormDialogProps) {
  const isEditing = !!jobType

  // フォーム初期化
  const form = useForm<JobTypeFormData>({
    resolver: zodResolver(jobTypeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      ideal_dominance: 50,
      ideal_influence: 50,
      ideal_steadiness: 50,
      ideal_conscientiousness: 50,
      weight_dominance: 0.5,
      weight_influence: 0.5,
      weight_steadiness: 0.5,
      weight_conscientiousness: 0.5,
      ideal_stress: 50,
      weight_stress: 0.5,
      ideal_eq: 50,
      weight_eq: 0.5,
    },
  })

  // 編集時にフォームをリセット
  useEffect(() => {
    if (open) {
      if (jobType) {
        form.reset({
          name: jobType.name,
          description: jobType.description || "",
          is_active: jobType.is_active,
          ideal_dominance: jobType.ideal_dominance ?? 50,
          ideal_influence: jobType.ideal_influence ?? 50,
          ideal_steadiness: jobType.ideal_steadiness ?? 50,
          ideal_conscientiousness: jobType.ideal_conscientiousness ?? 50,
          weight_dominance: jobType.weight_dominance ?? 0.5,
          weight_influence: jobType.weight_influence ?? 0.5,
          weight_steadiness: jobType.weight_steadiness ?? 0.5,
          weight_conscientiousness: jobType.weight_conscientiousness ?? 0.5,
          ideal_stress: jobType.ideal_stress ?? 50,
          weight_stress: jobType.weight_stress ?? 0.5,
          ideal_eq: jobType.ideal_eq ?? 50,
          weight_eq: jobType.weight_eq ?? 0.5,
        })
      } else {
        form.reset({
          name: "",
          description: "",
          is_active: true,
          ideal_dominance: 50,
          ideal_influence: 50,
          ideal_steadiness: 50,
          ideal_conscientiousness: 50,
          weight_dominance: 0.5,
          weight_influence: 0.5,
          weight_steadiness: 0.5,
          weight_conscientiousness: 0.5,
          ideal_stress: 50,
          weight_stress: 0.5,
          ideal_eq: 50,
          weight_eq: 0.5,
        })
      }
    }
  }, [open, jobType, form])

  // フォーム送信
  const handleSubmit = async (data: JobTypeFormData) => {
    await onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="job-type-form-dialog">
        <DialogHeader>
          <DialogTitle>{isEditing ? "職種を編集" : "職種を追加"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "職種の情報を編集します。すべての項目を確認して保存してください。"
              : "新しい職種を追加します。必要な情報を入力してください。"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 基本情報セクション */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">基本情報</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      職種名 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例: エンジニア、営業職"
                        {...field}
                        data-testid="job-type-name-input"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="職種の説明を入力してください"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                        disabled={isSubmitting}
                        data-testid="job-type-description-input"
                      />
                    </FormControl>
                    <FormDescription>最大1000文字まで入力できます</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">有効/無効</FormLabel>
                      <FormDescription>この職種を有効にするかどうかを設定します</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        data-testid="job-type-active-switch"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* DISCプロファイルセクション */}
            <Accordion type="single" collapsible className="w-full" defaultValue="disc">
              <AccordionItem value="disc">
                <AccordionTrigger>DISCプロファイル設定</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* 支配性 (Dominance) */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ideal_dominance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>支配性 (D)</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>結果志向、意思決定、リスクテイクの度合い</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight_dominance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm text-muted-foreground">重み</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value.toFixed(2)}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 影響力 (Influence) */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ideal_influence"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>影響力 (I)</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>人との関わり、コミュニケーション、説得力</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight_influence"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm text-muted-foreground">重み</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value.toFixed(2)}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 安定性 (Steadiness) */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ideal_steadiness"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>安定性 (S)</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>一貫性、チームワーク、忍耐力</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight_steadiness"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm text-muted-foreground">重み</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value.toFixed(2)}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 慎重性 (Conscientiousness) */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ideal_conscientiousness"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>慎重性 (C)</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>正確性、品質志向、分析的思考</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight_conscientiousness"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm text-muted-foreground">重み</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value.toFixed(2)}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="stress-eq">
                <AccordionTrigger>ストレス耐性・EQ設定</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* ストレス耐性 */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ideal_stress"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>ストレス耐性</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>プレッシャーへの対処能力、回復力</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight_stress"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm text-muted-foreground">重み</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value.toFixed(2)}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* EQ（感情的知性） */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ideal_eq"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>EQ（感情的知性）</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 50]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>自己認識、共感力、対人関係スキル</FormDescription>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weight_eq"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm text-muted-foreground">重み</FormLabel>
                            <span className="text-sm font-medium tabular-nums">{field.value.toFixed(2)}</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-testid="job-type-cancel-button"
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="job-type-submit-button">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "更新" : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
