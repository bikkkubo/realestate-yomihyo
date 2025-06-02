import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStageLabel } from "@/lib/scoring";
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] flex flex-col">
        <div className="space-y-3">
          {stageOrder.map((stage) => {
            const count = data[stage] || 0;
            const percentage = totalDeals > 0 ? (count / totalDeals) * 100 : 0;
            const barWidth = totalDeals > 0 ? (count / maxCount) * 100 : 0;
            
            return (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 w-24 truncate">
                  {getStageLabel(stage as any)}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mx-3">
                  <div 
                    className={`h-2 rounded-full ${
                      type === "RENTAL" ? "bg-blue-500" : "bg-green-500"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {totalDeals === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>まだこのパイプラインに取引がありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
