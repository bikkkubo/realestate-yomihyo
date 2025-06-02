import {
  users,
  deals,
  type User,
  type UpsertUser,
  type Deal,
  type InsertDeal,
  type UpdateDeal,
  type DealType,
  type DealStage,
  type Role,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc } from "drizzle-orm";
import { calculateScore, calculateRank } from "../lib/scoring";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: Role): Promise<User[]>;
  
  // Deal operations
  getDeals(filters?: {
    type?: DealType;
    stage?: DealStage;
    assignedToId?: string;
    rank?: string;
    search?: string;
  }): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(deal: UpdateDeal): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  
  // Analytics
  getDealStats(): Promise<{
    totalDeals: number;
    aRankDeals: number;
    overdueActions: number;
    totalRevenue: number;
  }>;
  getStageDistribution(type: DealType): Promise<Record<string, number>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Deal operations
  async getDeals(filters?: {
    type?: DealType;
    stage?: DealStage;
    assignedToId?: string;
    rank?: string;
    search?: string;
  }): Promise<Deal[]> {
    let query = db.select().from(deals);
    
    if (filters) {
      const conditions = [];
      
      if (filters.type) {
        conditions.push(eq(deals.type, filters.type));
      }
      
      if (filters.stage) {
        conditions.push(eq(deals.stage, filters.stage));
      }
      
      if (filters.assignedToId) {
        conditions.push(eq(deals.assignedToId, filters.assignedToId));
      }
      
      if (filters.rank) {
        conditions.push(eq(deals.rank, filters.rank as any));
      }
      
      if (filters.search) {
        conditions.push(
          or(
            ilike(deals.title, `%${filters.search}%`),
            ilike(deals.clientName, `%${filters.search}%`)
          )
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(deals.createdAt));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const id = nanoid();
    const score = calculateScore(deal.type, deal.stage);
    const rank = calculateRank(deal.type, score);
    
    const [newDeal] = await db
      .insert(deals)
      .values({
        ...deal,
        id,
        score,
        rank,
      })
      .returning();
    
    return newDeal;
  }

  async updateDeal(deal: UpdateDeal): Promise<Deal> {
    const existing = await this.getDeal(deal.id);
    if (!existing) {
      throw new Error("Deal not found");
    }
    
    const updatedData = { ...existing, ...deal };
    const score = calculateScore(updatedData.type, updatedData.stage);
    const rank = calculateRank(updatedData.type, score);
    
    const [updatedDeal] = await db
      .update(deals)
      .set({
        ...deal,
        score,
        rank,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, deal.id))
      .returning();
    
    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  // Analytics
  async getDealStats(): Promise<{
    totalDeals: number;
    aRankDeals: number;
    overdueActions: number;
    totalRevenue: number;
  }> {
    const allDeals = await db.select().from(deals);
    const now = new Date();
    
    return {
      totalDeals: allDeals.length,
      aRankDeals: allDeals.filter(d => d.rank === "A").length,
      overdueActions: allDeals.filter(d => 
        d.nextActionDue && d.nextActionDue < now
      ).length,
      totalRevenue: allDeals.reduce((sum, d) => sum + d.amountYen, 0),
    };
  }

  async getStageDistribution(type: DealType): Promise<Record<string, number>> {
    const typeDeals = await db.select().from(deals).where(eq(deals.type, type));
    const distribution: Record<string, number> = {};
    
    typeDeals.forEach(deal => {
      distribution[deal.stage] = (distribution[deal.stage] || 0) + 1;
    });
    
    return distribution;
  }
}

export const storage = new DatabaseStorage();
