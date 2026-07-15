const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. HomeView
const targetHome = `      <div className={\`overflow-hidden transition-all duration-300 ease-in-out \${showAddModal ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0'}\`}>
        {showAddModal && <VendorForm db={db} categoryId="domestic" materials={materials} onClose={() => setShowAddModal(false)} onSave={(v) => { onAddVendor(v); setShowAddModal(false); }} currentUser={currentUser} />}
      </div>`;

const replacementHome = `      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#F5F5F7] z-[60] overflow-y-auto"
          >
            <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-5xl mx-auto">
              <VendorForm db={db} categoryId="domestic" materials={materials} onClose={() => setShowAddModal(false)} onSave={(v) => { onAddVendor(v); setShowAddModal(false); }} currentUser={currentUser} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(targetHome, replacementHome);

// 2. VendorDetail -> VendorForm
const targetVendorDetail = `      {/* Editing Form */}
      <div ref={editFormRef} className={\`overflow-hidden transition-all duration-300 ease-in-out \${isEditing ? 'opacity-100 max-h-[2000px] mb-6' : 'opacity-0 max-h-0'}\`}>
        {isEditing && (
          <VendorForm 
            db={db}
            categoryId={vendor.category} 
            existingVendor={vendor}
            materials={materials}
            onClose={() => setIsEditing(false)} 
            onSave={(updated) => {
              onSave(updated);
              setIsEditing(false);
            }} 
            currentUser={currentUser}
          />
        )}
      </div>`;

const replacementVendorDetail = `      {/* Editing Form (Full Page View) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#F5F5F7] z-[70] overflow-y-auto"
          >
            <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-5xl mx-auto">
              <VendorForm 
                db={db}
                categoryId={vendor.category} 
                existingVendor={vendor}
                materials={materials}
                onClose={() => setIsEditing(false)} 
                onSave={(updated) => {
                  onSave(updated);
                  setIsEditing(false);
                }} 
                currentUser={currentUser}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(targetVendorDetail, replacementVendorDetail);

// 3. VendorDetail -> AddAnalysisForm
const targetAnalysis = `          {/* Inline Form to add laboratory record */}
          {showAddAnalysisForm && (
            <div id="add-analysis-form" className="mb-6 p-6 rounded-2xl border border-indigo-100 bg-indigo-50/25 space-y-4">
              {analysisSuccess ? (`;

const replacementAnalysis = `          {/* Full Page View for adding laboratory record */}
          <AnimatePresence>
            {showAddAnalysisForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#F5F5F7] z-[70] overflow-y-auto"
              >
                <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-5xl mx-auto space-y-6 text-right">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                    <button 
                      onClick={() => setShowAddAnalysisForm(false)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">ثبت نتیجه آزمایش جدید</h2>
                  </div>
                  
                  <div id="add-analysis-form" className="p-6 rounded-2xl border border-indigo-100 bg-white shadow-sm space-y-6">
                    {analysisSuccess ? (`;

code = code.replace(targetAnalysis, replacementAnalysis);

const targetAnalysisEnd = `                      <div className="flex justify-end gap-3 pt-6 border-t border-indigo-100 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowAddAnalysisForm(false)}
                          className="px-5 py-2.5 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-slate-100 transition-all font-semibold text-sm"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAnalysisSubmit}
                          disabled={!newAnalysis.qcCode || !newAnalysis.date}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>ثبت در سیستم (Commit)</span>
                        </button>
                      </div>
                    </form>
                  </>
                )}
            </div>
          )}`;

const replacementAnalysisEnd = `                      <div className="flex justify-end gap-3 pt-6 border-t border-indigo-100 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowAddAnalysisForm(false)}
                          className="px-5 py-2.5 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-slate-100 transition-all font-semibold text-sm cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAnalysisSubmit}
                          disabled={!newAnalysis.qcCode || !newAnalysis.date}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>ثبت در سیستم (Commit)</span>
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(targetAnalysisEnd, replacementAnalysisEnd);

fs.writeFileSync('src/App.tsx', code);
