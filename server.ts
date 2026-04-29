import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const seoDataPath = path.join(process.cwd(), 'seo-data.json');

  // Read / Initialize SEO data
  function getSeoData() {
    if (fs.existsSync(seoDataPath)) {
      try {
        return JSON.parse(fs.readFileSync(seoDataPath, 'utf8'));
      } catch(e) { return {}; }
    }
    return {
      domain: '',
      robotsTxt: 'User-agent: *\nAllow: /',
      sitemapXml: '',
      rssXml: ''
    };
  }

  function setSeoData(data: any) {
    fs.writeFileSync(seoDataPath, JSON.stringify(data, null, 2));
  }

  const appDataPath = path.join(process.cwd(), 'app-data.json');

  function getAppData() {
    if (fs.existsSync(appDataPath)) {
      try { return JSON.parse(fs.readFileSync(appDataPath, 'utf8')); } catch(e) {}
    }
    return {};
  }

  function setAppData(data: any) {
    fs.writeFileSync(appDataPath, JSON.stringify(data, null, 2));
  }

  const statsPath = path.join(process.cwd(), 'stats-data.json');

  function getStatsData() {
    if (fs.existsSync(statsPath)) {
      try { return JSON.parse(fs.readFileSync(statsPath, 'utf8')); } catch(e) {}
    }
    return {};
  }

  function setStatsData(data: any) {
    fs.writeFileSync(statsPath, JSON.stringify(data, null, 2));
  }

  app.get("/api/data", (req, res) => {
    res.json(getAppData());
  });

  app.post("/api/data", (req, res) => {
    setAppData(req.body);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    res.json(getStatsData());
  });

  app.post("/api/stats", (req, res) => {
    // Only accept tracking events from users
    const currentStats = getStatsData();
    const event = req.body;
    
    const today = new Date().toISOString().split('T')[0];
    const todayStat = currentStats[today] || { visitors: 0, referrers: {}, keywords: {}, devices: {}, browsers: {} };
    
    // Depending on what we send in the body
    if (event.type === 'visit') {
       todayStat.visitors += 1;
       if (event.referrer) {
           todayStat.referrers[event.referrer] = (todayStat.referrers[event.referrer] || 0) + 1;
       }
       if (event.keyword) {
           todayStat.keywords[event.keyword] = (todayStat.keywords[event.keyword] || 0) + 1;
       }
       if (event.device) {
           todayStat.devices[event.device] = (todayStat.devices[event.device] || 0) + 1;
       }
       if (event.browser) {
           todayStat.browsers[event.browser] = (todayStat.browsers[event.browser] || 0) + 1;
       }
    }
    currentStats[today] = todayStat;
    setStatsData(currentStats);

    res.json({ success: true, stats: currentStats });
  });

  // API endpoints
  app.get("/api/seo", (req, res) => {
    res.json(getSeoData());
  });

  app.post("/api/seo", (req, res) => {
    setSeoData(req.body);
    res.json({ success: true });
  });

  // Serve the actual files
  app.get("/robots.txt", (req, res) => {
    const data = getSeoData();
    res.type('text/plain');
    res.send(data.robotsTxt || 'User-agent: *\nAllow: /');
  });

  app.get("/ads.txt", (req, res) => {
    const data = getSeoData();
    res.type('text/plain');
    res.send(data.adsTxt || '');
  });

  app.get("/sitemap.xml", (req, res) => {
    const data = getSeoData();
    res.type('application/xml');
    if (data.sitemapXml) {
       res.send(data.sitemapXml);
    } else {
       res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`);
    }
  });

  app.get("/rss.xml", (req, res) => {
    const data = getSeoData();
    res.type('application/xml');
    if (data.rssXml) {
       res.send(data.rssXml);
    } else {
       res.send(`<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n</channel>\n</rss>`);
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
