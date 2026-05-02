import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

// API Routes
app.post("/api/send-to-sheet", async (req, res) => {
  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    console.error("GAS_WEB_APP_URL is not set.");
    return res.status(500).json({ 
      error: "Konfigurasi Server Error: GAS_WEB_APP_URL belum diatur di Environment Variables (Vercel atau AI Studio)." 
    });
  }

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
      redirect: "follow"
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      const errorText = await response.text();
      console.error("GAS Error Response:", errorText);
      // Jika 405, berikan pesan yang lebih jelas kepada user
      const message = response.status === 405 
        ? "Method Not Allowed (405): Pastikan skrip GAS Anda memiliki fungsi doPost(e) dan sudah di-deploy sebagai Web App (Anyone)."
        : `Gagal mengirim data (Status: ${response.status})`;
      
      res.status(response.status).json({ error: message });
    }
  } catch (error: any) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: `Server Proxy Error: ${error.message}` });
  }
});

async function startServer() {
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

  // Hanya jalankan app.listen jika tidak sedang di lingkungan Vercel
  if (process.env.NODE_ENV !== "production") {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
