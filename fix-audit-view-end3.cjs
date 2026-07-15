const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `           </div>
           </div>
       ) : (
         /* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */
         <div className="space-y-6">`;

let match = code.match(/           <\/div>\n           <\/div>\n       \) : \(\n         \/\* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS \*\/\n         <div className="space-y-6">/);
console.log(!!match);

const replacement = `               </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>

       {/* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */}
       <div className="space-y-6">`;

code = code.replace(/           <\/div>\n           <\/div>\n       \) : \(\n         \/\* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS \*\/\n         <div className="space-y-6">/, replacement);
fs.writeFileSync('src/App.tsx', code);
