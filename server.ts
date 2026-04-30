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
    res.send(data.adsTxt || 'google.com, pub-6799823492487492, DIRECT, f08c47fec0942fa0');
  });

  app.get("/sitemap.xml", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    res.type('application/xml');
    if (data.sitemapXml && data.sitemapXml.trim() !== '' && data.sitemapXml.includes('<')) {
       res.send(data.sitemapXml);
    } else {
       const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
       const host = req.headers['x-forwarded-host'] || req.get('host');
       const domain = `${protocol}://${host}`;
       res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/letters</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/greetings</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/travel</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/daily</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/news</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`);
    }
  });

  app.get("/rss.xml", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    const appData = await getAppDataFromFirestore();
    res.type('application/xml');
    if (data.rssXml && data.rssXml.trim() !== '' && data.rssXml.includes('<')) {
       res.send(data.rssXml);
    } else {
       const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
       const host = req.headers['x-forwarded-host'] || req.get('host');
       const domain = `${protocol}://${host}`;
       const title = appData.siteTitle || '처음 만나는 일본어';
       const description = appData.siteSubtitle || '왕초보를 위한 가장 쉽고 재미있는 일본어 놀이터';
       res.send(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${title}]]></title>
    <link>${domain}/</link>
    <description><![CDATA[${description}]]></description>
    <item>
      <title><![CDATA[${title} - 홈]]></title>
      <link>${domain}/</link>
      <description><![CDATA[${description}]]></description>
    </item>
    <item>
      <title><![CDATA[${title} - 문자 마스터]]></title>
      <link>${domain}/letters</link>
      <description><![CDATA[일본어 히라가나 카타카나 연습 마스터]]></description>
    </item>
    <item>
      <title><![CDATA[${title} - 필수 인사말]]></title>
      <link>${domain}/greetings</link>
      <description><![CDATA[일본어 기초 필수 인사말 100선]]></description>
    </item>
    <item>
      <title><![CDATA[${title} - 여행 회화]]></title>
      <link>${domain}/travel</link>
      <description><![CDATA[공항, 식당, 호텔 등 일본 여행 필수 회화]]></description>
    </item>
    <item>
      <title><![CDATA[${title} - 생활 표현]]></title>
      <link>${domain}/daily</link>
      <description><![CDATA[감정, 일상생활 일본어 표현 모음]]></description>
    </item>
    <item>
      <title><![CDATA[${title} - 일본 소식]]></title>
      <link>${domain}/news</link>
      <description><![CDATA[가장 빠른 실시간 일본 소식]]></description>
    </item>
  </channel>
</rss>`);
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
        let ogTags = '';
        if (appData.siteTitle) {
            template = template.replace(/<title>(.*?)<\/title>/, `<title>${appData.siteTitle}</title>`);
            ogTags += `  <meta property="og:title" content="${appData.siteTitle}" />\n`;
        }
        if (appData.siteSubtitle) {
            ogTags += `  <meta name="description" content="${appData.siteSubtitle}" />\n`;
            ogTags += `  <meta property="og:description" content="${appData.siteSubtitle}" />\n`;
        }
        if (appData.naverMeta) {
            let metaTag = '';
            if (appData.naverMeta.trim().startsWith('<meta')) {
               metaTag = appData.naverMeta;
            } else {
               metaTag = `<meta name="naver-site-verification" content="${appData.naverMeta}" />`;
            }
            ogTags += `  ${metaTag}\n`;
        }
        if (ogTags) {
            template = template.replace('</head>', `${ogTags}</head>`);
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
        let ogTags = '';
        if (appData.siteTitle) {
            html = html.replace(/<title>(.*?)<\/title>/, `<title>${appData.siteTitle}</title>`);
            ogTags += `  <meta property="og:title" content="${appData.siteTitle}" />\n`;
        }
        if (appData.siteSubtitle) {
            ogTags += `  <meta name="description" content="${appData.siteSubtitle}" />\n`;
            ogTags += `  <meta property="og:description" content="${appData.siteSubtitle}" />\n`;
        }
        if (appData.naverMeta) {
            let metaTag = '';
            if (appData.naverMeta.trim().startsWith('<meta')) {
               metaTag = appData.naverMeta;
            } else {
               metaTag = `<meta name="naver-site-verification" content="${appData.naverMeta}" />`;
            }
            ogTags += `  ${metaTag}\n`;
        }
        if (ogTags) {
            html = html.replace('</head>', `${ogTags}</head>`);
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
