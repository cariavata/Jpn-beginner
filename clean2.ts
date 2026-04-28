import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const \[isAddingBoard, setIsAddingBoard\] = useState\(false\);\n/g, '');
content = content.replace(/\{\/\* Board Post Modal \*\/\}[\s\S]*?isAddingBoard && \([\s\S]*?\}\)/, '');

content = content.replace(/function BoardFormContent\(\{ close, onAdd \}: any\) \{[\s\S]*?\}\n/g, '');

content = content.replace(/import ReactMarkdown from 'react-markdown';\n/g, '');
content = content.replace(/import remarkGfm from 'remark-gfm';\n/g, '');

content = content.replace(/, Image } from 'lucide-react';/g, '} from \'lucide-react\';');

fs.writeFileSync('src/App.tsx', content);
