const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    return (
     <div className="space-y-6 fade-in text-right">
       {/* Breadcrumbs / View switcher header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
         <div>
           {activeSupplier ? (
             <button 
               onClick={() => setSelectedSupplierKey(null)}
               className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-bold border border-slate-200 bg-white rounded-xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
             >
               <ChevronLeft className="w-4 h-4 rotate-180 text-slate-400" />
               <span>بازگشت به مانیتور جامع تامین‌کنندگان</span>
             </button>
           ) : (
             <div className="flex items-center gap-2 bg-teal-50 text-teal-600 border border-teal-200/50 px-3 py-1 rounded-lg text-xs font-bold font-mono">
               <Activity className="w-3.5 h-3.5 animate-pulse" />
               <span>PROACTIVE ACTIVE DISCOVERY MODULE</span>
             </div>
           )}
         </div>

         <div className="order-1 md:order-2 text-right">
           <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1.5 flex items-center justify-end gap-3">
             {activeSupplier ? 'کارنامه جامع ممیزی و تامین' : 'بررسی یکپارچه تامین‌کنندگان (Supplier Core)'}
             <Handshake className="w-6 h-6 text-teal-600" />
           </h2>
           <p className="text-[#6E6E73] text-sm">
             {activeSupplier 
               ? 'تجمیع اطلاعات تامین کالا، پایداری کیفیت و سوابق ممیزی اقلام'
               : 'مشاهده و مانیتورینگ متمرکز تامین‌کنندگان، تعداد مواد عرضه شده و گرید کیفی میانگین'
             }
           </p>
         </div>
       </div>

       {/* DETAIL VIEW OF SINGLE SUPPLIER */}
       {activeSupplier && stats ? (`;

const replacement = `    return (
     <div className="space-y-6 fade-in text-right">
       {/* Breadcrumbs / View switcher header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
         <div>
             <div className="flex items-center gap-2 bg-teal-50 text-teal-600 border border-teal-200/50 px-3 py-1 rounded-lg text-xs font-bold font-mono">
               <Activity className="w-3.5 h-3.5 animate-pulse" />
               <span>PROACTIVE ACTIVE DISCOVERY MODULE</span>
             </div>
         </div>

         <div className="order-1 md:order-2 text-right">
           <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1.5 flex items-center justify-end gap-3">
             بررسی یکپارچه تامین‌کنندگان (Supplier Core)
             <Handshake className="w-6 h-6 text-teal-600" />
           </h2>
           <p className="text-[#6E6E73] text-sm">
             مشاهده و مانیتورینگ متمرکز تامین‌کنندگان، تعداد مواد عرضه شده و گرید کیفی میانگین
           </p>
         </div>
       </div>

       {/* Drawer for DETAIL VIEW OF SINGLE SUPPLIER */}
       <AnimatePresence>
         {activeSupplier && stats && (
           <>
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
               onClick={() => setSelectedSupplierKey(null)}
               className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[2px] cursor-pointer print:hidden"
             />
             <motion.div
               initial={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
               animate={{ x: 0, opacity: 1, boxShadow: '20px 0 50px rgba(0,0,0,0.1)' }}
               exit={{ x: '-100%', opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 left-0 w-full md:w-[85%] lg:w-[75%] xl:w-[65%] bg-slate-50 shadow-2xl z-50 border-r border-slate-200 overflow-y-auto print:static print:w-full print:border-none print:shadow-none"
             >
               <div className="p-4 md:p-6 lg:p-8 min-h-full space-y-6 text-right">
                 <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-4 print:hidden">
                   <button 
                     onClick={() => setSelectedSupplierKey(null)}
                     className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                   <span className="font-bold text-slate-600">کارنامه جامع ممیزی و تامین</span>
                 </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
