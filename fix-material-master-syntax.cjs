const fs = require('fs');
let code = fs.readFileSync('src/components/MaterialMasterView.tsx', 'utf8');

const target = `            </div>
          </div>
        )}

      {/* Side Panel Drawer for MaterialForm */}`;

const replacement = `            </div>
          </div>

      {/* Side Panel Drawer for MaterialForm */}`;
code = code.replace(target, replacement);

fs.writeFileSync('src/components/MaterialMasterView.tsx', code);
