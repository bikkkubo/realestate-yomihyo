import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealModalType, setDealModalType] = useState<DealType>("RENTAL");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch deals
  const { data: deals = [], isLoading: dealsLoading, refetch: refetchDeals } = useQuery({
    queryKey: ["/api/deals", { 
      search: searchQuery, 
      stage: stageFilter === "all" ? "" : stageFilter, 
      rank: rankFilter === "all" ? "" : rankFilter 
    }],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch stage distributions
  const { data: rentalDistribution } = useQuery({
    queryKey: ["/api/analytics/stage-distribution/RENTAL"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: salesDistribution } = useQuery({
    queryKey: ["/api/analytics/stage-distribution/SALES"],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const rentalDeals = deals.filter((deal: Deal) => deal.type === "RENTAL");
  const salesDeals = deals.filter((deal: Deal) => deal.type === "SALES");

  const openNewDealModal = (type: DealType) => {
    setDealModalType(type);
    setShowDealModal(true);
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return user.firstName[0] + user.lastName[0];
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
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
                <h1 className="text-xl font-semibold text-gray-900">Estate Pipeline</h1>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4 flex-1 max-w-lg mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search deals..."
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
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="R_ENQUIRY">R: Enquiry</SelectItem>
                  <SelectItem value="R_VIEW">R: Viewing</SelectItem>
                  <SelectItem value="R_APP">R: Application</SelectItem>
                  <SelectItem value="S_ENQUIRY">S: Enquiry</SelectItem>
                  <SelectItem value="S_VIEW">S: Viewing</SelectItem>
                  <SelectItem value="S_LOI">S: LOI</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Ranks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranks</SelectItem>
                  <SelectItem value="A">A-Grade</SelectItem>
                  <SelectItem value="B">B-Grade</SelectItem>
                  <SelectItem value="C">C-Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {stats?.overdueActions > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{getUserInitials(user)}</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role || "Agent"}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.href = '/api/logout'}
                  className="ml-2"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">A Rank Deals</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.aRankDeals || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue YTD</p>
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
                  <p className="text-sm font-medium text-gray-600">Overdue Actions</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.overdueActions || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Pipeline View */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Rental Pipeline */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Rental Pipeline</h2>
                  <p className="text-sm text-gray-500">{rentalDeals.length} active deals</p>
                </div>
              </div>
              <Button onClick={() => openNewDealModal("RENTAL")} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Rental</span>
              </Button>
            </div>

            <PipelineChart 
              data={rentalDistribution || {}} 
              type="RENTAL" 
              title="Stage Distribution" 
            />

            <DealsTable 
              deals={rentalDeals} 
              isLoading={dealsLoading}
              onRefresh={refetchDeals}
            />
          </div>

          {/* Sales Pipeline */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Sales Pipeline</h2>
                  <p className="text-sm text-gray-500">{salesDeals.length} active deals</p>
                </div>
              </div>
              <Button 
                onClick={() => openNewDealModal("SALES")} 
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span>New Sale</span>
              </Button>
            </div>

            <PipelineChart 
              data={salesDistribution || {}} 
              type="SALES" 
              title="Stage Distribution" 
            />

            <DealsTable 
              deals={salesDeals} 
              isLoading={dealsLoading}
              onRefresh={refetchDeals}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center space-x-3 p-4 h-auto">
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Export Report</p>
                  <p className="text-xs text-gray-500">Download pipeline data</p>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center space-x-3 p-4 h-auto">
                <Bell className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Schedule Follow-up</p>
                  <p className="text-xs text-gray-500">Add calendar reminders</p>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center space-x-3 p-4 h-auto">
                <TrendingUp className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Send Weekly Report</p>
                  <p className="text-xs text-gray-500">Email team summary</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
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
