import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the /api/data fetching and posting effect
content = content.replace(
  /const \[dataLoaded, setDataLoaded\] = useState\(false\);\n\n\s*useEffect\(\(\) => \{\n\s*fetch\('\/api\/data'\)[\s\S]*?setDataLoaded\(true\);\n\s*\}\);\n\s*\}, \[\]\);\n\n\s*useEffect\(\(\) => \{\n\s*if \(!dataLoaded\) return;\n\s*const timer = setTimeout\(\(\) => \{[\s\S]*?return \(\) => clearTimeout\(timer\);\n\s*\}, \[.*?\]\);/g,
  `const [dataLoaded, setDataLoaded] = useState(true);`
);

// 2. Put the admin stats viewer back under the SEO section 
// Find: <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
//       <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Music size={18} className="text-purple-400"/> 배경음악 (BGM) 설정</h3>
const bgmMoment = `<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Music size={18} className="text-purple-400"/> 배경음악 (BGM) 설정</h3>
                    <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">BGM URL (무료 음악 호스팅 링크)</label>
                          <input type="text" value={bgmUrl} onChange={e => setBgmUrl(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-purple-400 focus:outline-none" placeholder="https://...mp3"/>
                        </div>
                    </div>
                  </div>`;

const statsCode = `

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">📊 통계 현황 (SEO 및 유입)</h3>
                     <div className="flex gap-2 mb-4">
                        <button onClick={() => setStatsPeriod('day')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='day' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>오늘</button>
                        <button onClick={() => setStatsPeriod('week')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='week' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>최근 7일</button>
                        <button onClick={() => setStatsPeriod('month')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='month' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>이번 달</button>
                        <button onClick={() => setStatsPeriod('year')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='year' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>올해</button>
                     </div>
                     {(() => {
                        let visits = 0;
                        let referrers: Record<string, number> = {};
                        let keywords: Record<string, number> = {};
                        const dates = Object.keys(siteStats);
                        
                        const now = new Date();
                        const filterDate = (dString: string) => {
                           const d = new Date(dString);
                           if (!d.getTime()) return false;
                           if (statsPeriod === 'day') return dString === now.toISOString().split('T')[0];
                           if (statsPeriod === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
                           if (statsPeriod === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                           if (statsPeriod === 'year') return d.getFullYear() === now.getFullYear();
                           return true;
                        };

                        dates.filter(filterDate).forEach(d => {
                           visits += siteStats[d]?.visitors || 0;
                           const r = siteStats[d]?.referrers || {};
                           Object.keys(r).forEach(k => { referrers[k] = (referrers[k] || 0) + r[k]; });
                           const kw = siteStats[d]?.keywords || {};
                           Object.keys(kw).forEach(k => { keywords[k] = (keywords[k] || 0) + kw[k]; });
                        });

                        const sortedRef = Object.entries(referrers).sort((a,b) => b[1] - a[1]);
                        const sortedKeywords = Object.entries(keywords).sort((a,b) => b[1] - a[1]).slice(0, 20);

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">유입 경로 현황 (총 {visits.toLocaleString()}명)</h4>
                               <ul className="space-y-2 text-xs md:text-sm">
                                  {sortedRef.length === 0 ? <p className="text-xs text-gray-400">데이터가 없습니다.</p> : sortedRef.map(([key, count], i) => (
                                     <li key={key} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg font-medium">
                                        <span className="text-gray-700 flex items-center">
                                           <span className={\`font-bold mr-3 w-4 text-center \${i===0?'text-blue-500':i===1?'text-blue-400':i===2?'text-blue-300':'text-gray-400'}\`}>{i+1}</span>
                                           <span className="truncate max-w-[150px] md:max-w-[200px]" title={key}>{key}</span>
                                        </span>
                                        <span className="text-gray-400 text-xs">{count.toLocaleString()}명</span>
                                     </li>
                                  ))}
                               </ul>
                             </div>

                             <div>
                               <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">인기 유입 키워드 TOP 20</h4>
                               <ul className="space-y-2 text-xs md:text-sm">
                                  {sortedKeywords.length === 0 ? <p className="text-xs text-gray-400">데이터가 없습니다.</p> : sortedKeywords.map(([key, count], i) => (
                                     <li key={key} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg font-medium">
                                        <span className="text-gray-700 flex items-center">
                                           <span className={\`font-bold mr-3 w-4 text-center \${i===0?'text-red-500':i===1?'text-orange-500':i===2?'text-yellow-500':'text-gray-400'}\`}>{i+1}</span>
                                           <span className="truncate max-w-[150px] md:max-w-[200px]" title={key}>{key}</span>
                                        </span>
                                        <span className="text-gray-400 text-xs">{count.toLocaleString()}회</span>
                                     </li>
                                  ))}
                               </ul>
                             </div>
                          </div>
                        );
                    })()}
                  </div>
`;

content = content.replace(bgmMoment, bgmMoment + statsCode);

fs.writeFileSync('src/App.tsx', content);
