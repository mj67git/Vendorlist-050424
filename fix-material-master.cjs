const fs = require('fs');
let code = fs.readFileSync('src/components/MaterialMasterView.tsx', 'utf8');

let target = `      {subView === 'list' && (
        <div className="space-y-6">`;

let replacement = `      {/* ALWAYS RENDER LIST */}
        <div className="space-y-6">`;
code = code.replace(target, replacement);

target = `      {subView === 'form' && (
        <MaterialForm
          materials={materials}
          existingMaterial={editingMaterial || undefined}
          onSave={handleSave}
          onClose={() => setSubView('list')}
        />
      )}`;

replacement = `      {/* Side Panel Drawer for MaterialForm */}
      <AnimatePresence>
        {subView === 'form' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSubView('list')}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[2px] cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
              animate={{ x: 0, opacity: 1, boxShadow: '20px 0 50px rgba(0,0,0,0.1)' }}
              exit={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-full md:w-[60%] lg:w-[50%] xl:w-[45%] bg-slate-50 shadow-2xl z-50 border-r border-slate-200 overflow-y-auto"
            >
              <div className="p-4 md:p-6 lg:p-8 min-h-full">
                <MaterialForm
                  materials={materials}
                  existingMaterial={editingMaterial || undefined}
                  onSave={handleSave}
                  onClose={() => setSubView('list')}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>`;
code = code.replace(target, replacement);


target = `      {subView === 'detail' && selectedMaterial && (
        <MaterialDetailView
          material={selectedMaterial}
          linkedVendors={linkedVendors}
          onBack={() => setSubView('list')}
          onNavigateToVendor={onNavigateToVendor}
        />
      )}`;

replacement = `      {/* Side Panel Drawer for MaterialDetailView */}
      <AnimatePresence>
        {subView === 'detail' && selectedMaterial && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSubView('list')}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[2px] cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
              animate={{ x: 0, opacity: 1, boxShadow: '20px 0 50px rgba(0,0,0,0.1)' }}
              exit={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-full md:w-[70%] lg:w-[60%] xl:w-[50%] bg-slate-50 shadow-2xl z-50 border-r border-slate-200 overflow-y-auto"
            >
              <div className="p-4 md:p-6 lg:p-8 min-h-full">
                <MaterialDetailView
                  material={selectedMaterial}
                  linkedVendors={linkedVendors}
                  onBack={() => setSubView('list')}
                  onNavigateToVendor={onNavigateToVendor}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>`;
code = code.replace(target, replacement);

// We need to find the `)}` that closed `subView === 'list' && (`
// Let's replace the last `)}` before `{subView === 'form'`

let target3 = `            </div>
          </div>
        </div>
      )}
      {/* Side Panel Drawer`;

let replacement3 = `            </div>
          </div>
        </div>
      {/* Side Panel Drawer`;

code = code.replace(target3, replacement3);

fs.writeFileSync('src/components/MaterialMasterView.tsx', code);
console.log('MaterialMasterView updated');
