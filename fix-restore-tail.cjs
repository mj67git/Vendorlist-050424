const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// The last `       )}` is at the 3rd line from bottom
let idx = lines.length - 1;
while(idx >= 0 && !lines[idx].includes('     </div>')) {
  idx--;
}
if(idx >= 0) {
  lines.splice(idx, 0, '       )}');
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
