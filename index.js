const express = require("express");
const axios = require("axios");

const app = express();

// Health check (مهم لRailway)
app.get("/", (req, res) => {
  res.status(200).send("Stremio MAL Addon is running 🚀");
});

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Env
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

if (!MAL_CLIENT_ID) {
  console.error("❌ MAL_CLIENT_ID is missing!");
}

// Manifest
const manifest = {
  id: "org.khaled.mal.rating",
  version: "1.0.0",
  name: "MAL Rating Addon",
  description: "Shows MyAnimeList rating in Stremio",
  resources: ["meta"],
  types: ["anime"],
  idPrefixes: ["mal_"]
};

// Manifest route
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// Meta route
app.get("/meta/anime/:id.json", async (req, res) => {
  try {
    const query = decodeURIComponent(
      req.params.id.replace("mal_", "")
    );

    const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(
      query
    )}&limit=1&fields=mean,main_picture,title`;

    const result = await axios.get(url, {
      timeout: 10000, // يمنع التعليق
      headers: {
        "X-MAL-CLIENT-ID": MAL_CLIENT_ID
      }
    });

    if (!result.data?.data?.length) {
      return res.json({ meta: null });
    }

    const anime = result.data.data[0].node;

    res.json({
      meta: {
        id: "mal_" + query,
        type: "anime",
        name: anime.title,
        poster: anime.main_picture?.large || "",
        description: `⭐ MAL Rating: ${anime.mean || "N/A"}`
      }
    });

  } catch (err) {
    console.error("API Error:", err.message);

    res.status(500).json({ meta: null });
  }
});

// Listen
const PORT = process.env.PORT || 7000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server running on port", PORT);
});









