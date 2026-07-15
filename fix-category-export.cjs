const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1 flex items-center gap-2">
            <meta.icon className="w-6 h-6 text-[#0071E3]" />
            {meta.fa}
          </h2>
          <p className="text-xs font-mono text-[#86868B] uppercase tracking-wider">{meta.en}</p>
        </div>
      </div>`;

const replacement = `        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1 flex items-center gap-2">
            <meta.icon className="w-6 h-6 text-[#0071E3]" />
            {meta.fa}
          </h2>
          <p className="text-xs font-mono text-[#86868B] uppercase tracking-wider">{meta.en}</p>
        </div>
        <button 
          onClick={() => exportCategoryToExcel(categoryVendors, categoryId, meta.fa)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>خروجی Excel</span>
        </button>
      </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
