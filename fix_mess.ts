import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  /<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Music size=\{18\} className="text-purple-400"\/> 배경음악 \(BGM\) 설정<\/h3>[\s\S]*?\}\)\(\)\}\n\s*<\/div>/,
  `  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Music size={18} className="text-purple-400"/> 통계 현황 (SEO 및 유입)</h3>
                     <div className="flex gap-2 mb-4">
                        <button onClick={() => setStatsPeriod('day')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='day' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>오늘</button>
                        <button onClick={() => setStatsPeriod('week')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='week' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>최근 7일</button>
                        <button onClick={() => setStatsPeriod('month')} className={\`px-3 py-1.5 rounded-lg text-xs font-bold \${statsPeriod==='month' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}>이번 달</button>
                     </div>
                     {(() => {
                        let visits = 0;
                        let referrers: Record<string, number> = {};
                        let keywords: Record<string, number> = {};
                        const dates = Object.keys(siteStats);
                        
                        const now = new Date();
                        const filterDate = (dString: string) => {
                           const d = new Date(dString);
                           if (statsPeriod === 'day') return dString === now.toISOString().split('T')[0];
                           if (statsPeriod === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
                           if (statsPeriod === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                             {/* Stats ... omitted code was replaced by my regex... */}
                          </div>
                      );
                   })()}
                 </div>`
);
// Honestly, that's complex. Let me just view github log or redo from an earlier version.
