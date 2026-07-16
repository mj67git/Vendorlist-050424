import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Vendor, User, Category } from '../../types';
import { Material } from '../MaterialForm';
import { VendorForm } from './VendorForm';
import { MaterialRoleBadge } from '../MaterialRoleBadge';
import { categoryLabels, categoryCardStyles } from '../../utils/constants';

export interface HomeViewProps {
  db: Vendor[];
  onNavigate: (view: 'home' | 'category' | 'archive' | 'supplier-audit' | 'material-master' | 'audit-center', categoryId?: Category | null) => void;
  onSelectVendor: (vendor: Vendor | null) => void;
  onAddVendor: (v: Vendor) => void;
  currentUser: User;
  onDownloadBackup?: () => void;
  materials?: Material[];
}

export function HomeView({
  db,
  onNavigate,
  onSelectVendor,
  onAddVendor,
  currentUser,
  onDownloadBackup,
  materials = []
}: HomeViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const stats = useMemo(() => {
    return {
      total: db.length,
      gradeA: db.filter(v => v.grade === 'A').length,
      gradeB: db.filter(v => v.grade === 'B').length,
      gradeC: db.filter(v => v.grade === 'C').length,
      rejected: db.filter(v => v.grade === 'rejected' || v.status === 'rejected').length
    };
  }, [db]);

  return (
    <div className="space-y-8 fade-in">
      {/* HERO SECTION */}
      <div className="border-b border-slate-900/10 pb-5">
        <div className="text-[#0891b2] font-mono text-xs tracking-widest uppercase mb-2">Vendor Dashboard</div>
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">Vendor List & Supplier Evaluation System</h2>
            <p className="text-slate-500 text-sm">داشبورد جامع ارزیابی و مدیریت وضعیت تامین‌کنندگان</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {currentUser && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:brightness-105 active:scale-95 text-white rounded-xl shadow-[0_4px_14px_rgba(8,145,178,0.25)] transition-all flex items-center justify-center gap-2 text-sm font-bold shrink-0"
              >
                <Plus className="w-5 h-5" />
                ثبت سورس جدید
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#F5F5F7] z-[60] overflow-y-auto"
          >
            <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-5xl mx-auto">
              <VendorForm 
                db={db} 
                categoryId="domestic" 
                materials={materials} 
                onClose={() => setShowAddModal(false)} 
                onSave={(v) => { onAddVendor(v); setShowAddModal(false); }} 
                currentUser={currentUser} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'کل تامین‌کنندگان', value: stats.total, color: 'text-cyan-600', border: 'border-cyan-600/20', bgFill: 'bg-cyan-600', shadow: 'shadow-[0_2px_12px_rgba(8,145,178,0.1),_0_1px_4px_rgba(15,23,42,0.05)]', sub: 'Total Vendors', percent: 100 },
          { label: 'Grade A', value: stats.gradeA, color: 'text-emerald-600', border: 'border-emerald-600/20', bgFill: 'bg-emerald-600', shadow: 'shadow-[0_2px_12px_rgba(5,150,105,0.1),_0_1px_4px_rgba(15,23,42,0.05)]', sub: 'امتیاز ۸۰ تا ۱۰۰', percent: stats.total > 0 ? Math.round((stats.gradeA/stats.total)*100) : 0 },
          { label: 'Grade B', value: stats.gradeB, color: 'text-[#0071E3]', border: 'border-[#0071E3]/20', bgFill: 'bg-[#0071E3]', shadow: 'shadow-[0_2px_12px_rgba(0,113,227,0.08),_0_1px_4px_rgba(15,23,42,0.05)]', sub: 'امتیاز ۶۰ تا ۷۹', percent: stats.total > 0 ? Math.round((stats.gradeB/stats.total)*100) : 0 },
          { label: 'Grade C', value: stats.gradeC, color: 'text-amber-600', border: 'border-amber-600/20', bgFill: 'bg-amber-600', shadow: 'shadow-[0_2px_12px_rgba(217,119,6,0.1),_0_1px_4px_rgba(15,23,42,0.05)]', sub: 'امتیاز ۴۰ تا ۵۹', percent: stats.total > 0 ? Math.round((stats.gradeC/stats.total)*100) : 0 },
          { label: 'Reject', value: stats.rejected, color: 'text-rose-600', border: 'border-rose-600/20', bgFill: 'bg-rose-600', shadow: 'shadow-[0_2px_12px_rgba(225,29,72,0.1),_0_1px_4px_rgba(15,23,42,0.05)]', sub: 'امتیاز ۰ تا ۳۹', percent: stats.total > 0 ? Math.round((stats.rejected/stats.total)*100) : 0 }
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 space-y-3 bg-white border ${s.border} ${s.shadow}`}>
            <div className={`text-4xl font-black tabular-nums font-mono ${s.color}`}>{s.value}</div>
            <div>
              <div className="text-slate-700 font-bold text-sm">{s.label}</div>
              <div className="text-slate-400 text-xs">{s.sub}</div>
            </div>
            <div className="h-px w-full rounded-full bg-slate-900/10">
              <div className={`h-[2px] rounded-full mt-[-0.5px] ${s.bgFill} transition-all duration-700`} style={{ width: `${s.percent || 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORY CARDS */}
      <div>
        <div className="font-mono text-slate-400 text-xs uppercase tracking-widest mb-4 px-1">CATEGORIES</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(Object.entries(categoryLabels) as [Category, any][]).filter(([id]) => id !== 'blacklist').map(([id, meta]) => {
            const catVendors = db.filter(v => id === 'sample' ? (v.category === 'sample' || v.isSample) : v.category === id);
            const verified = id === 'sample' 
              ? catVendors.filter(v => v.status === 'approved').length 
              : catVendors.filter(v => v.grade === 'A' || v.grade === 'B').length;
            const other = catVendors.length - verified;
            const verifiedLabel = id === 'sample' ? 'Approved' : 'تایید شده';
            const otherLabel = id === 'sample' ? 'Approved conditional / Reject' : 'سایر';
            const style = categoryCardStyles[id] || categoryCardStyles.foreign;

            return (
              <div 
                key={id}
                onClick={() => onNavigate('category', id)}
                className={`group rounded-3xl p-6 space-y-5 bg-white border border-slate-900/10 shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer ${style.hoverBg} ${style.hoverBorder} ${style.hoverShadow}`}
              >
                <div className="flex items-start justify-between">
                  {/* Icon box left */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-mono font-black transition-all duration-300 ${style.iconBg} ${style.iconBorder} ${style.iconText} ${style.accentGlow} group-hover:scale-105`}>
                    <meta.icon className="w-7 h-7" />
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
                
                <div>
                  <h3 className="font-black text-slate-800 leading-tight text-base sm:text-lg tracking-tight group-hover:text-slate-900 transition-colors">{meta.fa}</h3>
                  <div className="text-slate-400 text-[11px] mt-1 font-mono uppercase tracking-wider">{meta.en}</div>
                </div>

                <div className="border-t border-slate-900/5 pt-4 flex items-center justify-between">
                  <div className={`font-mono text-3xl font-black transition-all duration-300 group-hover:scale-110 origin-left ${style.statText}`}>{catVendors.length}</div>
                  <div className="text-right">
                    <div className="text-slate-600 font-bold text-xs sm:text-sm">{verified} {verifiedLabel}</div>
                    <div className="text-slate-400 text-[11px] sm:text-xs mt-0.5">{other} {otherLabel}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALERT PANELS */}
      <div className="space-y-4">
        {/* NEW VENDORS PANEL */}
        <div className="rounded-2xl p-5 space-y-3 bg-cyan-600/5 border border-cyan-600/20">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-600" />
            <div className="font-bold text-cyan-700 text-sm">در انتظار ارزیابی اولیه</div>
            <div className="mr-auto bg-cyan-600/10 text-cyan-900 font-mono text-xs px-1.5 py-0.5 rounded-full font-black">
              {db.filter(v => v.status === 'new').length}
            </div>
          </div>
          
          <div className="space-y-2">
            {db.filter(v => v.status === 'new').slice(0, 3).map(v => (
              <div key={v.id} className="bg-cyan-600/5 border border-cyan-600/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-slate-700 font-semibold text-sm">{v.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-xs">{v.material}</span>
                    {(() => {
                      const foundMat = materials.find(m => m.name === v.material || m.nameEn === v.materialEn);
                      return foundMat ? <MaterialRoleBadge role={foundMat.role} className="scale-85 origin-right" /> : null;
                    })()}
                  </div>
                </div>
                <button onClick={() => onSelectVendor(v)} className="text-cyan-600 hover:text-cyan-800 text-xs underline underline-offset-2">مشاهده</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
