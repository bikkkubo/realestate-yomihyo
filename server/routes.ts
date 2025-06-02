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
      let userId = 'test-admin';
      let user = await storage.getUser(userId);
      
      // Production mode: use authentication
      if (process.env.NODE_ENV !== 'development') {
        if (!req.isAuthenticated() || !req.user?.claims?.sub) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { type, stage, rank, search } = req.query;
      
      let filters: any = { type, stage, rank, search };
      
      // Apply RBAC filtering
      if (!hasPermission(user.role, "read", "all")) {
        if (hasPermission(user.role, "read", "own")) {
          filters.assignedToId = userId;
        } else {
          return res.status(403).json({ message: "Insufficient permissions" });
        }
      }
      
      const deals = await storage.getDeals(filters);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get('/api/deals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const deal = await storage.getDeal(req.params.id);
      
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Check permissions
      if (!hasPermission(user.role, "read", "all") && deal.assignedToId !== userId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post('/api/deals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!hasPermission(user.role, "write", "own")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const dealData = insertDealSchema.parse(req.body);
      
      // If user can only write own deals, assign to self
      if (!hasPermission(user.role, "write", "all")) {
        dealData.assignedToId = userId;
      }

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

  app.put('/api/deals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existing = await storage.getDeal(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Check permissions
      const canWriteAll = hasPermission(user.role, "write", "all");
      const canWriteOwn = hasPermission(user.role, "write", "own") && existing.assignedToId === userId;
      
      if (!canWriteAll && !canWriteOwn) {
        return res.status(403).json({ message: "Insufficient permissions" });
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

  app.delete('/api/deals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existing = await storage.getDeal(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Check permissions
      const canWriteAll = hasPermission(user.role, "write", "all");
      const canWriteOwn = hasPermission(user.role, "write", "own") && existing.assignedToId === userId;
      
      if (!canWriteAll && !canWriteOwn) {
        return res.status(403).json({ message: "Insufficient permissions" });
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
      let userId = 'test-admin';
      let user = await storage.getUser(userId);
      
      // Production mode: use authentication
      if (process.env.NODE_ENV !== 'development') {
        if (!req.isAuthenticated() || !req.user?.claims?.sub) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stats = await storage.getDealStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/analytics/stage-distribution/:type', async (req: any, res) => {
    try {
      let userId = 'test-admin';
      let user = await storage.getUser(userId);
      
      // Production mode: use authentication
      if (process.env.NODE_ENV !== 'development') {
        if (!req.isAuthenticated() || !req.user?.claims?.sub) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const type = req.params.type as "RENTAL" | "SALES";
      const distribution = await storage.getStageDistribution(type);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching stage distribution:", error);
      res.status(500).json({ message: "Failed to fetch stage distribution" });
    }
  });

  // User routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only admins and managers can list users
      if (!hasPermission(user.role, "read", "team")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { role } = req.query;
      const users = role ? await storage.getUsersByRole(role as Role) : await storage.getUsersByRole("AGENT");
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
