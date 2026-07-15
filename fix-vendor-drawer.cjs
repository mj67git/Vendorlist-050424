const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            <>
              {/* Drawer Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={goBack}
                className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[2px] cursor-pointer print:hidden"
              />
              
              {/* Drawer Content */}
              <motion.div
                initial={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                animate={{ x: 0, opacity: 1, boxShadow: '20px 0 50px rgba(0,0,0,0.1)' }}
                exit={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-full md:w-[85%] lg:w-[75%] xl:w-[65%] bg-slate-50 shadow-2xl z-50 border-r border-slate-200 overflow-y-auto print:static print:w-full print:border-none print:shadow-none"
              >
                <div className="p-4 md:p-6 lg:p-8 min-h-full">
                  <VendorDetail db={db} vendor={selectedVendor} materials={materials} onBack={goBack} onSave={handleUpdateVendor} onDelete={(id) => { handleDeleteVendor(id); goBack(); }} currentUser={currentUser} />
                </div>
              </motion.div>
            </>`;

const replacement = `            <>
              {/* Full Page Content Overlay (Preserves parent state but acts as a new page) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-[#F5F5F7] z-40 overflow-y-auto print:static print:w-full print:border-none print:shadow-none"
              >
                <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-7xl mx-auto">
                  <VendorDetail db={db} vendor={selectedVendor} materials={materials} onBack={goBack} onSave={handleUpdateVendor} onDelete={(id) => { handleDeleteVendor(id); goBack(); }} currentUser={currentUser} />
                </div>
              </motion.div>
            </>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
