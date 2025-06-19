import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // This PWA is primarily frontend-focused with Google Sheets integration
  // Most functionality is handled client-side with local storage caching
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Restaurants endpoint (optional proxy if needed for CORS issues)
  app.get("/api/restaurants", async (req, res) => {
    try {
      // This could proxy to Google Sheets if CORS becomes an issue
      // For now, the client handles the direct API calls
      res.json({ message: "Use client-side service for restaurant data" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
