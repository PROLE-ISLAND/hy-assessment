// Run AI analysis for completed assessments
import { createClient } from '@supabase/supabase-js';
import { calculateScores } from '../src/lib/analysis/scoring-engine';
import { analyzeAssessmentMock } from '../src/lib/analysis/ai-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runAnalysis(assessmentId: string) {
  console.log('分析開始:', assessmentId);

  // Get assessment
  const { data: assessment, error: aErr } = await supabase
    .from('assessments')
    .select('*, candidates!inner(*, persons!inner(*))')
    .eq('id', assessmentId)
    .single();

  if (aErr || !assessment) {
    console.log('Assessment取得エラー:', aErr?.message);
    return;
  }
  console.log('Assessment status:', assessment.status);

  // Get responses
  const { data: responses, error: rErr } = await supabase
    .from('responses')
    .select('question_id, answer')
    .eq('assessment_id', assessmentId);

  if (rErr) {
    console.log('Responses取得エラー:', rErr.message);
    return;
  }
  console.log('Responses:', responses?.length || 0, '件');

  // Calculate scores - pass ResponseData[] directly
  const responseData = (responses || []).map(r => ({
    question_id: r.question_id,
    answer: r.answer,
  }));

  const scoringResult = calculateScores(responseData);
  console.log('Scores:', scoringResult.domainScores);

  // Run mock analysis - pass responses and position
  const analysisResult = await analyzeAssessmentMock({
    responses: responseData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    candidatePosition: (assessment as any).candidates?.position || 'Unknown',
  });

  console.log('Analysis completed');

  // Extract scores as Record<string, number> for DB storage
  const scoresForDb: Record<string, number> = {};
  for (const [key, value] of Object.entries(analysisResult.scoringResult.domainScores)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scoresForDb[key] = (value as any).percentage;
  }

  // Save to database
  const { data: saved, error: sErr } = await supabase
    .from('ai_analyses')
    .insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      organization_id: (assessment as any).organization_id,
      assessment_id: assessmentId,
      scores: scoresForDb,
      strengths: analysisResult.aiAnalysis.strengths,
      weaknesses: analysisResult.aiAnalysis.weaknesses,
      summary: analysisResult.aiAnalysis.summary,
      recommendation: analysisResult.aiAnalysis.recommendation,
      model_version: analysisResult.modelVersion,
      prompt_version: analysisResult.promptVersion,
      tokens_used: analysisResult.tokensUsed,
      version: 1,
      is_latest: true,
      analyzed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sErr) {
    console.log('保存エラー:', sErr.message);
  } else {
    console.log('✅ 分析完了・保存しました！', saved.id);
  }
}

// 引数からassessmentIdを取得、なければ完了済みを全て分析
async function main() {
  const assessmentId = process.argv[2];

  if (assessmentId) {
    await runAnalysis(assessmentId);
  } else {
    // 完了済みで未分析のassessmentを全て取得
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('status', 'completed')
      .is('deleted_at', null);

    console.log('完了済みassessment:', assessments?.length || 0, '件');

    for (const a of assessments || []) {
      // 既に分析済みかチェック
      const { data: existing } = await supabase
        .from('ai_analyses')
        .select('id')
        .eq('assessment_id', a.id)
        .eq('is_latest', true)
        .single();

      if (!existing) {
        await runAnalysis(a.id);
      } else {
        console.log('既に分析済み:', a.id);
      }
    }
  }
}

main();
