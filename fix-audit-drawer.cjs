const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will just use string replacement carefully to change activeSupplier to a side panel.
let target = `       {/* DETAIL VIEW OF SINGLE SUPPLIER */}
       {activeSupplier && stats ? (`;

let replacement = `       {/* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */}
       <div className="space-y-6">
         {/* Large Elegant Search Panel */}
         <div className="bg-white/75 backdrop-blur-md border border-slate-900/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
           <div className="flex-1 flex items-center gap-3 w-full">
             <Search className="w-5 h-5 text-slate-400 shrink-0" />
             <input 
               type="text" 
               className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none text-right" 
               placeholder="نام تامین‌کننده، نام داروی شیمیایی، کد CAS یا کشور را جستجو کنید..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                 <X className="w-4 h-4" />
               </button>
             )}
           </div>
         </div>

         {/* Grid list of Suppliers */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredSuppliers.length === 0 ? (
             <div className="col-span-full bg-white border border-slate-200 p-16 rounded-2xl text-center text-slate-400 flex flex-col items-center">
               <Building className="w-12 h-12 opacity-20 mb-4 text-teal-600" />
               <span className="font-bold text-slate-600 text-lg">هیچ تامین‌کننده‌ای یافت نشد.</span>
               <p className="text-slate-400 text-sm mt-1">تغییر کوئری بدهید یا نام انگلیسی دقیق یا فارسی را وارد نمایید.</p>
             </div>
           ) : (
             filteredSuppliers.map((supplier) => {
               let scoresSum = 0;
               let scoredCount = 0;
               supplier.vendors.forEach(v => { 
                  let s = null;
                  if (currentUser?.role === 'admin') {
                    s = calculateOverallScore(v.scores, true);
                  } else if (currentUser?.role) {
                    s = v.scores?.[currentUser.role as keyof Scores] || 0;
                  }
                 if (s !== null && s > 0) {
                   scoresSum += s;
                   scoredCount++;
                 }
               });
               const avgScore = scoredCount > 0 ? Math.round(scoresSum / scoredCount) : null;

               return (
                 <div 
                   key={supplier.key}
                   onClick={() => setSelectedSupplierKey(supplier.key)}
                   className="bg-white border border-slate-900/10 rounded-2xl p-5 hover:shadow-md hover:border-teal-500/20 transition-all cursor-pointer group flex flex-col justify-between text-right"
                 >
                   <div>
                     <div className="flex items-start justify-between gap-3 mb-4">
                       <div className="bg-teal-50 border border-teal-100 text-teal-600 p-2.5 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                         <Building className="w-5 h-5" />
                       </div>
                       <div className="text-left font-mono text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[150px] truncate" title={supplier.country}>
                         {supplier.country}
                       </div>
                     </div>
                     
                     <h3 className="font-bold text-slate-800 text-base leading-snug tracking-tight group-hover:text-teal-600 transition-colors">
                       {supplier.name}
                     </h3>
                     <div className="text-slate-400 text-xs font-mono mt-1" dir="ltr" style={{ textAlign: 'right' }}>{supplier.nameEn}</div>
                     
                     {/* List of drugs supplied */}
                     <div className="mt-4 pt-3 border-t border-slate-100">
                       <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase font-sans">محصولات ثبت‌شده در دیتابیس:</span>
                       <div className="flex flex-wrap gap-1 justify-start">
                         {supplier.vendors.slice(0, 3).map((v) => (
                           <span key={v.id} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-150 font-medium max-w-[120px] truncate">
                             {v.material}
                           </span>
                         ))}
                         {supplier.vendors.length > 3 && (
                           <span className="text-[9px] bg-slate-900 text-white px-1.5 py-1 rounded font-bold font-mono">
                             +{supplier.vendors.length - 3} مورد دیگر
                           </span>
                         )}
                       </div>
                     </div>
                   </div>

                   <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <span className="text-[11px] text-slate-400 font-sans">{currentUser?.role === 'admin' ? 'میانگین امتیاز ممیزی:' : 'میانگین امتیاز واحد شما:'}</span>
                       <span className={\`text-xs font-bold \${getScoreColorClass(avgScore)} font-mono\`}>
                         {avgScore !== null ? \`\${avgScore}%\` : 'N/A'}
                       </span>
                     </div>
                     <span className="text-teal-600 group-hover:translate-x-[-4px] transition-transform text-xs font-bold flex items-center gap-1 font-mono">
                       بررسی ممیزی
                       <ChevronLeft className="w-3.5 h-3.5" />
                     </span>
                   </div>
                 </div>
               );
             })
           )}
         </div>
       </div>

       {/* Side Panel Drawer for Single Supplier */}
       <AnimatePresence>
         {activeSupplier && stats && (
           <>
             {/* Drawer Overlay */}
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
               onClick={() => setSelectedSupplierKey(null)}
               className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[2px] cursor-pointer print:hidden"
             />
             
             {/* Drawer Content */}
             <motion.div
               initial={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
               animate={{ x: 0, opacity: 1, boxShadow: '20px 0 50px rgba(0,0,0,0.1)' }}
               exit={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 left-0 w-full md:w-[85%] lg:w-[75%] xl:w-[65%] bg-slate-50 shadow-2xl z-50 border-r border-slate-200 overflow-y-auto p-6 md:p-8 space-y-6 print:static print:w-full print:border-none print:shadow-none"
             >
               <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-4">
                 <button 
                   onClick={() => setSelectedSupplierKey(null)}
                   className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
`;

// wait, replacing the whole structure would be complicated using sed/replace, since the original activeSupplier block is huge.
// Let me just rewrite SupplierAuditView locally!
