const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarButton 
              icon={Home} label="صفحه اصلی" 
              variant="home"
              active={view === 'home' && !selectedVendor} 
              onClick={() => navigate('home')} 
            />
            <div className="pt-5 pb-2 px-4 text-xs font-mono uppercase tracking-widest text-slate-300">CATEGORIES</div>
            {(Object.entries(categoryLabels) as [Category, any][]).map(([id, meta]) => (
              <SidebarButton 
                key={id}
                variant={id}
                icon={meta.icon} label={meta.fa} sub={meta.en}
                active={view === 'category' && categoryId === id && !selectedVendor} 
                onClick={() => navigate('category', id)} 
              />
            ))}
            <div className="pt-5 pb-2 px-4 text-xs font-mono uppercase tracking-widest text-slate-300">MANAGEMENT</div>
            {currentUser?.role === 'admin' && (
              <SidebarButton 
                icon={Archive} label="آرشیو کامل" 
                variant="archive"
                active={view === 'archive' && !selectedVendor} 
                onClick={() => navigate('archive')} 
              />
            )}
            <SidebarButton 
              icon={Handshake} label="بررسی یکپارچه تامین‌کننده" 
              variant="supplier-audit"
              active={view === 'supplier-audit' && !selectedVendor} 
              onClick={() => navigate('supplier-audit')} 
            />
            <SidebarButton 
              icon={Layers} label="بانک مواد اولیه (Material)" 
              variant="material-master"
              active={view === 'material-master' && !selectedVendor} 
              onClick={() => navigate('material-master')} 
            />
          </nav>`;

const replacement = `          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="pb-2 px-4 text-[10px] font-bold text-slate-400">عملیات اصلی (CORE)</div>
            <SidebarButton 
              icon={Home} label="داشبورد ارزیابی" sub="Overview"
              variant="home"
              active={view === 'home' && !selectedVendor} 
              onClick={() => navigate('home')} 
            />
            {(Object.entries(categoryLabels) as [Category, any][]).filter(([id]) => id !== 'blacklist').map(([id, meta]) => (
              <SidebarButton 
                key={id}
                variant={id}
                icon={meta.icon} label={meta.fa} sub={meta.en}
                active={view === 'category' && categoryId === id && !selectedVendor} 
                onClick={() => navigate('category', id)} 
              />
            ))}
            
            <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-400">اطلاعات پایه (MASTER DATA)</div>
            <SidebarButton 
              icon={Layers} label="بانک مواد اولیه" sub="Materials Directory"
              variant="material-master"
              active={view === 'material-master' && !selectedVendor} 
              onClick={() => navigate('material-master')} 
            />
            <SidebarButton 
              icon={Handshake} label="دایرکتوری تامین‌کنندگان" sub="Supplier Core"
              variant="supplier-audit"
              active={view === 'supplier-audit' && !selectedVendor} 
              onClick={() => navigate('supplier-audit')} 
            />
            <SidebarButton 
              variant="blacklist"
              icon={categoryLabels['blacklist'].icon} label={categoryLabels['blacklist'].fa} sub={categoryLabels['blacklist'].en}
              active={view === 'category' && categoryId === 'blacklist' && !selectedVendor} 
              onClick={() => navigate('category', 'blacklist')} 
            />
            
            {currentUser?.role === 'admin' && (
              <>
                <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-slate-400">گزارشات و بایگانی (REPORTS)</div>
                <SidebarButton 
                  icon={Archive} label="آرشیو جامع ارزیابی‌ها" sub="All Audits Archive"
                  variant="archive"
                  active={view === 'archive' && !selectedVendor} 
                  onClick={() => navigate('archive')} 
                />
              </>
            )}
          </nav>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
