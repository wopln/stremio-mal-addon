const express = require("express");
const axios = require("axios");

const app = express();

app.get("/", (req, res) => {
  res.send("Stremio MAL Addon is running 🚀");
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

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
    const query = decodeURIComponent(req.params.id.replace("mal_", ""));

    const url = `https://api.myanimelist.net/v2/anime?q=${query}&limit=1&fields=mean,main_picture`;

    const result = await axios.get(url, {
      headers: {
        "X-MAL-CLIENT-ID": MAL_CLIENT_ID
      }
    });

    if (!result.data.data.length) {
      return res.json({ meta: null });
    }

    const anime = result.data.data[0].node;

    res.json({
      meta: {
        id: "mal_" + query,
        type: "anime",
        name: anime.title,
        poster: anime.main_picture?.large,
        description: `⭐ MAL Rating: ${anime.mean || "N/A"}`
      }
    });

  } catch (e) {
    console.log("Error:", e.message);
    res.json({ meta: null });
  }
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Running on port", PORT);
});





