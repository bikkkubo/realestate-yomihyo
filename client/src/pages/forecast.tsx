import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import type { Deal } from "@shared/schema";

export default function Forecast() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [selectedQuarter, setSelectedQuarter] = useState("1Q");
  const [targetAmount, setTargetAmount] = useState("2100000");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "認証が必要です",
        description: "ログインページに移動します...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals"],
    enabled: !!user,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ステージ別の確率設定
  const stageScores = {
    "初回問い合わせ": { score: 0, rank: "C" },
    "入居時期確定・内覧実施": { score: 30, rank: "C" },
    "申込書＋必要書類受領": { score: 55, rank: "B" },
    "保証会社審査スタート": { score: 70, rank: "B" },
    "保証会社とオーナー承認": { score: 85, rank: "B" },
    "賃貸借契約書署名": { score: 95, rank: "A" },
    "初期費用入金": { score: 100, rank: "A" },
  };

  // 月別データの計算
  const calculateMonthlyData = () => {
    const months = ["6月", "7月", "8月"];
    const monthlyData = months.map(month => {
      const monthDeals = deals.filter((deal: Deal) => {
        // 実際の実装では、deal.expectedClosingDate を使用して月を判定
        return true; // 仮の実装
      });
      
      return {
        month,
        target: month === "6月" ? 1500000 : 300000,
        forecast: monthDeals.reduce((sum: number, deal: Deal) => sum + deal.amountYen, 0),
        deals: monthDeals,
      };
    });
    
    return monthlyData;
  };

  const monthlyData = calculateMonthlyData();
  const totalTarget = monthlyData.reduce((sum, month) => sum + month.target, 0);
  const totalForecast = monthlyData.reduce((sum, month) => sum + month.forecast, 0);
  const achievementRate = totalTarget > 0 ? (totalForecast / totalTarget) * 100 : 0;
  const variance = totalForecast - totalTarget;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ヨミ表（予実管理）</h1>
            <p className="text-sm text-gray-600">売上予測と実績の管理</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1Q">1Q (6-8月)</SelectItem>
                <SelectItem value="2Q">2Q (9-11月)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              期間設定
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">予算（目標）</p>
                  <p className="text-2xl font-bold">¥{totalTarget.toLocaleString()}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">着地予測</p>
                  <p className="text-2xl font-bold">¥{totalForecast.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">予算差異</p>
                  <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {variance >= 0 ? '+' : ''}¥{variance.toLocaleString()}
                  </p>
                </div>
                {variance >= 0 ? 
                  <TrendingUp className="h-8 w-8 text-green-500" /> : 
                  <TrendingDown className="h-8 w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">予算達成率</p>
                  <p className={`text-2xl font-bold ${achievementRate >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {achievementRate.toFixed(1)}%
                  </p>
                </div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  achievementRate >= 100 ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {achievementRate >= 100 ? '✓' : '!'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 月別実績表 */}
        <Card>
          <CardHeader>
            <CardTitle>月別実績</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">項目</th>
                    {monthlyData.map(month => (
                      <th key={month.month} className="text-center py-2 px-4">{month.month}</th>
                    ))}
                    <th className="text-center py-2 px-4">1Q合計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-blue-50">
                    <td className="py-2 px-4 font-medium">予算（目標）</td>
                    {monthlyData.map(month => (
                      <td key={month.month} className="text-center py-2 px-4">
                        ¥{month.target.toLocaleString()}
                      </td>
                    ))}
                    <td className="text-center py-2 px-4 font-bold">¥{totalTarget.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">着地予測</td>
                    {monthlyData.map(month => (
                      <td key={month.month} className="text-center py-2 px-4">
                        ¥{month.forecast.toLocaleString()}
                      </td>
                    ))}
                    <td className="text-center py-2 px-4 font-bold">¥{totalForecast.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="py-2 px-4 font-medium">予算差異</td>
                    {monthlyData.map(month => {
                      const diff = month.forecast - month.target;
                      return (
                        <td key={month.month} className={`text-center py-2 px-4 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}¥{diff.toLocaleString()}
                        </td>
                      );
                    })}
                    <td className={`text-center py-2 px-4 font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance >= 0 ? '+' : ''}¥{variance.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4 font-medium">予算達成率</td>
                    {monthlyData.map(month => {
                      const rate = month.target > 0 ? (month.forecast / month.target) * 100 : 0;
                      return (
                        <td key={month.month} className={`text-center py-2 px-4 ${rate >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                          {rate.toFixed(1)}%
                        </td>
                      );
                    })}
                    <td className={`text-center py-2 px-4 font-bold ${achievementRate >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {achievementRate.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ステージ別案件一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>ステージ別案件一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(stageScores).reverse().map(([stageName, stageInfo]) => (
                <div key={stageName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant={stageInfo.rank === "A" ? "default" : stageInfo.rank === "B" ? "secondary" : "outline"}>
                        {stageInfo.rank}
                      </Badge>
                      <h3 className="font-medium">{stageName}</h3>
                      <span className="text-sm text-gray-500">（{stageInfo.score}%）</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-gray-500">
                          <th className="text-left py-2">案件名</th>
                          <th className="text-left py-2">顧客名</th>
                          <th className="text-left py-2">区分</th>
                          <th className="text-center py-2">6月</th>
                          <th className="text-center py-2">7月</th>
                          <th className="text-center py-2">8月</th>
                          <th className="text-center py-2">1Q合計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 実際の案件データをここに表示 */}
                        {deals.filter((deal: Deal) => {
                          // ステージに基づいてフィルタリング（実装時に適切なマッピングを行う）
                          return true; // 仮の実装
                        }).slice(0, 5).map((deal: Deal) => (
                          <tr key={deal.id} className="border-b">
                            <td className="py-2">{deal.title}</td>
                            <td className="py-2">{deal.clientName}</td>
                            <td className="py-2">{deal.type === "RENTAL" ? "賃貸" : "売買"}</td>
                            <td className="text-center py-2">¥{deal.amountYen.toLocaleString()}</td>
                            <td className="text-center py-2">0</td>
                            <td className="text-center py-2">0</td>
                            <td className="text-center py-2 font-medium">¥{deal.amountYen.toLocaleString()}</td>
                          </tr>
                        ))}
                        {deals.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-gray-500">
                              このステージに案件がありません
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}