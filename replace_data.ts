import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/import \{ Save, .*?\} from 'lucide-react';/g, ''); // just in case
content = content.replace(/import \{ Volume2, /g, "import { INITIAL_GREETINGS_DATA, INITIAL_TRAVEL_DATA, INITIAL_DAILY_DATA } from './initialData';\nimport { Volume2, ");

content = content.replace(/const INITIAL_GREETINGS_DATA: SentenceItem\[\] = \[[\s\S]*?\];/g, '');
content = content.replace(/const INITIAL_TRAVEL_DATA: SentenceItem\[\] = \[[\s\S]*?\];/g, '');
content = content.replace(/const INITIAL_DAILY_DATA: SentenceItem\[\] = \[[\s\S]*?\];/g, '');

fs.writeFileSync('src/App.tsx', content);
