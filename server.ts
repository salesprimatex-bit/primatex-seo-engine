import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/send-to-sheet", async (req, res) => {
    const gasUrl = process.env.GAS_WEB_APP_URL;

    if (!gasUrl) {
      return res.status(500).json({ 
        error: "GAS_WEB_APP_URL is not configured on the server." 
      });
    }

    try {
      // Forward the request to Google Apps Script
      const response = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      // GAS usually returns a redirect or opaque response if using no-cors in frontend,
      // but in backend we can see the response.
      // However, Apps Script Web Apps often return HTML on success/error if not handled correctly.
      
      if (response.ok || response.status === 302) {
        res.status(200).json({ success: true });
      } else {
        const errorText = await response.text();
        console.error("GAS Error Response:", errorText);
        res.status(response.status).json({ error: "Failed to send data to Google Apps Script." });
      }
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: "Internal server error while proxying to sheet." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
