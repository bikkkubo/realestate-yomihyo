import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStageLabel } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { DealType } from "@shared/schema";

interface PipelineChartProps {
  data: Record<string, number>;
  type: DealType;
  title: string;
}

export default function PipelineChart({ data, type, title }: PipelineChartProps) {
  const stageOrder = type === "RENTAL" 
    ? ["R_ENQUIRY", "R_VIEW", "R_APP", "R_SCREEN", "R_APPROVE", "R_CONTRACT"]
    : ["S_ENQUIRY", "S_VIEW", "S_LOI", "S_DEPOSIT", "S_DD", "S_APPROVE", "S_CONTRACT"];

  // 完了済み（入居・決済）を除外してアクティブな取引数を計算
  const activeDealCount = stageOrder.reduce((sum, stage) => sum + (data[stage] || 0), 0);
  
  return (
    <Card className={cn(
      "h-full pipeline-card",
      "max-h-[380px] overflow-hidden"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto">
        <div className="space-y-4 pr-1">
          {stageOrder.map((stage) => {
            const count = data[stage] || 0;
            const percentage = activeDealCount > 0 ? (count / activeDealCount) * 100 : 0;
            
            return (
              <div key={stage} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 w-20 truncate flex-shrink-0">
                  {getStageLabel(stage as any)}
                </span>
                
                <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      type === "RENTAL" ? "bg-blue-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                
                <span className="text-sm font-medium text-gray-900 w-6 text-right flex-shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        
        {activeDealCount === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>まだこのパイプラインに取引がありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
