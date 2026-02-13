const express = require("express");
const axios = require("axios");

const app = express();

// Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Root
app.get("/", (req, res) => {
  res.send("Stremio MAL Addon is running 🚀");
});

// Env
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

if (!MAL_CLIENT_ID) {
  console.log("❌ MAL_CLIENT_ID is missing!");
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

app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// Meta
app.get("/meta/anime/:id.json", async (req, res) => {
  try {
    if (!MAL_CLIENT_ID) {
      return res.json({ meta: null });
    }

    const query = decodeURIComponent(
      req.params.id.replace("mal_", "")
    );

    const url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&fields=mean,main_picture,title`;

    const result = await axios.get(url, {
      timeout: 5000, // ⏱️ 5 ثواني فقط
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
    console.log("❌ MAL Error:", err.message);

    // لا تخلي السيرفر يعلق
    res.json({ meta: null });
  }
});

// Port
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Running on port", PORT);
});








