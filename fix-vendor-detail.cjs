const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      {/* Back Button */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 mb-6 text-sm text-slate-400 hover:text-slate-700 transition-colors w-fit font-medium"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>بازگشت به لیست</span>
      </button>`;

const replacement = `      {/* Close Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 print:hidden">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-bold text-slate-600">مشخصات تامین‌کننده</span>
      </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed back button in VendorDetail');
