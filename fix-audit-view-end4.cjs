const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `               </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>

       {/* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */}
       <div className="space-y-6">`;

code = code.replace(/<\/div>\s*<\/div>\s*\)\s*:\s*\(\s*\/\* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS \*\/\s*<div className="space-y-6">/, replacement);
fs.writeFileSync('src/App.tsx', code);
