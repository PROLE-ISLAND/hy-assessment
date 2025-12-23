// =====================================================
// Design System Preview Page
// Displays all design tokens and color palettes
// For internal reference and consistency checking
// =====================================================

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  chartColors,
  chartPrimaryColor,
  chartConfig,
  scoreThresholds,
  scoreColors,
  assessmentStatusConfig,
  candidateStatusConfig,
  judgmentConfig,
  riskLevelConfig,
  scoreDistributionColors,
  pipelineColors,
  selectionColors,
} from '@/lib/design-system';
import type { AssessmentStatus } from '@/types/database';

// Color swatch component
function ColorSwatch({
  color,
  label,
  description,
}: {
  color: string;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-lg border shadow-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="font-mono text-sm font-medium">{color}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// Glassmorphism preview component
function GlassPreview() {
  return (
    <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass-card p-6 text-center">
          <p className="text-lg font-semibold">Glassmorphism Card</p>
          <p className="text-sm text-muted-foreground mt-1">
            backdrop-blur + semi-transparent
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const assessmentStatuses: AssessmentStatus[] = ['pending', 'in_progress', 'completed', 'expired'];
  const candidateStatuses = ['no_assessment', 'pending', 'in_progress', 'completed', 'analyzed'] as const;
  const judgmentLevels = ['recommended', 'consider', 'caution'] as const;
  const riskLevels = ['low', 'medium', 'high'] as const;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">
          Color tokens and styling references for consistent UI
        </p>
      </div>

      {/* Glassmorphism Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Glassmorphism</CardTitle>
          <CardDescription>
            Semi-transparent backgrounds with backdrop blur effects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlassPreview />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg border">
              <p className="font-medium">.glass</p>
              <p className="text-muted-foreground text-xs">Basic glass effect</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium">.glass-card</p>
              <p className="text-muted-foreground text-xs">Card with glass effect</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium">.glass-tooltip</p>
              <p className="text-muted-foreground text-xs">Tooltip glass style</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium">.glass-chart</p>
              <p className="text-muted-foreground text-xs">Chart container glass</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Colors</CardTitle>
          <CardDescription>
            Primary color palette for charts and data visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Primary Color */}
            <div>
              <h3 className="text-sm font-medium mb-3">Primary Chart Color</h3>
              <ColorSwatch
                color={chartPrimaryColor.stroke}
                label="Indigo-400"
                description="Used for single-series charts (radar, etc.)"
              />
            </div>

            {/* Multi-series Colors */}
            <div>
              <h3 className="text-sm font-medium mb-3">Multi-series Palette</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chartColors.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color.stroke}
                    label={['Indigo-400', 'Teal-400', 'Orange-400', 'Pink-400', 'Violet-400'][index]}
                    description={`Chart series ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Chart Config */}
            <div>
              <h3 className="text-sm font-medium mb-3">Chart Configuration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg border">
                  <p className="text-muted-foreground">Fill Opacity</p>
                  <p className="font-mono font-medium">{chartConfig.fillOpacity}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-muted-foreground">Stroke Width</p>
                  <p className="font-mono font-medium">{chartConfig.strokeWidth}px</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-muted-foreground">Stroke Opacity</p>
                  <p className="font-mono font-medium">{chartConfig.strokeOpacity}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-muted-foreground">Grid Color</p>
                  <p className="font-mono font-medium text-xs">{chartConfig.gridColor}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution Colors</CardTitle>
          <CardDescription>
            Color coding for score ranges in histograms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(scoreDistributionColors).map(([range, color]) => (
              <ColorSwatch
                key={range}
                color={color}
                label={range}
                description="Score range"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score Colors with Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Score Levels</CardTitle>
          <CardDescription>
            Color coding based on score thresholds (Excellent: {scoreThresholds.excellent}%+, Warning: {scoreThresholds.warning}%+)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['excellent', 'warning', 'danger'] as const).map((level) => (
              <div key={level} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: scoreColors[level].hex }}
                  />
                  <span className="font-medium capitalize">{level}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hex</span>
                    <span className="font-mono">{scoreColors[level].hex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Text Class</span>
                    <span className="font-mono text-xs">{scoreColors[level].text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Background Class</span>
                    <span className="font-mono text-xs">{scoreColors[level].bg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Status</CardTitle>
          <CardDescription>
            Status indicators for assessment progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {assessmentStatuses.map((status) => (
              <Badge
                key={status}
                className={assessmentStatusConfig[status].className}
                variant="secondary"
              >
                {assessmentStatusConfig[status].label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Status */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Status</CardTitle>
          <CardDescription>
            Status indicators for candidate progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {candidateStatuses.map((status) => (
              <Badge
                key={status}
                className={candidateStatusConfig[status].className}
                variant="secondary"
              >
                {candidateStatusConfig[status].label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Judgment Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Judgment Levels</CardTitle>
          <CardDescription>
            Assessment outcome recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {judgmentLevels.map((level) => {
              const config = judgmentConfig[level];
              const Icon = config.icon;
              return (
                <Badge
                  key={level}
                  className={config.badgeClass}
                  variant="secondary"
                >
                  <Icon className={`h-3 w-3 mr-1 ${config.iconClass}`} />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Colors</CardTitle>
          <CardDescription>
            Soft, pastel colors for recruitment pipeline funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(pipelineColors).map(([key, className]) => (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-12 h-6 rounded ${className}`} />
                <div>
                  <p className="font-mono text-sm">{className}</p>
                  <p className="text-xs text-muted-foreground">
                    {key === 'noAssessment' && '未検査'}
                    {key === 'inProgress' && '回答中'}
                    {key === 'completed' && '完了'}
                    {key === 'analyzed' && '分析済'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Levels</CardTitle>
          <CardDescription>
            Risk indicators for domain scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {riskLevels.map((level) => (
                <Badge
                  key={level}
                  className={riskLevelConfig[level].className}
                  variant="secondary"
                >
                  {riskLevelConfig[level].label}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Progress Colors:</span>
              {riskLevels.map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <div className={`w-16 h-2 rounded-full ${riskLevelConfig[level].progressColor}`} />
                  <span className="text-xs text-muted-foreground">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Selection Colors</CardTitle>
          <CardDescription>
            Interactive list item selection states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className={`p-4 rounded-lg border ${selectionColors.selected.border} ${selectionColors.selected.bg}`}>
                <p className="font-medium">Selected State</p>
                <p className="text-sm text-muted-foreground">border-indigo-300 + bg-indigo-50/50</p>
              </div>
              <div className={`p-4 rounded-lg border ${selectionColors.hover.bg}`}>
                <p className="font-medium">Hover State</p>
                <p className="text-sm text-muted-foreground">hover:bg-muted/50</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guide</CardTitle>
          <CardDescription>
            How to import and use design tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre>{`import {
  // Chart colors
  chartColors,
  chartPrimaryColor,
  chartConfig,

  // Score colors
  scoreThresholds,
  scoreColors,
  getScoreLevel,
  getScoreColor,
  getScoreTextClass,

  // Status configs
  assessmentStatusConfig,
  candidateStatusConfig,
  judgmentConfig,
  riskLevelConfig,

  // Distribution & Pipeline colors
  scoreDistributionColors,
  pipelineColors,

  // Interactive UI colors
  selectionColors,

  // Chart theme
  chartTheme,
  chartSizeConfig,
} from '@/lib/design-system';`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
