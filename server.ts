import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, orderBy, query, limit } from "firebase/firestore";

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

  async function getAllNewsFromFirestore() {
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(200));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch(e) {
      console.error("Error fetching news list for SEO:", e);
      return [];
    }
  }

  async function getNewsByIdFromFirestore(id: string) {
    try {
      const docSnap = await getDoc(doc(db, 'news', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as any;
      }
    } catch(e) {
      console.error(`Error fetching news ${id} for SEO:`, e);
    }
    return null;
  }

  function escapeHtml(str: string) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function generateSeoTags(req: express.Request, rawUrl: string) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const domain = `${protocol}://${host}`;

    const cleanPath = rawUrl.split('?')[0].split('#')[0];
    const pathParts = cleanPath.substring(1).split('/');
    const section = pathParts[0] || 'home';
    const subId = pathParts[1];

    const appData = await getAppDataFromFirestore();

    const defaultSiteTitle = appData.siteTitle || '처음 만나는 일본어 🌸';
    const defaultSiteSubtitle = appData.siteSubtitle || '왕초보를 위한 가장 쉽고 재미있는 일본어 공부 놀이터';

    let pageTitle = defaultSiteTitle;
    let pageDesc = `${defaultSiteSubtitle}. 히라가나, 가타카나, 필수 인사말, 여행 회화, 일상 표현, 일본 최신 소식까지 한번에!`;
    let pageImage = `${domain}/icon.png`;
    let ogType = 'website';
    let jsonLdScript = '';

    const fullCanonicalUrl = `${domain}${cleanPath === '/' ? '' : cleanPath}`;

    if (section === 'home' || cleanPath === '' || cleanPath === '/') {
      pageTitle = `${defaultSiteTitle}`;
      pageDesc = `${defaultSiteSubtitle}. 히라가나, 가타카나, 필수 인사말, 여행 회화, 일상 표현, 일본 최신 소식 제공.`;
      
      const jsonLdData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": defaultSiteTitle,
            "alternateName": "처음 만나는 일본어 - 기초 일본어 공부 & 최신 소식",
            "url": domain,
            "description": defaultSiteSubtitle
          },
          {
            "@type": "SiteNavigationElement",
            "name": "글자 익히기",
            "url": `${domain}/letters`,
            "description": "히라가나 및 가타카나 오디오 발음 및 쓰기 학습"
          },
          {
            "@type": "SiteNavigationElement",
            "name": "기본 인사말",
            "url": `${domain}/greetings`,
            "description": "일본어 필수 기초 인사말 100선"
          },
          {
            "@type": "SiteNavigationElement",
            "name": "여행 회화",
            "url": `${domain}/travel`,
            "description": "공항, 호텔, 식당, 쇼핑 일본 여행 필수 회화"
          },
          {
            "@type": "SiteNavigationElement",
            "name": "일상 회화",
            "url": `${domain}/daily`,
            "description": "생활속 유용한 일본어 회화 표현"
          },
          {
            "@type": "SiteNavigationElement",
            "name": "일본 소식",
            "url": `${domain}/news`,
            "description": "최신 일본 정보, 문화, 뉴스 및 트렌드"
          }
        ]
      };
      jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLdData)}</script>`;

    } else if (section === 'letters') {
      pageTitle = `글자 익히기 (히라가나/가타카나) | ${defaultSiteTitle}`;
      pageDesc = `히라가나와 가타카나의 정확한 오디오 발음과 암기 가이드를 확인해보세요.`;
    } else if (section === 'greetings') {
      pageTitle = `기본 인사말 | ${defaultSiteTitle}`;
      pageDesc = `일상생활과 일본 여행에서 바로 쓰이는 필수 일본어 인사말 모음과 오디오 발음.`;
    } else if (section === 'travel') {
      pageTitle = `여행 회화 | ${defaultSiteTitle}`;
      pageDesc = `공항, 식당, 호텔, 길묻기 등 일본 여행에서 필수적인 실전 회화 표현 가이드.`;
    } else if (section === 'daily') {
      pageTitle = `일상 회화 | ${defaultSiteTitle}`;
      pageDesc = `상황별 감정 표현 및 일상생활 속에서 자주 쓰이는 유용한 일본어 회화 표현.`;
    } else if (section === 'news') {
      if (subId) {
        const newsArticle = await getNewsByIdFromFirestore(subId);
        if (newsArticle) {
          pageTitle = `${newsArticle.title} | 일본 소식 - ${defaultSiteTitle}`;
          const cleanContent = (newsArticle.content || '').replace(/[#*`>]/g, '').trim().slice(0, 160);
          pageDesc = cleanContent || `일본 소식: ${newsArticle.title}`;
          if (newsArticle.thumbnail) {
            pageImage = newsArticle.thumbnail;
          }
          ogType = 'article';

          const jsonLdData = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": newsArticle.title,
            "description": pageDesc,
            "image": [pageImage],
            "datePublished": newsArticle.createdAt ? new Date(newsArticle.createdAt).toISOString() : new Date().toISOString(),
            "dateModified": newsArticle.createdAt ? new Date(newsArticle.createdAt).toISOString() : new Date().toISOString(),
            "mainEntityOfPage": fullCanonicalUrl,
            "author": {
              "@type": "Organization",
              "name": defaultSiteTitle,
              "url": domain
            },
            "publisher": {
              "@type": "Organization",
              "name": defaultSiteTitle,
              "url": domain
            }
          };
          jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLdData)}</script>`;
        } else {
          pageTitle = `일본 소식 | ${defaultSiteTitle}`;
          pageDesc = `실시간으로 업데이트되는 일본의 최신 소식과 이슈 트렌드를 확인하세요.`;
        }
      } else {
        pageTitle = `일본 소식 | ${defaultSiteTitle}`;
        pageDesc = `실시간으로 업데이트되는 일본의 최신 소식과 이슈 트렌드를 확인하세요.`;
      }
    }

    let injectedTags = `
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDesc)}" />
    <meta name="keywords" content="일본어, 일본어 공부, 히라가나, 가타카나, 일본어 회화, 일본 여행 회화, 일본 소식, 일본 뉴스, 기초 일본어" />
    <meta name="robots" content="index, follow" />
    <meta name="google-adsense-account" content="ca-pub-6799823492487492" />
    <link rel="canonical" href="${fullCanonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="${escapeHtml(defaultSiteTitle)}" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDesc)}" />
    <meta property="og:url" content="${fullCanonicalUrl}" />
    <meta property="og:image" content="${pageImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
    <meta name="twitter:image" content="${pageImage}" />
`;

    if (appData.naverMeta) {
      let metaTag = appData.naverMeta.trim().startsWith('<meta')
        ? appData.naverMeta
        : `<meta name="naver-site-verification" content="${appData.naverMeta}" />`;
      injectedTags += `    ${metaTag}\n`;
    }

    if (appData.googleMeta) {
      let metaTag = appData.googleMeta.trim().startsWith('<meta')
        ? appData.googleMeta
        : `<meta name="google-site-verification" content="${appData.googleMeta}" />`;
      injectedTags += `    ${metaTag}\n`;
    }

    if (jsonLdScript) {
      injectedTags += `    ${jsonLdScript}\n`;
    }

    return injectedTags;
  }

  function injectSeoIntoHtml(html: string, seoTags: string) {
    let cleanedHtml = html
      .replace(/<title>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta\s+name="description"[\s\S]*?>/gi, '')
      .replace(/<meta\s+name="keywords"[\s\S]*?>/gi, '')
      .replace(/<meta\s+name="robots"[\s\S]*?>/gi, '')
      .replace(/<link\s+rel="canonical"[\s\S]*?>/gi, '');

    return cleanedHtml.replace('</head>', `${seoTags}</head>`);
  }

  // Serve the actual files
  app.get("/robots.txt", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const domain = `${protocol}://${host}`;

    res.type('text/plain');
    if (data.robotsTxt && data.robotsTxt.trim() !== '') {
      let content = data.robotsTxt;
      if (!content.includes('Sitemap:')) {
        content += `\n\nSitemap: ${domain}/sitemap.xml`;
      }
      res.send(content);
    } else {
      res.send(`User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml`);
    }
  });

  app.get("/ads.txt", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    res.type('text/plain');
    res.send(data.adsTxt || 'google.com, pub-6799823492487492, DIRECT, f08c47fec0942fa0');
  });

  app.get("/sitemap.xml", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    res.type('application/xml');
    
    if (data.sitemapXml && data.sitemapXml.trim() !== '' && data.sitemapXml.includes('<loc>')) {
      res.send(data.sitemapXml);
      return;
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const domain = `${protocol}://${host}`;

    const newsList = await getAllNewsFromFirestore();
    
    let newsUrlsXml = '';
    newsList.forEach(item => {
      const dateStr = item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString();
      newsUrlsXml += `
  <url>
    <loc>${domain}/news/${item.id}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/letters</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/greetings</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/travel</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/daily</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/news</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${newsUrlsXml}
</urlset>`;

    res.send(sitemap.trim());
  });

  app.get("/rss.xml", async (req, res) => {
    const data = await getSeoDataFromFirestore();
    const appData = await getAppDataFromFirestore();
    res.type('application/xml');
    
    if (data.rssXml && data.rssXml.trim() !== '' && data.rssXml.includes('<item>')) {
      res.send(data.rssXml);
      return;
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const domain = `${protocol}://${host}`;
    const title = appData.siteTitle || '처음 만나는 일본어 🌸';
    const description = appData.siteSubtitle || '왕초보를 위한 가장 쉽고 재미있는 일본어 공부 놀이터';

    const newsList = await getAllNewsFromFirestore();

    let itemsXml = `
    <item>
      <title><![CDATA[${title} - 홈]]></title>
      <link>${domain}/</link>
      <description><![CDATA[${description}]]></description>
      <guid>${domain}/</guid>
    </item>
    <item>
      <title><![CDATA[글자 익히기 (히라가나/가타카나)]]></title>
      <link>${domain}/letters</link>
      <description><![CDATA[히라가나와 가타카나를 오디오 발음과 함께 쉽게 암기해보세요.]]></description>
      <guid>${domain}/letters</guid>
    </item>
    <item>
      <title><![CDATA[기본 인사말]]></title>
      <link>${domain}/greetings</link>
      <description><![CDATA[일본어의 기본인 필수 인사말 100선과 오디오 발음.]]></description>
      <guid>${domain}/greetings</guid>
    </item>
    <item>
      <title><![CDATA[여행 회화]]></title>
      <link>${domain}/travel</link>
      <description><![CDATA[공항, 호텔, 식당, 쇼핑 등 일본 여행 필수 회화 가이드.]]></description>
      <guid>${domain}/travel</guid>
    </item>
    <item>
      <title><![CDATA[일상 회화]]></title>
      <link>${domain}/daily</link>
      <description><![CDATA[일상 생활에서 자주 쓰이는 유용한 일본어 회화 표현.]]></description>
      <guid>${domain}/daily</guid>
    </item>
    <item>
      <title><![CDATA[일본 소식 & 트렌드]]></title>
      <link>${domain}/news</link>
      <description><![CDATA[가장 빠른 실시간 일본 소식과 문화 트렌드 정보.]]></description>
      <guid>${domain}/news</guid>
    </item>`;

    newsList.forEach(item => {
      const itemTitle = item.title ? item.title.replace(/]]>/g, ']]&gt;') : '일본 소식';
      const itemContent = item.content ? item.content.replace(/[#*`>]/g, '').slice(0, 300) : '';
      const pubDate = item.createdAt ? new Date(item.createdAt).toUTCString() : new Date().toUTCString();
      itemsXml += `
    <item>
      <title><![CDATA[${itemTitle}]]></title>
      <link>${domain}/news/${item.id}</link>
      <description><![CDATA[${itemContent}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${domain}/news/${item.id}</guid>
    </item>`;
    });

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${title}]]></title>
    <link>${domain}/</link>
    <description><![CDATA[${description}]]></description>
    <language>ko-KR</language>
    ${itemsXml}
  </channel>
</rss>`;

    res.send(rss.trim());
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
        
        const seoTags = await generateSeoTags(req, url);
        template = injectSeoIntoHtml(template, seoTags);

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
        
        const seoTags = await generateSeoTags(req, req.originalUrl);
        html = injectSeoIntoHtml(html, seoTags);

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
