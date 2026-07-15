const fs = require('fs');
let lines = fs.readFileSync('src/components/MaterialMasterView.tsx', 'utf8').split('\n');
lines[395] = '';
fs.writeFileSync('src/components/MaterialMasterView.tsx', lines.join('\n'));
