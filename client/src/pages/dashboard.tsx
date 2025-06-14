import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Bell, TrendingUp, Star, AlertCircle, DollarSign, Home, Building } from "lucide-react";
import DealsTable from "@/components/deals-table";
import PipelineChart from "@/components/pipeline-chart";
import DealModal from "@/components/deal-modal";
import type { Deal, DealType } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealModalType, setDealModalType] = useState<DealType>("RENTAL");

  // Fetch deals
  const { data: deals = [], isLoading: dealsLoading, refetch: refetchDeals } = useQuery<Deal[]>({
    queryKey: ["/api/deals", { 
      search: searchQuery, 
      stage: stageFilter === "all" ? "" : stageFilter, 
      rank: rankFilter === "all" ? "" : rankFilter 
    }],
  });

  // Fetch stats
  const { data: stats = {
    totalDeals: 0,
    aRankDeals: 0,
    bRankDeals: 0,
    cRankDeals: 0,
    overdueActions: 0,
    totalRevenue: 0
  } } = useQuery<{
    totalDeals: number;
    aRankDeals: number;
    bRankDeals: number;
    cRankDeals: number;
    overdueActions: number;
    totalRevenue: number;
  }>({
    queryKey: ["/api/analytics/stats"],
  });

  // Fetch stage distributions
  const { data: rentalDistribution = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/analytics/stage-distribution/RENTAL"],
  });

  const { data: salesDistribution = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/analytics/stage-distribution/SALES"],
  });

  const rentalDeals = deals?.filter((deal: Deal) => deal.type === "RENTAL") || [];
  const salesDeals = deals?.filter((deal: Deal) => deal.type === "SALES") || [];

  const openNewDealModal = (type: DealType) => {
    setDealModalType(type);
    setShowDealModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">不動産パイプライン</h1>
              </div>
            </div>

            {/* Navigation and Search */}
            <div className="flex items-center space-x-6 flex-1 max-w-2xl mx-8">
              <nav className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/" className="text-blue-600 font-medium">ダッシュボード</a>
                </Button>
                <span className="text-gray-400">/</span>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/forecast" className="text-gray-600 hover:text-blue-600">ヨミ表</a>
                </Button>
              </nav>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="取引を検索..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ステージ</SelectItem>
                  <SelectItem value="R_ENQUIRY">賃貸: 問い合わせ</SelectItem>
                  <SelectItem value="R_VIEW">賃貸: 内見</SelectItem>
                  <SelectItem value="R_APP">賃貸: 申込み</SelectItem>
                  <SelectItem value="S_ENQUIRY">売買: 問い合わせ</SelectItem>
                  <SelectItem value="S_VIEW">売買: 内見</SelectItem>
                  <SelectItem value="S_LOI">売買: 買付申込</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Ranks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ランク</SelectItem>
                  <SelectItem value="A">Aランク</SelectItem>
                  <SelectItem value="B">Bランク</SelectItem>
                  <SelectItem value="C">Cランク</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {(stats?.overdueActions || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">大久</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">大久保 洋祐</p>
                  <p className="text-xs text-gray-500">エージェント</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総取引数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalDeals || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-green-600">+12%</span>
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">ランク別取引</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Aランク</span>
                  <span className="text-lg font-bold text-green-600">{stats?.aRankDeals || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bランク</span>
                  <span className="text-lg font-bold text-yellow-600">{stats?.bRankDeals || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cランク</span>
                  <span className="text-lg font-bold text-red-600">{stats?.cRankDeals || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">売上合計</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ¥{((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">期限切れアクション</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.overdueActions || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NOTE: 各ブロックを縦に独立させる */}
        <div className="space-y-10">
          {/* パイプライン行 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">賃貸パイプライン</h2>
                    <p className="text-sm text-gray-500">{rentalDeals.length} 件のアクティブ取引</p>
                  </div>
                </div>
                <Button onClick={() => openNewDealModal("RENTAL")} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>新規賃貸</span>
                </Button>
              </div>
              <PipelineChart 
                data={rentalDistribution || {}} 
                type="RENTAL" 
                title="ステージ分布" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">売買パイプライン</h2>
                    <p className="text-sm text-gray-500">{salesDeals.length} 件のアクティブ取引</p>
                  </div>
                </div>
                <Button 
                  onClick={() => openNewDealModal("SALES")} 
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>新規売買</span>
                </Button>
              </div>
              <PipelineChart 
                data={salesDistribution || {}} 
                type="SALES" 
                title="ステージ分布" 
              />
            </div>
          </div>

          {/* 最近の取引行 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DealsTable 
              deals={rentalDeals} 
              isLoading={dealsLoading}
              onRefresh={refetchDeals}
            />
            <DealsTable 
              deals={salesDeals} 
              isLoading={dealsLoading}
              onRefresh={refetchDeals}
            />
          </div>
          {/* クイックアクション行 */}
          <div className="grid gap-6 lg:grid-cols-3">
            <button
              className="flex w-full items-center justify-center rounded-xl
                         border border-dashed border-gray-300 py-8 text-sm
                         transition hover:bg-gray-50 flex-col space-y-2"
            >
              <Download className="h-6 w-6 text-gray-400" />
              <span>レポート出力</span>
            </button>
            
            <button
              className="flex w-full items-center justify-center rounded-xl
                         border border-dashed border-gray-300 py-8 text-sm
                         transition hover:bg-gray-50 flex-col space-y-2"
            >
              <Bell className="h-6 w-6 text-gray-400" />
              <span>フォローアップ予約</span>
            </button>
            
            <button
              className="flex w-full items-center justify-center rounded-xl
                         border border-dashed border-gray-300 py-8 text-sm
                         transition hover:bg-gray-50 flex-col space-y-2"
            >
              <TrendingUp className="h-6 w-6 text-gray-400" />
              <span>案件レポート起票</span>
            </button>
          </div>
        </div>
      </main>

      {/* Deal Modal */}
      <DealModal
        isOpen={showDealModal}
        onClose={() => setShowDealModal(false)}
        dealType={dealModalType}
        onSuccess={() => {
          refetchDeals();
          setShowDealModal(false);
        }}
      />
    </div>
  );
}
