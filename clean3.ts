import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/interface BoardPost.*?;\s*}\s*/g, '');
content = content.replace(/const \[boardData, setBoardData\] = useState(?:<BoardPost\[\]>)?\(\(\) => \{\s*/g, '');

fs.writeFileSync('src/App.tsx', content);
