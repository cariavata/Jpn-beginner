import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace state
content = content.replace(
  /const \[bgmPlaylist, setBgmPlaylist\] = useState<string\[\]>\(\[\]\);\n\s*const \[currentBgmIndex, setCurrentBgmIndex\] = useState\(0\);/,
  "const [bgmUrl, setBgmUrl] = useState(() => localStorage.getItem('bgmUrl') || 'https://archive.org/download/beautiful-japanese-music-koto-music-shakuhachi-music/beautiful-japanese-music-koto-music-shakuhachi-music.mp3');\n  useEffect(() => { localStorage.setItem('bgmUrl', bgmUrl); }, [bgmUrl]);"
);

// Remove loadBgms
content = content.replace(/\/\/ Load BGMs from DB[\s\S]*?loadBgms\(\);\n\s*\}, \[\]\);\n/, '');

// Fix BGM logic in the audio handling
content = content.replace(
  /const performBgmChange = useCallback\(\(nextIndex: number\) => \{[\s\S]*?\}, \[bgmPlaylist, isBgmPlaying\]\);/g,
  ''
);

content = content.replace(
  /const handleNextBgm = useCallback\(\(\) => \{[\s\S]*?\}, \[bgmPlaylist, performBgmChange\]\);/g,
  ''
);

content = content.replace(
  /if \(!audioRef\.current\.src && bgmPlaylist\.length > 0\) \{\s+audioRef\.current\.src = bgmPlaylist\[currentBgmIndex\];\s+\}/g,
  "if (!audioRef.current.src && bgmUrl) {\n         audioRef.current.src = bgmUrl;\n      }"
);

// Update audio element in render
content = content.replace(
  /<audio \n\s*ref=\{audioRef\} \n\s*src=\{bgmPlaylist\[currentBgmIndex\] \|\| undefined\} \n\s*onEnded=\{handleNextBgm\}\n\s*preload="auto"\n\s*\/>/g,
  '<audio ref={audioRef} src={bgmUrl} loop preload="auto" />'
);

// Remove file inputs for BGMs and add text input
const adminBgmRegex = /<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Music size=\{18\} className="text-purple-400"\/> 배경음악 \(BGM\) 설정 \(5개까지\)<\/h3>[\s\S]*?\}\)\}\n\s*<\/div>/;
const newAdminBgm = `<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Music size={18} className="text-purple-400"/> 배경음악 (BGM) 설정</h3>
                    <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">BGM URL (무료 음악 호스팅 링크)</label>
                          <input type="text" value={bgmUrl} onChange={e => setBgmUrl(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-purple-400 focus:outline-none" placeholder="https://...mp3"/>
                        </div>
                    </div>`;

content = content.replace(adminBgmRegex, newAdminBgm);

fs.writeFileSync('src/App.tsx', content);
