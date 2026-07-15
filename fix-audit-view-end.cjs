const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `           </div>
           </div>
       ) : (
         /* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */
         <div className="space-y-6">`;

const replacement = `           </div>
               </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>

       {/* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */}
       <div className="space-y-6">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
