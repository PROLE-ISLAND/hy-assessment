// =====================================================
// Prompt Test API
// Test a prompt with sample data
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';
import type { PromptTemplate } from '@/types/database';

// Sample test data for analysis
const SAMPLE_TEST_DATA = {
  candidatePosition: 'ソフトウェアエンジニア',
  domainScores: {
    GOV: { percentage: 72, riskLevel: 'low' },
    CONFLICT: { percentage: 65, riskLevel: 'low' },
    REL: { percentage: 78, riskLevel: 'low' },
    COG: { percentage: 35, riskLevel: 'low' },
    WORK: { percentage: 68, riskLevel: 'low' },
    VALID: { percentage: 85, riskLevel: 'low' },
  },
  overallScore: 71,
  sjtScores: { percentage: 75 },
  sjtAnswers: {
    SJT01: 'A',
    SJT02: 'B',
    SJT03: 'A',
  },
  freeTextAnswer: '私は常にチームの協力を大切にし、問題解決に向けて積極的に取り組みます。',
  validityFlags: {
    isValid: true,
    details: [],
  },
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const adminSupabase = createAdminClient();

    // Get the prompt
    const { data: prompt, error: promptError } = await adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // Get custom test data if provided
    const body = await request.json().catch(() => ({}));
    const testData = body.testData || SAMPLE_TEST_DATA;

    // Build user prompt based on prompt key
    let userPrompt = '';
    if (prompt.key === 'system') {
      // For system prompts, we use a simple test message
      userPrompt = buildTestUserPrompt(testData);
    } else {
      userPrompt = prompt.content;
    }

    // Determine which content to use as system vs user
    const systemContent = prompt.key === 'system' ? prompt.content : getDefaultSystemPrompt();
    const userContent = prompt.key === 'system' ? userPrompt : prompt.content;

    // Call OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API キーが設定されていません' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: prompt.model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: prompt.max_tokens,
      temperature: prompt.temperature,
    });
    const endTime = Date.now();

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens ?? 0;

    // Try to parse as JSON
    let parsedOutput = null;
    let parseError = null;
    try {
      if (content) {
        parsedOutput = JSON.parse(content);
      }
    } catch {
      parseError = 'JSON解析に失敗しました';
    }

    return NextResponse.json({
      success: true,
      result: {
        rawOutput: content,
        parsedOutput,
        parseError,
        tokensUsed,
        latencyMs: endTime - startTime,
        model: response.model,
      },
      testData,
    });
  } catch (error) {
    console.error('Prompt test error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'テスト実行中にエラーが発生しました',
        success: false,
      },
      { status: 500 }
    );
  }
}

function buildTestUserPrompt(testData: typeof SAMPLE_TEST_DATA): string {
  const domainScoresText = Object.entries(testData.domainScores)
    .map(([domain, score]) => `- ${domain}: ${score.percentage}%（${score.riskLevel === 'low' ? '良好' : '注意'}）`)
    .join('\n');

  const sjtAnswersText = Object.entries(testData.sjtAnswers)
    .map(([id, answer]) => `- ${id}: 選択肢${answer}`)
    .join('\n');

  return `## 候補者情報
応募職種: ${testData.candidatePosition}

## ドメイン別スコア
${domainScoresText}

## 総合スコア
${testData.overallScore}%

## SJT回答
${sjtAnswersText}
SJT総合スコア: ${testData.sjtScores.percentage}%

## 自由記述回答
${testData.freeTextAnswer}

## 妥当性: ${testData.validityFlags.isValid ? '問題なし' : '注意が必要'}

上記の検査結果を分析し、この候補者の強み、注意点、総合評価、採用推奨事項をJSON形式で出力してください。`;
}

function getDefaultSystemPrompt(): string {
  return `あなたは採用適性検査の分析専門家です。
候補者の検査結果から、採用担当者向けの分析レポートを生成します。

## 出力フォーマット（JSON）
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["注意点1", "注意点2", "注意点3"],
  "summary": "総合評価（200-300文字）",
  "recommendation": "採用判断への推奨事項（100-200文字）"
}`;
}
