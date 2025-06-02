import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Clock, AlertTriangle } from "lucide-react";
import { getStageLabel, getRankColor, getStageColor } from "@/lib/scoring";
import type { Deal } from "@shared/schema";

interface DealsTableProps {
  deals: Deal[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function DealsTable({ deals, isLoading, onRefresh }: DealsTableProps) {
  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
    
    return type === "RENTAL" ? `${formatted}/mo` : formatted;
  };

  const formatNextActionDue = (date: Date | null) => {
    if (!date) return null;
    
    const dueDate = new Date(date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        label: `期限切れ ${Math.abs(diffDays)}日`,
        variant: "destructive" as const,
        icon: AlertTriangle
      };
    } else if (diffDays === 0) {
      return {
        label: "今日期限",
        variant: "destructive" as const,
        icon: Clock
      };
    } else if (diffDays <= 3) {
      return {
        label: `あと${diffDays}日`,
        variant: "secondary" as const,
        icon: Clock
      };
    } else {
      return {
        label: `あと${diffDays}日`,
        variant: "outline" as const,
        icon: Clock
      };
    }
  };

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            最近の取引 ({deals.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] flex flex-col">
        {deals.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>取引が見つかりません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-1">
                      <span>顧客</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>物件</TableHead>
                  <TableHead>ステージ</TableHead>
                  <TableHead>ランク</TableHead>
                  <TableHead>価格</TableHead>
                  <TableHead>次のアクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.slice(0, 5).map((deal) => {
                  const nextActionStatus = formatNextActionDue(deal.nextActionDue);
                  
                  return (
                    <TableRow key={deal.id} className="hover:bg-gray-50 cursor-pointer">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {getClientInitials(deal.clientName)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {deal.clientName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">
                          {deal.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getStageColor(deal.stage)}
                        >
                          {getStageLabel(deal.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`${getRankColor(deal.rank)} text-white`}
                        >
                          {deal.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {formatAmount(deal.amountYen, deal.type)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {deal.nextAction || "アクション未設定"}
                          </div>
                          {nextActionStatus && (
                            <div className="flex items-center space-x-1">
                              <nextActionStatus.icon className="h-3 w-3" />
                              <Badge 
                                variant={nextActionStatus.variant}
                                className="text-xs"
                              >
                                {nextActionStatus.label}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {deals.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  全{deals.length}件の取引を表示
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
