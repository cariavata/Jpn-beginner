import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('border-gray-100">')) {
     // Check if followed by Music
     if (lines[i+1] && lines[i+1].includes('<Music')) {
        // Keep it.
     }
  }
}
// This is tedious. Let's just use a clear regex.
// We want to delete from the stray `</div>` right after `bgmUrl` text input down to the line before `</motion.div>`.
content = content.replace(
  /                             <\/div>\n\n                             <div>\n[\s\S]*?              <\/div>\n            <\/div>/,
  "                  </div>\n                </div>\n              </div>\n            </div>"
);

fs.writeFileSync('src/App.tsx', content);
