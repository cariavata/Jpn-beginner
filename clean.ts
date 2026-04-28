import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// remove tabBoardLabel state
content = content.replace(/const \[tabBoardLabel, setTabBoardLabel\] = useState.*?;\n/, '');
content = content.replace(/const \[boardData, setBoardData\] = useState.*?;\n/g, '');
content = content.replace(/interface BoardPost \{.*?;\n/g, '');
content = content.replace(/const saved = localStorage.getItem\('boardData'\);\n\s*return saved \? JSON\.parse\(saved\) : \[\];\n\s*}\);\n/g, '');

content = content.replace(/if \(data\.tabBoardLabel\) setTabBoardLabel\(data\.tabBoardLabel\);\n/g, '');
content = content.replace(/if \(data\.boardData\) setBoardData\(data\.boardData\);\n/g, '');

content = content.replace(/tabBoardLabel, boardData, /g, '');
content = content.replace(/tabBoardLabel, boardData/g, '');

content = content.replace(/useEffect\(\(\) => \{ localStorage\.setItem\('tabBoardLabel'.*?;\n/g, '');
content = content.replace(/useEffect\(\(\) => \{ localStorage\.setItem\('boardData'.*?;\n/g, '');

content = content.replace(/<TabButton active=\{activeTab === 'board'\}.*? \/>\n/g, '');

content = content.replace(/<div className="col-span-2">\s*<label.*?게시판 메뉴<\/label>[\s\S]*?<\/div>/, '');

fs.writeFileSync('src/App.tsx', content);
