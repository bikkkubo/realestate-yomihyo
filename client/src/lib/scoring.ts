import type { DealType, DealStage, Rank } from "@shared/schema";

// Rental scoring system (max 100 points)
const RENTAL_SCORING = {
  R_ENQUIRY: 0,
  R_VIEW: 0,
  R_APP: 25,     // Application received
  R_SCREEN: 40,  // Screening started (25 + 15)
  R_APPROVE: 60, // Screening approved (25 + 15 + 20)
  R_CONTRACT: 80, // Contract signed (25 + 15 + 20 + 20)
  R_MOVEIN: 100, // Move-in date scheduled (25 + 15 + 20 + 20 + 20)
} as const;

// Sales scoring system (max 100 points)
const SALES_SCORING = {
  S_ENQUIRY: 0,
  S_VIEW: 0,
  S_LOI: 20,     // LOI submitted
  S_DEPOSIT: 35, // Deposit received (20 + 15)
  S_DD: 60,      // DD completed (20 + 15 + 25)
  S_APPROVE: 80, // Loan approval/cash verified (20 + 15 + 25 + 20)
  S_CONTRACT: 100, // Contract signed (20 + 15 + 25 + 20 + 20)
  S_CLOSING: 100, // Same as contract for scoring purposes
} as const;

export function calculateScore(type: DealType, stage: DealStage): number {
  if (type === "RENTAL") {
    return RENTAL_SCORING[stage as keyof typeof RENTAL_SCORING] || 0;
  } else {
    return SALES_SCORING[stage as keyof typeof SALES_SCORING] || 0;
  }
}

export function calculateRank(type: DealType, score: number): Rank {
  if (type === "RENTAL") {
    // Rental: A ≥ 85, B 55-84, C < 55
    if (score >= 85) return "A";
    if (score >= 55) return "B";
    return "C";
  } else {
    // Sales: A ≥ 80, B 45-79, C < 45
    if (score >= 80) return "A";
    if (score >= 45) return "B";
    return "C";
  }
}

export function getStageLabel(stage: DealStage): string {
  const labels: Record<DealStage, string> = {
    R_ENQUIRY: "Enquiry",
    R_VIEW: "Viewing",
    R_APP: "Application",
    R_SCREEN: "Screening",
    R_APPROVE: "Approved",
    R_CONTRACT: "Contract",
    R_MOVEIN: "Move-in",
    S_ENQUIRY: "Enquiry",
    S_VIEW: "Viewing",
    S_LOI: "LOI",
    S_DEPOSIT: "Deposit",
    S_DD: "Due Diligence",
    S_APPROVE: "Approved",
    S_CONTRACT: "Contract",
    S_CLOSING: "Closing",
  };
  
  return labels[stage] || stage;
}

export function getRankColor(rank: Rank): string {
  const colors = {
    A: "bg-green-500",
    B: "bg-yellow-500", 
    C: "bg-red-500",
  };
  
  return colors[rank];
}

export function getStageColor(stage: DealStage): string {
  const rentalColors: Record<string, string> = {
    R_ENQUIRY: "bg-gray-100 text-gray-800",
    R_VIEW: "bg-blue-100 text-blue-800",
    R_APP: "bg-green-100 text-green-800",
    R_SCREEN: "bg-yellow-100 text-yellow-800",
    R_APPROVE: "bg-purple-100 text-purple-800",
    R_CONTRACT: "bg-indigo-100 text-indigo-800",
    R_MOVEIN: "bg-emerald-100 text-emerald-800",
  };
  
  const salesColors: Record<string, string> = {
    S_ENQUIRY: "bg-gray-100 text-gray-800",
    S_VIEW: "bg-blue-100 text-blue-800",
    S_LOI: "bg-yellow-100 text-yellow-800",
    S_DEPOSIT: "bg-orange-100 text-orange-800",
    S_DD: "bg-purple-100 text-purple-800",
    S_APPROVE: "bg-green-100 text-green-800",
    S_CONTRACT: "bg-indigo-100 text-indigo-800",
    S_CLOSING: "bg-emerald-100 text-emerald-800",
  };
  
  return { ...rentalColors, ...salesColors }[stage] || "bg-gray-100 text-gray-800";
}
