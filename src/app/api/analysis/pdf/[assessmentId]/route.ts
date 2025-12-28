// =====================================================
// PDF Export API
// GET /api/analysis/pdf/[assessmentId]
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generatePDF, type ReportData } from '@/lib/pdf/report-generator';
import { calculateOverallScore } from '@/lib/analysis/judgment';
import type { AssessmentStatus } from '@/types/database';

// Vercel serverless function config for PDF generation
export const maxDuration = 90; // 90 seconds timeout for large reports
export const dynamic = 'force-dynamic';

// Type for assessment with relations
interface AssessmentWithAnalysis {
  id: string;
  status: AssessmentStatus;
  completed_at: string | null;
  candidates: {
    position: string;
    persons: {
      name: string;
      email: string;
    };
  };
  assessment_templates: {
    name: string;
  };
  ai_analyses: Array<{
    version: number;
    scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    summary: string | null;
    recommendation: string | null;
    model_version: string;
    prompt_version: string;
    analyzed_at: string;
    is_latest: boolean;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = createAdminClient();

    // Parse version query parameter
    const searchParams = request.nextUrl.searchParams;
    const versionParam = searchParams.get('version');
    const requestedVersion = versionParam ? parseInt(versionParam, 10) : null;

    // Get assessment with analysis
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select(`
        id,
        status,
        completed_at,
        candidates!inner(
          position,
          persons!inner(
            name,
            email
          )
        ),
        assessment_templates!inner(
          name
        ),
        ai_analyses(
          version,
          scores,
          strengths,
          weaknesses,
          summary,
          recommendation,
          model_version,
          prompt_version,
          analyzed_at,
          is_latest
        )
      `)
      .eq('id', assessmentId)
      .is('deleted_at', null)
      .single<AssessmentWithAnalysis>();

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Find the requested analysis version or latest
    let targetAnalysis: AssessmentWithAnalysis['ai_analyses'][0] | undefined;

    if (requestedVersion !== null && !isNaN(requestedVersion)) {
      // Find specific version
      targetAnalysis = assessment.ai_analyses?.find((a) => a.version === requestedVersion);
      if (!targetAnalysis) {
        return NextResponse.json(
          { error: `Analysis version ${requestedVersion} not found` },
          { status: 404 }
        );
      }
    } else {
      // Find latest version
      targetAnalysis = assessment.ai_analyses?.find((a) => a.is_latest);
    }

    if (!targetAnalysis) {
      return NextResponse.json(
        { error: 'Analysis not found. Please run analysis first.' },
        { status: 400 }
      );
    }

    // Prepare report data
    const reportData: ReportData = {
      candidateName: assessment.candidates?.persons?.name || '不明',
      candidateEmail: assessment.candidates?.persons?.email || '',
      position: assessment.candidates?.position || '不明',
      templateName: assessment.assessment_templates?.name || 'GFD-Gate',
      completedAt: assessment.completed_at || new Date().toISOString(),
      analyzedAt: targetAnalysis.analyzed_at,
      overallScore: calculateOverallScore(targetAnalysis.scores),
      scores: targetAnalysis.scores,
      strengths: targetAnalysis.strengths,
      weaknesses: targetAnalysis.weaknesses,
      summary: targetAnalysis.summary,
      recommendation: targetAnalysis.recommendation,
    };

    // Generate PDF
    const pdfBuffer = await generatePDF(reportData);

    // Generate filename with version info
    const candidateName = assessment.candidates?.persons?.name || 'candidate';
    const date = new Date().toISOString().split('T')[0];
    const versionSuffix = targetAnalysis.is_latest ? '' : `_v${targetAnalysis.version}`;
    const filename = `assessment_report_${candidateName}_${date}${versionSuffix}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Return PDF
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
