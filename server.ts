import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Read Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  async function getSeoDataFromFirestore() {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'seo'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch(e) { console.error(e); }
    return {
      domain: '',
      robotsTxt: 'User-agent: *\nAllow: /',
      sitemapXml: '',
      rssXml: ''
    };
  }

  async function getAppDataFromFirestore() {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'app'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch(e) { console.error(e); }
    return {};
  }

  // Serve the actual files
  app.get("/robots.txt", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    res.type('text/plain');
    res.send(data.robotsTxt || 'User-agent: *\nAllow: /');
  });

  app.get("/ads.txt", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    res.type('text/plain');
    res.send(data.adsTxt || '');
  });

  app.get("/sitemap.xml", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    res.type('application/xml');
    if (data.sitemapXml) {
       res.send(data.sitemapXml);
    } else {
       res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`);
    }
  });

  app.get("/rss.xml", async (req, res) => {
    const data = await getSeoDataFromFirestore();
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
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const appData = await getAppDataFromFirestore();
        if (appData.naverMeta) {
            let metaTag = '';
            if (appData.naverMeta.trim().startsWith('<meta')) {
               metaTag = appData.naverMeta;
            } else {
               metaTag = `<meta name="naver-site-verification" content="${appData.naverMeta}" />`;
            }
            template = template.replace('</head>', `  ${metaTag}\n</head>`);
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch(e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      try {
        let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const appData = await getAppDataFromFirestore();
        if (appData.naverMeta) {
            let metaTag = '';
            if (appData.naverMeta.trim().startsWith('<meta')) {
               metaTag = appData.naverMeta;
            } else {
               metaTag = `<meta name="naver-site-verification" content="${appData.naverMeta}" />`;
            }
            html = html.replace('</head>', `  ${metaTag}\n</head>`);
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch(e) {
        res.status(500).end('Error loading index.html');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
