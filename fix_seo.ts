import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace seo data state and effect
content = content.replace(
  /const \[seoData, setSeoData\] = useState\(\{ robotsTxt: '', sitemapXml: '', rssXml: '', adsTxt: '' \}\);\n\n\s*useEffect\(\(\) => \{\n\s*fetch\('\/api\/seo'\)[\s\S]*?\}, \[\]\);/g,
  `const [seoData, setSeoData] = useState(() => {
    const saved = localStorage.getItem('seoData');
    return saved ? JSON.parse(saved) : { robotsTxt: 'User-agent: *\\nAllow: /', sitemapXml: '', rssXml: '', adsTxt: '' };
  });

  useEffect(() => {
    localStorage.setItem('seoData', JSON.stringify(seoData));
    fetch('/api/seo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seoData) }).catch(console.error);
  }, [seoData]);`
);

fs.writeFileSync('src/App.tsx', content);
