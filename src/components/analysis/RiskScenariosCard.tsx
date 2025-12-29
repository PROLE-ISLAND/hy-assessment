'use client';

// =====================================================
// Risk Scenarios Card Component
// Displays structured risk scenarios for accident prevention
// =====================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { stateColors } from '@/lib/design-system';
import type { RiskScenario } from '@/types/database';

interface RiskScenariosCardProps {
  scenarios: RiskScenario[];
}

export function RiskScenariosCard({ scenarios }: RiskScenariosCardProps) {
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
          リスクシナリオ
        </CardTitle>
        <CardDescription>
          事故防止のための、状況別リスク予測と対策
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {scenarios.map((scenario, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              {/* Condition */}
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${stateColors.warning.light.bg} ${stateColors.warning.dark.bg}`}>
                  <Activity className={`h-4 w-4 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">トリガー条件</div>
                  <p className="text-sm font-medium">{scenario.condition}</p>
                </div>
              </div>

              {/* Symptom & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                <div className={`rounded-lg p-3 ${stateColors.error.light.bg} ${stateColors.error.dark.bg}`}>
                  <div className={`text-xs font-medium mb-1 ${stateColors.error.light.text} ${stateColors.error.dark.text}`}>現れる症状</div>
                  <p className={`text-sm ${stateColors.error.light.text} ${stateColors.error.dark.text}`}>{scenario.symptom}</p>
                </div>
                <div className={`rounded-lg p-3 ${stateColors.warning.light.bg} ${stateColors.warning.dark.bg}`}>
                  <div className={`text-xs font-medium mb-1 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`}>業務への影響</div>
                  <p className={`text-sm ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`}>{scenario.impact}</p>
                </div>
              </div>

              {/* Prevention */}
              <div className="flex items-start gap-3 pl-11">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${stateColors.success.light.bg} ${stateColors.success.dark.bg}`}>
                  <Shield className={`h-3 w-3 ${stateColors.success.light.text} ${stateColors.success.dark.text}`} />
                </div>
                <div>
                  <div className={`text-xs font-medium mb-1 ${stateColors.success.light.text} ${stateColors.success.dark.text}`}>予防策・対処法</div>
                  <p className="text-sm">{scenario.prevention}</p>
                </div>
              </div>

              {/* Risk Environments */}
              {scenario.risk_environment && scenario.risk_environment.length > 0 && (
                <div className="pl-11">
                  <div className="text-xs font-medium text-muted-foreground mb-2">摩擦が出やすい環境</div>
                  <div className="flex flex-wrap gap-2">
                    {scenario.risk_environment.map((env, envIndex) => (
                      <Badge key={envIndex} variant="outline" className="text-xs">
                        {env}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
