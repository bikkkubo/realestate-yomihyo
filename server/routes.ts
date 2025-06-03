import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDealSchema, updateDealSchema, type Role } from "@shared/schema";
import { z } from "zod";

function hasPermission(userRole: Role, action: "read" | "write", scope: "own" | "team" | "all"): boolean {
  const permissions = {
    ADMIN: { read: ["own", "team", "all"], write: ["own", "all"] },
    MANAGER: { read: ["own", "team"], write: ["own", "all"] },
    AGENT: { read: ["own"], write: ["own"] },
    VIEWER: { read: ["own"], write: [] },
  };
  
  return permissions[userRole]?.[action]?.includes(scope) || false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Development mode: return test admin user
      if (process.env.NODE_ENV === 'development') {
        const user = await storage.getUser('test-admin');
        return res.json(user);
      }
      
      // Production mode: use authentication
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Deal routes
  app.get('/api/deals', async (req: any, res) => {
    try {
      const { type, stage, rank, search } = req.query;
      
      let filters: any = { type, stage, rank, search };
      
      const deals = await storage.getDeals(filters);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get('/api/deals/:id', async (req: any, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post('/api/deals', async (req: any, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      
      // Always assign to the fixed agent
      dealData.assignedToId = "okubo";

      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put('/api/deals/:id', async (req: any, res) => {
    try {
      const existing = await storage.getDeal(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Deal not found" });
      }

      const dealData = updateDealSchema.parse({ ...req.body, id: req.params.id });
      const deal = await storage.updateDeal(dealData);
      res.json(deal);
    } catch (error) {
      console.error("Error updating deal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete('/api/deals/:id', async (req: any, res) => {
    try {
      const existing = await storage.getDeal(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Deal not found" });
      }

      await storage.deleteDeal(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', async (req: any, res) => {
    try {
      const stats = await storage.getDealStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/analytics/stage-distribution/:type', async (req: any, res) => {
    try {
      const type = req.params.type as "RENTAL" | "SALES";
      const distribution = await storage.getStageDistribution(type);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching stage distribution:", error);
      res.status(500).json({ message: "Failed to fetch stage distribution" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
