const fs = require('fs');
let code = fs.readFileSync('src/components/ShamsiDatePicker.tsx', 'utf8');

const target = `      {/* Input Field */}
      <div 
        className={\`flex items-center justify-between w-full bg-white border border-slate-250 rounded-xl px-3 py-2 cursor-pointer
          \${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-indigo-300'} transition-all\`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 flex-1">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span className={\`font-mono text-sm leading-none \${value ? 'text-slate-800' : 'text-slate-400'}\`}>
            {value || placeholder}
          </span>
        </div>`;

const replacement = `      {/* Input Field */}
      <div 
        className={\`flex items-center justify-between w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all
          \${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-indigo-300'}\`}
      >
        <div className="flex items-center gap-2 flex-1">
          <CalendarIcon 
            className="w-4 h-4 text-slate-400 cursor-pointer" 
            onClick={() => !disabled && setIsOpen(!isOpen)} 
          />
          <input
            type="text"
            dir="ltr"
            placeholder="1403/01/01"
            className="w-full bg-transparent font-mono text-sm text-left text-slate-800 focus:outline-none disabled:cursor-not-allowed"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              let val = e.target.value.replace(/\\D/g, '');
              if (val.length > 4) val = val.substring(0, 4) + '/' + val.substring(4);
              if (val.length > 7) val = val.substring(0, 7) + '/' + val.substring(7);
              if (val.length > 10) val = val.substring(0, 10);
              onChange(val);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/ShamsiDatePicker.tsx', code);
