const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetDetailStart = `      {/* DETAIL VIEW OF SINGLE SUPPLIER */}
      {activeSupplier && stats ? (
        <div className="space-y-6">
          {/* Supplier Profile Banner Card */}`;

const replacementDetailStart = `      {/* DETAIL VIEW OF SINGLE SUPPLIER */}
      <AnimatePresence>
        {activeSupplier && stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#F5F5F7] z-40 overflow-y-auto"
          >
            <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-7xl mx-auto space-y-6">
              {/* Supplier Profile Banner Card */}`;

code = code.replace(targetDetailStart, replacementDetailStart);

const targetElseStart = `          </div>
      ) : (
        /* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */
        <div className="space-y-6">`;

const replacementElseStart = `            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */}
      <div className="space-y-6">`;

code = code.replace(targetElseStart, replacementElseStart);

// Remove the end parenthesis of the ternary
const targetEnd = `              ))}
            </div>
          </div>
        </div>
      )}
    </div>`;

const replacementEnd = `              ))}
            </div>
          </div>
        </div>
    </div>`;

code = code.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/App.tsx', code);
