"use client"

/**
 * JobTypeList component
 * Generated with v0: https://v0.app/chat/eUTSF9mn0MH
 * Modified: デザインシステム適用、型定義を@/types/databaseから参照
 *
 * Variants:
 * - Default: 正常データ表示
 * - Loading: スケルトンUI
 * - Empty: データなし状態
 * - Error: エラー + 再試行
 */

import { useState } from "react"
import { Plus, Search, MoreVertical, Pencil, Trash2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { JobType } from "@/types/database"

// Props型定義
interface JobTypeListProps {
  data?: JobType[]
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  onAdd?: () => void
  onEdit?: (jobType: JobType) => void
  onDelete?: (jobType: JobType) => void
}

// スケルトンUI（Loading状態）
function JobTypeListSkeleton() {
  return (
    <div className="w-full space-y-6" data-testid="job-type-list-skeleton">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead className="w-[80px]">
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Empty状態
function JobTypeListEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="w-full" data-testid="job-type-list-empty">
      <Card>
        <CardHeader>
          <CardTitle>職種一覧</CardTitle>
          <CardDescription>組織の職種マスターを管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">職種が登録されていません</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              最初の職種を追加して、組織の職種マスターの管理を始めましょう。
            </p>
            {onAdd && (
              <Button onClick={onAdd} data-testid="job-type-add-button">
                <Plus className="h-4 w-4 mr-2" />
                新規追加
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Error状態
function JobTypeListError({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <div className="w-full" data-testid="job-type-list-error">
      <Card>
        <CardHeader>
          <CardTitle>職種一覧</CardTitle>
          <CardDescription>組織の職種マスターを管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">読み込みに失敗しました</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {error?.message || "データの読み込み中にエラーが発生しました。"}
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" data-testid="job-type-retry-button">
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Default状態（正常データ表示）
function JobTypeListDefault({
  data,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: JobType[]
  onAdd?: () => void
  onEdit?: (jobType: JobType) => void
  onDelete?: (jobType: JobType) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(null)

  // 検索フィルタリング
  const filteredData = data.filter((jobType) => jobType.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // 説明文の省略（最大50文字）
  const truncateDescription = (text: string | null) => {
    if (!text) return "—"
    return text.length > 50 ? `${text.slice(0, 50)}...` : text
  }

  // 削除確認ダイアログを開く
  const handleDeleteClick = (jobType: JobType) => {
    setSelectedJobType(jobType)
    setDeleteDialogOpen(true)
  }

  // 削除実行
  const handleDeleteConfirm = () => {
    if (selectedJobType && onDelete) {
      onDelete(selectedJobType)
    }
    setDeleteDialogOpen(false)
    setSelectedJobType(null)
  }

  return (
    <>
      <div className="w-full" data-testid="job-type-list">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>職種一覧</CardTitle>
                <CardDescription>組織の職種マスターを管理します</CardDescription>
              </div>
              {onAdd && (
                <Button onClick={onAdd} data-testid="job-type-add-button">
                  <Plus className="h-4 w-4 mr-2" />
                  新規追加
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 検索ボックス */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="職種名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="job-type-search-input"
              />
            </div>

            {/* テーブル */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>職種名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        検索結果がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((jobType) => (
                      <TableRow key={jobType.id} className="hover:bg-muted/50 transition-colors" data-testid={`job-type-row-${jobType.id}`}>
                        <TableCell className="font-medium">{jobType.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {truncateDescription(jobType.description)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={jobType.is_active ? "default" : "secondary"}
                            className={
                              jobType.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {jobType.is_active ? "有効" : "無効"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`job-type-menu-${jobType.id}`}>
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">操作メニューを開く</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(jobType)} data-testid={`job-type-edit-${jobType.id}`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  編集
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(jobType)}
                                  className="text-destructive focus:text-destructive"
                                  data-testid={`job-type-delete-${jobType.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  削除
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="job-type-delete-dialog">
          <DialogHeader>
            <DialogTitle>職種の削除</DialogTitle>
            <DialogDescription>本当にこの職種を削除しますか？この操作は取り消せません。</DialogDescription>
          </DialogHeader>
          {selectedJobType && (
            <div className="py-4">
              <p className="text-sm">
                <span className="font-semibold">職種名: </span>
                {selectedJobType.name}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="job-type-cancel-delete">
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} data-testid="job-type-confirm-delete">
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// メインコンポーネント（早期リターンパターン）
export function JobTypeList({ data, isLoading, error, onRetry, onAdd, onEdit, onDelete }: JobTypeListProps) {
  if (isLoading) return <JobTypeListSkeleton />
  if (error) return <JobTypeListError error={error} onRetry={onRetry} />
  if (!data || data.length === 0) return <JobTypeListEmpty onAdd={onAdd} />
  return <JobTypeListDefault data={data} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />
}
