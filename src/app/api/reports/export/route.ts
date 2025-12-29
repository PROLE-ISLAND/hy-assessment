// =====================================================
// Reports Export API
// GET /api/reports/export?type=candidates|domains|positions
// Returns CSV data for download
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { DOMAIN_LABELS } from '@/lib/analysis';
import { POSITIONS } from '@/lib/constants/positions';
import {
  generateCandidateCSV,
  generateDomainCSV,
  generatePositionCSV,
  getExportFilename,
  type CandidateExportData,
  type DomainExportData,
  type PositionExportData,
} from '@/lib/export/csv-generator';

// Types for database responses
interface CandidateAnalysis {
  scores: Record<string, number>;
  judgment: string;
  created_at: string;
  assessments: {
    candidates: {
      name: string;
      email: string;
      position: string;
      desired_positions: string[] | null;
    };
  };
}

interface AnalysisWithCandidate {
  scores: Record<string, number>;
  assessments: {
    candidates: {
      position: string;
      desired_positions: string[] | null;
    };
  };
}

// Helper to calculate average
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}

// Get judgment label in Japanese
function getJudgmentLabel(judgment: string): string {
  const labels: Record<string, string> = {
    excellent: '優秀',
    good: '良好',
    acceptable: '要確認',
    caution: '注意',
    concern: '要注意',
  };
  return labels[judgment] || judgment;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's organization
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();

    if (!dbUser?.organization_id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get export type from query
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'candidates';

    // 4. Fetch data based on type
    let csvContent: string;
    let filename: string;

    if (exportType === 'candidates') {
      // Fetch candidate data
      // Use explicit foreign key names to avoid ambiguous relationship resolution
      const { data: analyses, error } = await adminSupabase
        .from('ai_analyses')
        .select(`
          scores,
          judgment,
          created_at,
          assessments!ai_analyses_assessment_id_fkey!inner(
            candidates!assessments_candidate_id_fkey!inner(
              name,
              email,
              position,
              desired_positions
            )
          )
        `)
        .eq('organization_id', dbUser.organization_id)
        .eq('is_latest', true)
        .order('created_at', { ascending: false })
        .returns<CandidateAnalysis[]>();

      if (error) {
        throw new Error(`Failed to fetch candidates: ${error.message}`);
      }

      const candidates: CandidateExportData[] = (analyses || []).map(a => {
        const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
        const total = scorableDomains.reduce((sum, d) => sum + (a.scores[d] || 0), 0);
        const overallScore = Math.round(total / scorableDomains.length);

        const positions = a.assessments.candidates.desired_positions ||
          (a.assessments.candidates.position ? [a.assessments.candidates.position] : []);
        const positionLabels = positions.map(p => {
          const pos = POSITIONS.find(pos => pos.value === p);
          return pos?.label || p;
        });

        return {
          name: a.assessments.candidates.name,
          email: a.assessments.candidates.email,
          position: positionLabels.join(', '),
          overallScore,
          judgment: getJudgmentLabel(a.judgment),
          completedAt: new Date(a.created_at).toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
          }),
        };
      });

      csvContent = generateCandidateCSV(candidates);
      filename = getExportFilename('candidates');

    } else if (exportType === 'domains') {
      // Fetch domain analysis data
      const { data: analyses, error } = await adminSupabase
        .from('ai_analyses')
        .select('scores')
        .eq('organization_id', dbUser.organization_id)
        .eq('is_latest', true)
        .returns<{ scores: Record<string, number> }[]>();

      if (error) {
        throw new Error(`Failed to fetch domain data: ${error.message}`);
      }

      const domains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'] as const;
      const domainData: DomainExportData[] = domains.map(domain => {
        const scores = (analyses || [])
          .map(a => a.scores[domain])
          .filter(s => s !== undefined);

        return {
          domain,
          domainLabel: DOMAIN_LABELS[domain],
          averageScore: average(scores),
          sampleCount: scores.length,
        };
      });

      csvContent = generateDomainCSV(domainData);
      filename = getExportFilename('domain_analysis');

    } else if (exportType === 'positions') {
      // Fetch position analysis data
      // Use explicit foreign key names to avoid ambiguous relationship resolution
      const { data: analyses, error } = await adminSupabase
        .from('ai_analyses')
        .select(`
          scores,
          assessments!ai_analyses_assessment_id_fkey!inner(
            candidates!assessments_candidate_id_fkey!inner(
              position,
              desired_positions
            )
          )
        `)
        .eq('organization_id', dbUser.organization_id)
        .eq('is_latest', true)
        .returns<AnalysisWithCandidate[]>();

      if (error) {
        throw new Error(`Failed to fetch position data: ${error.message}`);
      }

      const positionStats: Record<string, { count: number; scores: number[] }> = {};

      (analyses || []).forEach(analysis => {
        const positions = analysis.assessments.candidates.desired_positions ||
          (analysis.assessments.candidates.position ? [analysis.assessments.candidates.position] : []);

        const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
        const total = scorableDomains.reduce((sum, d) => sum + (analysis.scores[d] || 0), 0);
        const overall = Math.round(total / scorableDomains.length);

        positions.forEach(pos => {
          if (!positionStats[pos]) {
            positionStats[pos] = { count: 0, scores: [] };
          }
          positionStats[pos].count++;
          positionStats[pos].scores.push(overall);
        });
      });

      const positionData: PositionExportData[] = Object.entries(positionStats)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([position, stat]) => {
          const posInfo = POSITIONS.find(p => p.value === position);
          return {
            position,
            positionLabel: posInfo?.label || position,
            candidateCount: stat.count,
            averageScore: average(stat.scores),
          };
        });

      csvContent = generatePositionCSV(positionData);
      filename = getExportFilename('position_analysis');

    } else {
      return NextResponse.json(
        { error: 'Invalid export type. Use: candidates, domains, or positions' },
        { status: 400 }
      );
    }

    // 5. Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
