// index.js
// Global error handlers (put at top)
process.on('uncaughtException', (err) => {
  console.error('*** uncaughtException ***');
  console.error(err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('*** unhandledRejection ***');
  console.error('reason:', reason);
  console.error('promise:', p);
});

const express = require("express");
const axios = require("axios");

const app = express();

// CORS / headers - put before routes
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  // quick OPTIONS response
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// lightweight request logger
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.url} - ${req.ip}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Stremio MAL Addon is running 🚀");
});

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID || ""; // set this in Railway variables
if (!MAL_CLIENT_ID) {
  console.warn("⚠️ WARNING: MAL_CLIENT_ID is not set. MAL API requests will fail. Add MAL_CLIENT_ID to environment variables.");
}

const manifest = {
  id: "org.khaled.mal.rating",
  version: "1.0.0",
  name: "MAL Rating Addon",
  description: "Shows MyAnimeList rating in Stremio",
  resources: ["meta"],
  types: ["anime"],
  idPrefixes: ["mal_"]
};

// Manifest
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// Meta route
app.get("/meta/anime/:id.json", async (req, res) => {
  try {
    const rawId = req.params.id || "";
    // expected id form "mal_<query>" — remove prefix
    const query = decodeURIComponent(rawId.replace(/^mal_/, "")).trim();
    if (!query) {
      return res.json({ meta: null });
    }

    if (!MAL_CLIENT_ID) {
      console.warn("MAL_CLIENT_ID missing - returning null meta for", query);
      return res.json({ meta: null });
    }

    const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(query)}&limit=1&fields=mean,main_picture`;

    const result = await axios.get(url, {
      headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID },
      timeout: 7000
    });

    // safe checks for structure
    const data = result?.data?.data;
    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ meta: null });
    }

    const node = data[0].node || data[0];
    const animeTitle = node?.title || node?.name || query;
    const poster = node?.main_picture?.large || null;
    const mean = node?.mean;

    res.json({
      meta: {
        id: "mal_" + query,
        type: "anime",
        name: animeTitle,
        poster: poster,
        description: `⭐ MAL Rating: ${mean ?? "N/A"}`
      }
    });

  } catch (e) {
    // log full error for debugging
    console.error("*** Error in /meta route:", e && e.stack ? e.stack : e);
    // return safe response for Stremio
    res.json({ meta: null });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Running on port", PORT);
});






