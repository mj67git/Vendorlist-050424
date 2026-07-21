import React, { useState, useMemo } from 'react';
import { 
  Search, X, Download, ChevronDown, Archive, Printer 
} from 'lucide-react';
import { Vendor, User, Category } from '../../types';
import { Material } from '../MaterialForm';
import { MaterialRoleBadge } from '../MaterialRoleBadge';
import { categoryLabels } from '../../utils/constants';
import { getDisplayCountry } from '../../utils/vendorUtils';
import { exportCategoryToExcel } from '../../utils/excelExport';
import { PrintableEvaluationForm } from '../PrintableForms';

export interface ArchiveViewProps {
  db: Vendor[];
  currentUser: User;
  materials?: Material[];
}

export function ArchiveView({ db, currentUser, materials = [] }: ArchiveViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [printingVendor, setPrintingVendor] = useState<Vendor | null>(null);

  const handleExportCategory = (catId: string, catLabel: string) => {
    exportCategoryToExcel(db, catId, catLabel, materials);
  };

  const filteredDb = useMemo(() => {
    return db.filter(v => {
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        v.name.toLowerCase().includes(term) || 
        v.nameEn.toLowerCase().includes(term) ||
        v.material.toLowerCase().includes(term) ||
        v.materialEn.toLowerCase().includes(term) ||
        v.cas.toLowerCase().includes(term) ||
        (v.irc && v.irc.toLowerCase().includes(term)) ||
        (v.country && getDisplayCountry(v).toLowerCase().includes(term));
        
      const matchGrade = gradeFilter ? v.grade === gradeFilter : true;
      const matchCategory = categoryFilter 
        ? ((categoryFilter as string) === 'sample'
            ? (v.isSample || v.category === 'sample')
            : (categoryFilter as string) === 'approved_samples' 
            ? (v.isSample && (v.status === 'approved' || v.status === 'conditional'))
            : (categoryFilter as string) === 'rejected_samples'
            ? (v.isSample && v.status === 'rejected')
            : (categoryFilter as string) === 'blacklist'
            ? (!v.isSample && v.category !== 'sample' && (v.category === 'blacklist' || v.status === 'rejected' || v.grade === 'rejected'))
            : (v.category === categoryFilter)
          )
        : true;
      const matchStatus = statusFilter ? v.status === statusFilter : true;
      const riskLevel = v.riskAssessment?.riskLevel || 'Unknown';
      const matchRisk = riskFilter 
        ? (riskFilter === 'None' ? (!v.riskAssessment) : riskLevel === riskFilter) 
        : true;
      
      return matchSearch && matchGrade && matchRisk && matchCategory && matchStatus;
    });
  }, [db, searchTerm, gradeFilter, riskFilter, categoryFilter, statusFilter]);

  if (printingVendor) {
    return <PrintableEvaluationForm vendor={printingVendor} onBack={() => setPrintingVendor(null)} />;
  }

  return (
    <div className="space-y-6 fade-in text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        {/* Left side: Export Options dropdown */}
        <div className="flex items-center gap-2 flex-wrap order-2 md:order-1">
          {currentUser && (
            <div className="relative group">
              <button type="button" className="flex items-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer">
                <Download className="w-4 h-4" />
                <span>خروجی اکسل گزارش (XLSX)</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
              
              {/* Custom dropdown menu */}
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-10 hidden group-hover:block hover:block divide-y divide-slate-100 text-right transition-all">
                <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 bg-slate-50/50 rounded-t-2xl tracking-wider select-none">
                  انتخاب دسته‌بندی گزارش اکسل
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleExportCategory('all', 'کل_آرشیو')}
                    className="w-full text-right px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#0071E3] font-medium transition-colors flex items-center justify-between"
                  >
                    <span className="font-mono text-[9px] text-slate-400">All Categories</span>
                    <span>گزارش جامع کل آرشیو</span>
                  </button>
                  {Object.entries(categoryLabels).map(([key, labelData]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleExportCategory(key, labelData.fa)}
                      className="w-full text-right px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#0071E3] font-medium transition-colors flex items-center justify-between"
                    >
                      <span className="font-mono text-[9px] text-slate-400">{key}</span>
                      <span>گزارش {labelData.fa}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Title */}
        <div className="order-1 md:order-2 text-right">
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1 flex items-center justify-end gap-3">
            آرشیو کل تامین‌کنندگان
            <Archive className="w-6 h-6 text-[#86868B]" />
          </h2>
          <p className="text-[#6E6E73] text-sm">لیست جامع تمامی تامین‌کنندگان ارزیابی شده (Vendor Archive Data)</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/75 backdrop-blur-md border border-slate-900/10 rounded-2xl p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] flex flex-col md:flex-row gap-4 items-center mb-6 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
        <div className="flex-1 flex items-center gap-3 w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none text-right"
            placeholder="جستجو کلمه کلیدی، نام، ماده، CAS، کشور..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { value: categoryFilter, setValue: setCategoryFilter, options: [{val:'', label:'همه دسته‌ها'}, ...Object.entries(categoryLabels).map(([k,v])=>({val:k, label:v.fa}))] },
            { value: riskFilter, setValue: setRiskFilter, options: [{val:'', label:'همه سطوح ریسک (Risk Level)'}, {val:'Low', label:'ریسک پایین (Low)'}, {val:'Medium', label:'ریسک متوسط (Medium)'}, {val:'High', label:'ریسک بالا (High)'}] },
            { value: gradeFilter, setValue: setGradeFilter, options: [{val:'', label:'همه گریدها'}, {val:'A', label:'Grade A'}, {val:'B', label:'Grade B'}, {val:'C', label:'Grade C'}, {val:'rejected', label:'Rejected'}] }
          ].map((filter, idx) => (
            <select 
              key={idx}
              className="bg-transparent border border-slate-900/10 text-slate-600 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500/30 flex-1 md:flex-none text-right min-w-[110px]"
              value={filter.value}
              onChange={(e) => filter.setValue(e.target.value)}
            >
              {filter.options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* ARCHIVE TABLE */}
      <div className="rounded-2xl overflow-hidden border border-slate-900/10 shadow-[0_1px_4px_rgba(15,23,42,0.06)] bg-white mb-8">
        <div className="bg-slate-50 border-b border-slate-900/10 grid grid-cols-12 gap-4 px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-4">تامین‌کننده</div>
          <div className="col-span-4 sm:col-span-3">ماده</div>
          <div className="col-span-2 hidden sm:block">دسته</div>
          <div className="col-span-2 hidden sm:block">کشور</div>
          <div className="col-span-2 sm:col-span-1 text-center">جزئیات</div>
        </div>

        <div className="divide-y divide-slate-900/5">
          {filteredDb.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <Search className="w-8 h-8 opacity-20 mb-3" />
              <span>هیچ رکورد تأمین‌کننده‌ای یافت نشد.</span>
            </div>
          ) : filteredDb.map((v, i) => (
            <div key={v.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors vendor-row" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="col-span-6 sm:col-span-4 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{v.name}</div>
                <div className="text-slate-400 text-xs truncate mt-0.5" dir="ltr" style={{ textAlign: 'right' }}>{v.nameEn}</div>
              </div>
              <div className="col-span-4 sm:col-span-3 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-slate-600 text-sm truncate">{v.material}</div>
                  {(() => {
                    const foundMat = materials.find(m => m.name === v.material || m.nameEn === v.materialEn);
                    return foundMat ? <MaterialRoleBadge role={foundMat.role} className="scale-85 origin-right" /> : null;
                  })()}
                </div>
                <div className="font-mono text-slate-400 text-xs truncate mt-0.5">{v.cas || 'N/A'}</div>
              </div>
              <div className="col-span-2 hidden sm:block min-w-0">
                <span className="bg-slate-900/5 border border-slate-900/10 text-xs text-slate-600 rounded px-2 py-0.5 inline-block truncate max-w-full font-medium">
                  {v.isSample 
                    ? (v.status === 'rejected' ? 'نمونه تایید نشده' : 'نمونه تایید شده')
                    : (categoryLabels[v.category as keyof typeof categoryLabels]?.fa || v.category)
                  }
                </span>
              </div>
              <div className="col-span-2 hidden sm:block min-w-0 text-slate-500 text-sm truncate">
                {getDisplayCountry(v).split(' ')[0]}
              </div>
              <div className="col-span-2 sm:col-span-1 text-center flex items-center justify-center gap-2">
                {currentUser?.role === 'admin' ? (
                  <button 
                    onClick={() => setPrintingVendor(v)}
                    className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-transparent hover:border-cyan-200"
                    title="چاپ فرم ارزیابی"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium font-mono">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
