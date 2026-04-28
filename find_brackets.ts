import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

const stack = [];
for (let i = 0; i < content.length; i++) {
  const c = content[i];
  const line = content.substring(0, i).split('\n').length;
  if (c === '{' || c === '(') {
    stack.push({ char: c, line });
  } else if (c === '}' || c === ')') {
    const last = stack[stack.length - 1];
    if (last && ((last.char === '{' && c === '}') || (last.char === '(' && c === ')'))) {
      stack.pop();
    }
  }
}
console.log('Unmatched:', stack);
