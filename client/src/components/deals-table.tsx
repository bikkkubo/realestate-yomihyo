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

  const formatNextActionDue = (date: string | null) => {
    if (!date) return null;
    
    const dueDate = new Date(date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
        variant: "destructive" as const,
        icon: AlertTriangle
      };
    } else if (diffDays === 0) {
      return {
        label: "Due today",
        variant: "destructive" as const,
        icon: Clock
      };
    } else if (diffDays <= 3) {
      return {
        label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        variant: "secondary" as const,
        icon: Clock
      };
    } else {
      return {
        label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Recent Deals ({deals.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No deals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Next Action</TableHead>
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
                            {deal.nextAction || "No action set"}
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
                  View All {deals.length} Deals
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
