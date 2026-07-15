const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                {/* Breadcrumbs for visual path stack removed as requested */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 select-none overflow-hidden max-w-[320px] xl:max-w-[450px]">
                </div>`;

const replacement = `                {/* Breadcrumbs for visual path stack */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 select-none overflow-hidden max-w-[320px] xl:max-w-[450px]">
                   {viewHistory.map((state, idx) => {
                     const isLast = idx === viewHistory.length - 1;
                     const label = getViewStateLabel(state);
                     if (!label) return null;
                     return (
                       <React.Fragment key={idx}>
                         {idx > 0 && <ChevronLeft className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                         <button 
                           onClick={() => setViewHistory(prev => prev.slice(0, idx + 1))}
                           className={\`truncate transition-colors \${isLast ? 'font-bold text-slate-700 pointer-events-none' : 'hover:text-[#0071E3] cursor-pointer'}\`}
                         >
                           {label}
                         </button>
                       </React.Fragment>
                     );
                   })}
                </div>`;

fs.writeFileSync('src/App.tsx', code.replace(target, replacement));
console.log('Breadcrumbs fixed');
