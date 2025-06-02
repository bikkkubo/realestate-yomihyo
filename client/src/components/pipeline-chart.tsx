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
    ? ["R_ENQUIRY", "R_VIEW", "R_APP", "R_SCREEN", "R_APPROVE", "R_CONTRACT", "R_MOVEIN"]
    : ["S_ENQUIRY", "S_VIEW", "S_LOI", "S_DEPOSIT", "S_DD", "S_APPROVE", "S_CONTRACT", "S_CLOSING"];

  const totalDeals = Object.values(data).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(data), 1);

  return (
    <Card className={cn(
      "h-full pipeline-card",
      "max-h-[380px] overflow-hidden"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto">
        <div className="space-y-3 pr-2">
          {stageOrder.map((stage) => {
            const count = data[stage] || 0;
            const percentage = totalDeals > 0 ? (count / maxCount) * 100 : 0;
            
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 max-w-[100px] truncate flex-shrink-0">
                  {getStageLabel(stage as any)}
                </span>
                
                <Progress
                  value={percentage}
                  className="flex-1 h-2 max-w-[180px] shrink-0"
                />
                
                <span className="text-sm font-medium text-gray-900 w-8 text-right flex-shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        
        {totalDeals === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>まだこのパイプラインに取引がありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
