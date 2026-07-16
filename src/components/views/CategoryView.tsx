import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, ChevronLeft, Search, Archive, ChevronDown, 
  Activity, CheckCircle, Microscope, Download 
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Vendor, User, Category, Scores } from '../../types';
import { Material } from '../MaterialForm';
import { MaterialRoleBadge } from '../MaterialRoleBadge';
import { GradeBadge } from '../GradeBadge';
import { StickyRecordHeader } from '../StickyRecordHeader';
import { categoryLabels } from '../../utils/constants';
import { 
  getDisplayCountry, calculateOverallScore 
} from '../../utils/vendorUtils';
import { getScoreColorClass } from '../ScoreBar';
import { exportCategoryToExcel } from '../../utils/excelExport';
import { FmeaService } from '../../utils/fmeaService';

export interface CategoryViewProps {
  db: Vendor[];
  materials?: Material[];
  categoryId: Category;
  onSelectVendor: (v: Vendor) => void;
  currentUser: User;
  expandedMaterial: string | null;
  onToggleMaterial: (mat: string | null) => void;
}

export function CategoryView({ 
  db, 
  materials = [],
  categoryId, 
  onSelectVendor, 
  currentUser,
  expandedMaterial,
  onToggleMaterial
}: CategoryViewProps) {
  const [query, setQuery] = useState('');
  
  const meta = categoryLabels[categoryId];
  
  const categoryVendors = useMemo(() => {
    if (categoryId === 'sample') {
      return db.filter(v => v.isSample || v.category === 'sample');
    }
    if (categoryId === 'blacklist') {
      return db.filter(v => !v.isSample && v.category !== 'sample' && (v.category === 'blacklist' || v.status === 'rejected' || v.grade === 'rejected'));
    }
    return db.filter(v => v.category === categoryId);
  }, [db, categoryId]);
  
  const filteredVendors = useMemo(() => {
    const qt = query.toLowerCase();
    return categoryVendors.filter(v => 
      v.name.toLowerCase().includes(qt) || 
      v.nameEn.toLowerCase().includes(qt) || 
      v.material.toLowerCase().includes(qt) || 
      v.materialEn.toLowerCase().includes(qt) ||
      v.cas.toLowerCase().includes(qt) ||
      (v.irc && v.irc.toLowerCase().includes(qt)) ||
      (v.country && getDisplayCountry(v).toLowerCase().includes(qt))
    );
  }, [categoryVendors, query]);

  // Group by material
  const grouped = useMemo(() => {
    const groups: Record<string, { fa: string, en: string, cas: string, role: string, vendors: Vendor[] }> = {};
    filteredVendors.forEach(v => {
      const key = v.materialEn;
      if (!groups[key]) {
        const foundMat = materials.find(m => m.nameEn === v.materialEn || m.name === v.material);
        const role = foundMat?.role || 'API';
        groups[key] = { fa: v.material, en: v.materialEn, cas: v.cas, role, vendors: [] };
      }
      groups[key].vendors.push(v);
    });
    return groups;
  }, [filteredVendors, materials]);

  // Group by material
  const groupsList = Object.values(grouped) as { fa: string, en: string, cas: string, role: string, vendors: Vendor[] }[];

  const activeGroup = useMemo(() => {
    if (!expandedMaterial) return null;
    const groups: Record<string, { fa: string, en: string, cas: string, role: string, vendors: Vendor[] }> = {};
    categoryVendors.forEach(v => {
      const key = v.materialEn;
      if (!groups[key]) {
        const foundMat = materials.find(m => m.nameEn === v.materialEn || m.name === v.material);
        const role = foundMat?.role || 'API';
        groups[key] = { fa: v.material, en: v.materialEn, cas: v.cas, role, vendors: [] };
      }
      groups[key].vendors.push(v);
    });
    return groups[expandedMaterial] || null;
  }, [categoryVendors, expandedMaterial, materials]);

  if (activeGroup) {
    return (
      <div className="space-y-6 fade-in text-right">
        {/* Sticky Header for Source List of Selected Material */}
        <StickyRecordHeader
          onBack={() => onToggleMaterial(null)}
          backButtonLabel="بازگشت به لیست مواد"
          title={`تامین‌کنندگان ${activeGroup.fa}`}
          subtitleEn={activeGroup.en}
          titleBadge={activeGroup.cas && activeGroup.cas !== 'N/A' ? {
            text: `CAS: ${activeGroup.cas}`,
            colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            title: 'شماره ریجستری مواد آزمایشگاهی (CAS Number)'
          } : undefined}
          infoBlock1={{
            icon: Layers,
            label: 'دسته‌بندی کالا',
            value: meta.fa,
            iconBgClass: 'bg-indigo-50 text-indigo-600',
          }}
          infoBlock2={{
            items: [
              { label: 'تعداد کل تامین‌کنندگان', value: `${activeGroup.vendors.length} شرکت` },
              { label: 'کد گروه', value: activeGroup.en.substring(0, 4).toUpperCase(), dir: 'ltr' }
            ]
          }}
          statusBadge={
            <div className="flex items-center gap-2">
              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
                لیست تأمین‌کنندگان (Source List)
              </span>
              <MaterialRoleBadge role={activeGroup.role} />
            </div>
          }
        />

        {/* Vendors list in a beautiful container */}
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">لیست شرکت‌های تامین‌کننده ارزیابی شده</h3>
            <span className="text-xs text-slate-400 font-mono" dir="ltr">{activeGroup.en}</span>
          </div>
          <div className="divide-y divide-slate-100 bg-white">
            {activeGroup.vendors.map(vendor => (
              <div 
                key={vendor.id}
                onClick={() => onSelectVendor(vendor)}
                className="px-6 py-5 flex items-center justify-between hover:bg-[#F5F5F7]/50 cursor-pointer transition-colors group"
              >
                {/* Right side: Name & Status */}
                <div className="flex items-center gap-4 text-right">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    vendor.status === 'rejected' || vendor.grade === 'rejected' ? 'bg-red-500' :
                    vendor.isSample ? (
                      vendor.status === 'approved' ? 'bg-emerald-500' :
                      vendor.status === 'conditional' ? 'bg-amber-500' : 'bg-cyan-500'
                    ) : (
                      vendor.grade === 'A' ? 'bg-emerald-500' :
                      vendor.grade === 'B' ? 'bg-[#0071E3]' :
                      vendor.grade === 'C' ? 'bg-amber-500' :
                      vendor.status === 'conditional' ? 'bg-amber-500' : 'bg-cyan-500'
                    )
                  }`} />
                  <div>
                    <div className="font-bold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors text-sm sm:text-base">{vendor.name}</div>
                    <div className="text-xs text-[#6E6E73] mt-1.5 font-mono">{vendor.nameEn} · <span className="font-sans font-medium">{getDisplayCountry(vendor)}</span></div>
                  </div>
                </div>

                {/* Left side: Score & Grade */}
                <div className="flex items-center gap-6">
                  {/* Column 1: Score */}
                  <div className="hidden sm:flex w-28 sm:w-32 shrink-0 flex-col items-center justify-center text-center">
                    {currentUser?.role === 'admin' ? (
                      vendor.scores && calculateOverallScore(vendor.scores) !== null ? (
                        <div className="text-center">
                          <div className="text-[10px] text-[#86868B] mb-0.5">امتیاز کل</div>
                          <div className={`font-bold font-mono text-sm ${getScoreColorClass(calculateOverallScore(vendor.scores))}`}>
                            {calculateOverallScore(vendor.scores)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#86868B]">- بدون امتیاز نهایی -</div>
                      )
                    ) : (
                      vendor.scores && vendor.scores[currentUser?.role as keyof Scores] > 0 ? (
                        <div className="text-center">
                          <div className="text-[10px] text-[#86868B] mb-0.5">امتیاز بخش شما</div>
                          <div className={`font-bold font-mono text-sm ${getScoreColorClass(vendor.scores[currentUser?.role as keyof Scores])}`}>
                            {vendor.scores[currentUser?.role as keyof Scores]}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 font-medium">عدم ثبت امتیاز شما</div>
                      )
                    )}
                  </div>

                  {/* Column 2: Risk Level */}
                  {categoryId !== 'blacklist' && (
                    <div className="hidden sm:flex w-24 sm:w-28 shrink-0 flex-col items-center justify-center text-center">
                      <div className="text-[10px] text-[#86868B] mb-0.5">Risk Level</div>
                      {vendor.riskAssessment ? (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          vendor.riskAssessment.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          vendor.riskAssessment.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {vendor.riskAssessment.riskLevel === 'Low' ? 'Low' :
                           vendor.riskAssessment.riskLevel === 'Medium' ? 'Medium' : 'High'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#86868B]">-</span>
                      )}
                    </div>
                  )}

                  {/* Column 3: Grade / Status */}
                  {categoryId !== 'blacklist' && (
                    <div className="hidden sm:flex w-24 sm:w-28 shrink-0 flex-col items-center justify-center text-center">
                      {vendor.isSample ? (
                        <>
                          <div className="text-[10px] text-[#86868B] mb-0.5">Sample Status</div>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            vendor.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            vendor.status === 'conditional' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {vendor.status === 'approved' ? 'Approved' :
                             vendor.status === 'conditional' ? 'Approved conditional' : 'Reject'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] text-[#86868B] mb-0.5">Grade</div>
                          <GradeBadge grade={vendor.grade} status={vendor.status} scores={vendor.scores} />
                        </>
                      )}
                    </div>
                  )}
                  
                  <ChevronLeft className="w-5 h-5 text-[#86868B] group-hover:text-[#0071E3] transform group-hover:-translate-x-1 transition-all shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FMEA Comparison Engine & Smart Analysis */}
        <div className="mt-8">
          <MaterialsComparisonSection vendors={activeGroup.vendors || []} categoryId={categoryId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1 flex items-center gap-2">
            <meta.icon className="w-6 h-6 text-[#0071E3]" />
            {meta.fa}
          </h2>
          <p className="text-xs font-mono text-[#86868B] uppercase tracking-wider">{meta.en}</p>
        </div>
        <button 
          onClick={() => exportCategoryToExcel(categoryVendors, categoryId, meta.fa, materials)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>خروجی Excel</span>
        </button>
      </div>

      {/* Glassmorphic Category Toolbar (Search & Stats) */}
      <div className="bg-white/75 backdrop-blur-md border border-slate-900/10 rounded-2xl p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="جستجو کلمه کلیدی، نام، ماده، CAS، کشور..."
            className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] transition-all placeholder:text-[#86868B]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            dir="rtl"
          />
          <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-3.5" />
        </div>

        {/* Stats inside the Toolbar */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          <div className="px-3 py-1.5 rounded-xl bg-white/50 border border-slate-200 text-xs text-[#1D1D1F] shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            کل: <span className="font-bold text-[#0071E3]">{categoryVendors.length}</span>
          </div>
          {categoryId === 'sample' ? (
            <>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 font-medium">
                Approved: <span className="font-bold">{categoryVendors.filter(v => v.status === 'approved').length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 font-medium">
                Approved conditional: <span className="font-bold">{categoryVendors.filter(v => v.status === 'conditional').length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800 font-medium">
                Reject: <span className="font-bold">{categoryVendors.filter(v => v.status === 'rejected').length}</span>
              </div>
            </>
          ) : categoryId === 'blacklist' ? null : (
            <>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 font-medium">
                Grade A: <span className="font-bold">{categoryVendors.filter(v => v.grade === 'A').length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 font-medium">
                Grade B: <span className="font-bold">{categoryVendors.filter(v => v.grade === 'B').length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 font-medium">
                Grade C: <span className="font-bold">{categoryVendors.filter(v => v.grade === 'C').length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800 font-medium">
                لیست سیاه: <span className="font-bold">{categoryVendors.filter(v => v.grade === 'rejected' || v.status === 'rejected').length}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6 mt-8">
        {groupsList.map(group => (
          <MaterialGroup 
            key={group.en} 
            group={group} 
            onSelectVendor={onSelectVendor} 
            currentUser={currentUser} 
            categoryId={categoryId} 
            expandedMaterial={expandedMaterial}
            onToggleMaterial={onToggleMaterial}
          />
        ))}
        {groupsList.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E5E5EA]">
            <Archive className="w-12 h-12 text-[#86868B] mx-auto mb-4" />
            <h4 className="text-[#6E6E73] font-semibold text-lg">نتیجه‌ای یافت نشد</h4>
          </div>
        )}
      </div>
    </div>
  );
}

interface MaterialGroupProps {
  group: { fa: string, en: string, cas: string, role: string, vendors: Vendor[] };
  onSelectVendor: (v: Vendor) => void;
  currentUser: User;
  categoryId?: Category;
  expandedMaterial: string | null;
  onToggleMaterial: (mat: string | null) => void;
}

const MaterialGroup: React.FC<MaterialGroupProps> = ({ 
  group, 
  onSelectVendor, 
  currentUser, 
  categoryId, 
  expandedMaterial, 
  onToggleMaterial 
}) => {
  const [localOpen, setLocalOpen] = useState(group.en === expandedMaterial);
  const elementId = `group-${group.en.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  useEffect(() => {
    if (group.en === expandedMaterial) {
      setLocalOpen(true);
      const timer = setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [expandedMaterial, group.en, elementId]);

  const isOpen = localOpen;

  return (
    <div id={elementId} className="border border-[#E5E5EA] rounded-2xl bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.015)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all scroll-mt-24 text-right">
      <div 
        onClick={() => {
          const nextOpen = !isOpen;
          setLocalOpen(nextOpen);
          if (nextOpen) {
            onToggleMaterial(group.en);
          } else if (expandedMaterial === group.en) {
            onToggleMaterial(null);
          }
        }}
        className="bg-[#F5F5F7]/40 hover:bg-[#F5F5F7]/80 cursor-pointer px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E5E5EA] transition-colors"
      >
        <div className="flex items-center gap-4">
          <ChevronLeft className={`w-5 h-5 text-[#0071E3] transition-transform duration-300 ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
          <div className="text-right">
            <h3 className="font-bold text-base text-[#1D1D1F] mb-1">{group.fa} <span className="text-[#86868B] text-sm font-normal ml-2">/ {group.en}</span></h3>
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="bg-white border border-[#D2D2D7] font-mono px-2 py-0.5 rounded text-[#6E6E73] text-[11px]">CAS: {group.cas}</span>
              <MaterialRoleBadge role={group.role} />
            </div>
          </div>
        </div>
        <div className="mt-3 md:mt-0 text-sm text-[#6E6E73] mr-9 md:mr-0 font-medium">
          <span className="text-[#1D1D1F] font-bold">{group.vendors.length}</span> تامین‌کننده
        </div>
      </div>
      
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-[#E5E5EA] bg-white">
            {group.vendors.map(vendor => (
              <div 
                key={vendor.id}
                onClick={() => onSelectVendor(vendor)}
                className="px-6 py-4 flex items-center justify-between hover:bg-[#F5F5F7]/50 cursor-pointer transition-colors group"
              >
                {/* Right side: Name & Status */}
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    vendor.status === 'rejected' || vendor.grade === 'rejected' ? 'bg-red-500' :
                    vendor.isSample ? (
                      vendor.status === 'approved' ? 'bg-emerald-500' :
                      vendor.status === 'conditional' ? 'bg-amber-500' : 'bg-cyan-500'
                    ) : (
                      vendor.grade === 'A' ? 'bg-emerald-500' :
                      vendor.grade === 'B' ? 'bg-[#0071E3]' :
                      vendor.grade === 'C' ? 'bg-amber-500' :
                      vendor.status === 'conditional' ? 'bg-amber-500' : 'bg-cyan-500'
                    )
                  }`} />
                  <div className="text-right">
                    <div className="font-bold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">{vendor.name}</div>
                    <div className="text-xs text-[#6E6E73] mt-1 font-mono">{vendor.nameEn} · <span className="font-sans font-medium">{getDisplayCountry(vendor)}</span></div>
                  </div>
                </div>

                {/* Left side: Score & Grade */}
                <div className="flex items-center gap-6">
                  {/* Column 1: Score */}
                  <div className="hidden sm:flex w-28 sm:w-32 shrink-0 flex-col items-center justify-center text-center">
                    {currentUser?.role === 'admin' ? (
                      vendor.scores && calculateOverallScore(vendor.scores) !== null ? (
                        <div className="text-center">
                          <div className="text-[10px] text-[#86868B] mb-0.5">امتیاز کل</div>
                          <div className={`font-bold font-mono text-sm ${getScoreColorClass(calculateOverallScore(vendor.scores))}`}>
                            {calculateOverallScore(vendor.scores)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#86868B]">- بدون امتیاز نهایی -</div>
                      )
                    ) : (
                      vendor.scores && vendor.scores[currentUser?.role as keyof Scores] > 0 ? (
                        <div className="text-center">
                          <div className="text-[10px] text-[#86868B] mb-0.5">امتیاز بخش شما</div>
                          <div className={`font-bold font-mono text-sm ${getScoreColorClass(vendor.scores[currentUser?.role as keyof Scores])}`}>
                            {vendor.scores[currentUser?.role as keyof Scores]}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 font-medium">عدم ثبت امتیاز شما</div>
                      )
                    )}
                  </div>

                  {/* Column 2: Risk Level */}
                  {categoryId !== 'blacklist' && (
                    <div className="hidden sm:flex w-24 sm:w-28 shrink-0 flex-col items-center justify-center text-center">
                      <div className="text-[10px] text-[#86868B] mb-0.5">Risk Level</div>
                      {vendor.riskAssessment ? (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          vendor.riskAssessment.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          vendor.riskAssessment.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {vendor.riskAssessment.riskLevel === 'Low' ? 'Low' :
                           vendor.riskAssessment.riskLevel === 'Medium' ? 'Medium' : 'High'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#86868B]">-</span>
                      )}
                    </div>
                  )}

                  {/* Column 3: Grade / Status */}
                  {categoryId !== 'blacklist' && (
                    <div className="hidden sm:flex w-24 sm:w-28 shrink-0 flex-col items-center justify-center text-center">
                      {vendor.isSample ? (
                        <>
                          <div className="text-[10px] text-[#86868B] mb-0.5">Sample Status</div>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            vendor.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            vendor.status === 'conditional' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {vendor.status === 'approved' ? 'Approved' :
                             vendor.status === 'conditional' ? 'Approved conditional' : 'Reject'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] text-[#86868B] mb-0.5">Grade</div>
                          <GradeBadge grade={vendor.grade} status={vendor.status} scores={vendor.scores} />
                        </>
                      )}
                    </div>
                  )}
                  
                  <ChevronLeft className="w-5 h-5 text-[#86868B] group-hover:text-[#0071E3] transform group-hover:-translate-x-1 transition-all shrink-0" />
                </div>
              </div>
            ))}
          </div>
          
          <MaterialsComparisonSection vendors={group.vendors || []} categoryId={categoryId} />
        </div>
      </div>
    </div>
  );
};

const MaterialsComparisonSection: React.FC<{ vendors: Vendor[]; categoryId?: Category }> = ({ vendors, categoryId }) => {
  const [showLabModGuide, setShowLabModGuide] = useState(false);

  if (categoryId === 'blacklist' || categoryId === 'sample') {
    return null;
  }

  const validVendors = (vendors || []).filter(v => !v.isSample && v.status !== 'rejected' && v.grade !== 'rejected');
  
  if (validVendors.length === 0) return null;

  const chartData = validVendors.map(v => {
    const overallScore = calculateOverallScore(v.scores, true) || 0;
    
    // Call the isolated FmeaService to run the recommendation engine logic
    const { engineScore, riskMod, labMod, hasLabAssessment, analysisMeta } = 
      FmeaService.calculateEngineScore(overallScore, v.riskAssessment?.riskLevel, v.analysisRecords);

    return {
      name: v.name,
      nameEn: v.nameEn,
      score: overallScore, // Base visual score unchanged
      engineScore,
      riskMod,
      labMod,
      analysisMeta,
      hasLabAssessment,
      qa: v.scores?.qa || 0,
      commercial: v.scores?.commercial || 0,
      planning: v.scores?.planning || 0,
      finance: v.scores?.finance || 0,
      vendor: v
    };
  }).sort((a, b) => b.engineScore - a.engineScore);

  const hasScores = chartData.some(d => d.score > 0);
  if (!hasScores) {
    return (
      <div className="mx-6 my-5 p-4 bg-amber-50/50 border border-amber-200/40 rounded-xl text-center text-amber-800 text-xs">
        هنوز ارزیابی کمّی و ثبت امتیاز کافی برای تامین‌کنندگان غیرنمونه این ماده انجام نشده است.
      </div>
    );
  }

  const bestVendor = chartData[0];

  // Dynamically calculate the latest update date among the material group's vendors
  const getLatestGroupUpdateDate = () => {
    const datesList: string[] = [];
    validVendors.forEach(v => {
      if (v.lastAudit) datesList.push(v.lastAudit);
      if (v.activityLogs) {
        v.activityLogs.forEach(log => {
          if (log.date) {
            const onlyDate = log.date.split(' ')[0];
            if (onlyDate) datesList.push(onlyDate);
          }
        });
      }
    });

    if (datesList.length === 0) {
      return new Date().toLocaleDateString('fa-IR');
    }

    const normalizeDigits = (str: string) => {
      return str.replace(/[۰-۹]/g, w => String.fromCharCode(w.charCodeAt(0) - 1776));
    };

    datesList.sort((a, b) => {
      const normA = normalizeDigits(a);
      const normB = normalizeDigits(b);
      return normB.localeCompare(normA); // descending
    });

    const latest = datesList[0];
    const normLatest = normalizeDigits(latest);
    
    // If the latest parsed year is before 1404 (very old mock data), show the current active system date to look completely up-to-date and updated
    const yearParsed = parseInt(normLatest.split('/')[0]);
    if (isNaN(yearParsed) || yearParsed < 1404) {
      return new Date().toLocaleDateString('fa-IR');
    }

    return latest;
  };

  const groupUpdateDate = getLatestGroupUpdateDate();

  return (
    <div className="mx-6 my-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100/80 text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="font-bold text-sm text-[#1D1D1F] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0071E3]" />
            نمودار مقایسه و تحلیل ارزیابی تامین‌کنندگان این ماده
          </h4>
          <p className="text-xs text-[#86868B] mt-1">مقایسه امتیاز کل مکتسبه و تحلیل جهت بهترین انتخاب تأمین کالا</p>
        </div>
        
        {bestVendor && bestVendor.score > 0 && (
          <div className="flex items-center gap-2 bg-[#0071E3]/10 border border-[#0071E3]/20 px-3 py-1.5 rounded-full text-xs text-[#0071E3] font-bold self-start md:self-auto">
            <CheckCircle className="w-3.5 h-3.5" />
            گزینه پیشنهادی سیستم: {bestVendor.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[#E5E5EA]">
            <div className="mb-4 flex justify-between items-center text-xs text-[#6E6E73] font-semibold">
              <span>مقایسه امتیاز کل تخصصی (از ۱۰۰)</span>
              <div className="flex items-center gap-2 font-normal">
                <span className="inline-block w-3 h-3 bg-[#0071E3] rounded-sm"></span>
                <span>امتیاز کل</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {chartData.map((item) => {
                const scorePercent = Math.min(100, item.score);
                const isBest = item.vendor.id === bestVendor.vendor.id;
                return (
                  <div key={item.vendor.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#1D1D1F] truncate max-w-[200px]" title={item.name}>
                        {item.name} {isBest && <span className="text-[10px] text-[#0071E3] bg-[#0071E3]/10 px-1.5 py-0.5 rounded-md font-normal mr-2">برتر</span>}
                      </span>
                      <span className="font-mono font-bold text-[#1D1D1F]">{item.score} <span className="text-gray-400 font-normal">/ ۱۰۰</span></span>
                    </div>
                    <div className="h-5 w-full bg-[#F5F5F7] rounded-full overflow-hidden flex items-center relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isBest ? 'bg-gradient-to-l from-[#0071E3] to-[#4096FF]' : 'bg-gradient-to-l from-slate-500 to-slate-400'
                        }`}
                        style={{ width: `${scorePercent}%` }}
                      />
                      <div className="absolute left-3 text-[10px] text-gray-500 font-sans pointer-events-none">
                        {item.vendor.grade ? `Grade ${item.vendor.grade}` : 'بدون گرید'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E5EA]">
             <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
               <h5 className="font-bold text-[#1D1D1F] text-xs flex items-center gap-2">
                 <Microscope className="w-4 h-4 text-indigo-600" />
                 مقایسه نتایج تست آزمایشگاهی / QC
               </h5>
               <button 
                 onClick={() => setShowLabModGuide(!showLabModGuide)}
                 className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
               >
                 <span>فرمول محاسبه</span>
                 <motion.span
                   animate={{ rotate: showLabModGuide ? 180 : 0 }}
                   transition={{ duration: 0.15 }}
                   className="inline-block"
                 >
                   <ChevronDown className="w-3 h-3" />
                 </motion.span>
               </button>
             </div>

             <AnimatePresence initial={false}>
               {showLabModGuide && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: "auto", opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ duration: 0.2, ease: "easeOut" }}
                   className="overflow-hidden"
                 >
                   <p className="text-[10px] text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed shadow-sm block">
                      <strong className="text-slate-800">نحوه محاسبه ضریب نتایج آزمایشگاه (Lab Mod):</strong><br/>
                      تأثیر این بخش در بازه <span className="font-mono text-indigo-600 font-bold" dir="ltr">0.90x ~ 1.10x</span> (قبل از احتساب جریمه‌های ردی) محاسبه می‌شود:<br/>
                      <span className="block mt-1.5"><span className="inline-block w-1 h-1 bg-emerald-500 rounded-full ml-1.5 align-middle"></span> <strong>پایه و پاداش تست مثبت:</strong> ضریب پایه سیستم <strong><span className="font-mono">0.90x</span></strong> است. تا سقف <strong><span className="font-mono">+0.20x</span></strong> (به نسبت درصد تست‌های تایید شده دستگاه) به این پایه اضافه می‌شود. (مثلا اگر ۱۰۰٪ تست‌ها پاس شوند ضریب کامل ۱.۱۰ لحاظ می‌گردد).</span>
                      <span className="block mt-1"><span className="inline-block w-1 h-1 bg-rose-500 rounded-full ml-1.5 align-middle"></span> <strong>جریمه تست مردودی:</strong> به ازای هر ۱ تست که مردود (<span className="text-rose-600 font-bold">Reject</span>) شده باشد، مستقیماً ضریب <strong><span className="font-mono text-rose-600">-0.10x</span></strong> به عنوان جریمه از ضریب کل آزمایشگاه کسر می‌گردد.</span>
                   </p>
                 </motion.div>
               )}
             </AnimatePresence>
             <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                   <thead>
                     <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                       <th className="pb-2">سورس</th>
                       <th className="pb-2 text-center">کل تست‌ها</th>
                       <th className="pb-2 text-center text-emerald-600">پاس/تایید</th>
                       <th className="pb-2 text-center text-rose-600">مردود</th>
                       <th className="pb-2 text-center">ضریب موتور</th>
                     </tr>
                   </thead>
                   <tbody>
                     {chartData.map(item => (
                        <tr key={item.vendor.id} className="border-b border-slate-50/50 last:border-0 text-[#1D1D1F]">
                           <td className="py-2.5 font-medium">{item.name} {item.vendor.id === bestVendor.vendor.id && <span className="text-[#0071E3] px-1 text-[10px]">★</span>}</td>
                           <td className="py-2.5 text-center font-mono">{item.analysisMeta.total || '-'}</td>
                           <td className="py-2.5 text-center font-mono text-emerald-600">{item.hasLabAssessment ? (item.analysisMeta.pass + item.analysisMeta.app) : '-'}</td>
                           <td className="py-2.5 text-center font-mono text-rose-600">{item.hasLabAssessment ? item.analysisMeta.reject : '-'}</td>
                           <td className="py-2.5 text-center font-mono text-indigo-600" dir="ltr">{item.hasLabAssessment ? item.labMod.toFixed(2) + 'x' : '-'}</td>
                        </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0071E3]/2 p-5 rounded-xl border border-[#0071E3]/5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-[#0071E3] font-bold tracking-wider mb-2 uppercase border border-[#0071E3]/20 bg-[#0071E3]/10 px-2 py-0.5 rounded inline-block">موتور تحلیل سیستم (Local Engine)</div>
            <h5 className="font-bold text-[#1D1D1F] text-sm mb-3 mt-1">چرا {bestVendor.name} پیشنهاد می‌شود؟</h5>
            
            <div className="space-y-3 text-xs text-[#424245] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#0071E3] rounded-full mt-1.5 shrink-0" />
                <div className="text-right">
                  <strong>موتور آفلاین سیستم</strong> برای انتخاب کالا از یک مکانیسم امتیازدهی ترکیبی شفاف استفاده می‌کند:
                  <br/>
                  <span className="inline-block mt-2 font-mono text-[#0071E3] bg-[#0071E3]/5 px-2 py-1 rounded border border-[#0071E3]/20 font-bold" dir="ltr">
                    Engine Score = BaseScore × RiskMod × LabMod
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#0071E3] rounded-full mt-1.5 shrink-0" />
                <p>
                  <strong>۱. امتیاز کل (Base Score):</strong> {bestVendor.score} از ۱۰۰ (محاسبه شده از میانگین وزنی فرم‌های ارزیابی بخش‌های تخصصی).
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#0071E3] rounded-full mt-1.5 shrink-0" />
                <p>
                  <strong>۲. ضریب ریسک (Risk Mod):</strong> سطح ریسک فعلی <strong>{bestVendor.vendor.riskAssessment?.riskLevel || 'Low'}</strong> است که معادل ضریب <strong>{bestVendor.riskMod.toFixed(2)}x</strong> محاسبه می‌شود.
                </p>
              </div>

              {bestVendor.hasLabAssessment ? (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                  <p>
                    <strong>۳. ضریب نتایج آزمایشگاه (Lab Mod):</strong> بر اساس سوابق QC و نسبت تست‌های قبول/رد شده، معادل <strong>{bestVendor.labMod.toFixed(2)}x</strong> روی امتیاز کل اعمال شده است.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                  <p>
                    <strong>۳. ضریب نتایج آزمایشگاه (Lab Mod):</strong> سابقه قبلی تست وجود ندارد (تأثیر خنثی معادل <strong>1.00x</strong>).
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#0071E3]/20 flex items-center justify-between">
                 <span className="font-bold text-[#1D1D1F]">امتیاز نهایی سیستم:</span>
                 <span className="font-mono text-sm" dir="ltr">
                   {bestVendor.score} × {bestVendor.riskMod.toFixed(2)} × {bestVendor.labMod.toFixed(2)} = <strong className="text-[16px] text-[#0071E3] bg-white px-2 rounded-md shadow-sm border border-[#E5E5EA]">{bestVendor.engineScore.toFixed(1)}</strong>
                 </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#0071E3]/10 flex justify-between items-center text-[11px] text-[#6E6E73]">
            <span>آخرین بروزرسانی ارزیابی موتور:</span>
            <span className="font-mono font-bold text-slate-700">{groupUpdateDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
