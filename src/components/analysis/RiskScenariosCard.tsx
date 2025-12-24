'use client';

// =====================================================
// Risk Scenarios Card Component
// Displays structured risk scenarios for accident prevention
// =====================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Activity, Lightbulb } from 'lucide-react';
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
          <AlertTriangle className="h-5 w-5 text-orange-600" />
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
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">トリガー条件</div>
                  <p className="text-sm font-medium">{scenario.condition}</p>
                </div>
              </div>

              {/* Symptom & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                  <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">現れる症状</div>
                  <p className="text-sm text-red-800 dark:text-red-200">{scenario.symptom}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                  <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">業務への影響</div>
                  <p className="text-sm text-amber-800 dark:text-amber-200">{scenario.impact}</p>
                </div>
              </div>

              {/* Prevention */}
              <div className="flex items-start gap-3 pl-11">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">予防策・対処法</div>
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
