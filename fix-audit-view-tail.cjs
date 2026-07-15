const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// The last `       )}` is at the 3rd line from bottom
let idx = lines.length - 1;
while(idx >= 0 && !lines[idx].includes('       )}')) {
  idx--;
}
if(idx >= 0) {
  lines[idx] = ''; // remove it
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
