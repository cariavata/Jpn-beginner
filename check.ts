import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

function checkBalance(str: string) {
  let count = 0;
  for(let i=0; i<str.length; i++) {
    if (str[i] === '{') count++;
    else if (str[i] === '}') count--;
  }
  return count;
}
console.log('Braces:', checkBalance(content));
