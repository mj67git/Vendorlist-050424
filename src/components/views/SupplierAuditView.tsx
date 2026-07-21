import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Activity, Handshake, Pencil, Briefcase, Warehouse, 
  Coins, Microscope, Search, X, Building 
} from 'lucide-react';
import { Vendor, User, Scores } from '../../types';
import { categoryLabels } from '../../utils/constants';
import { 
  getDisplayCountry, calculateOverallScore 
} from '../../utils/vendorUtils';
import { getScoreColorClass } from '../ScoreBar';
import { GradeBadge } from '../GradeBadge';
import { StickyRecordHeader } from '../StickyRecordHeader';

export interface SupplierGroup {
  key: string;
  name: string;
  nameEn: string;
  country: string;
  contactInfo: string;
  registrationDate: string;
  vendors: Vendor[];
}

export interface SupplierAuditViewProps {
  db: Vendor[];
  onSelectVendor: (vendor: Vendor) => void;
  currentUser: User | null;
}

export function SupplierAuditView({ db, onSelectVendor, currentUser }: SupplierAuditViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierKey, setSelectedSupplierKey] = useState<string | null>(null);

  // Group vendors list by supplier name
  const supplierGroups = useMemo(() => {
    const groups: Record<string, SupplierGroup> = {};

    db.forEach(v => {
      const key = v.name.trim().toLowerCase();
      if (!key) return;

      if (!groups[key]) {
        groups[key] = {
          key,
          name: v.name,
          nameEn: v.nameEn || 'N/A',
          country: getDisplayCountry(v) || 'مشخص نشده',
          contactInfo: v.contactInfo || '',
          registrationDate: v.registrationDate || '',
          vendors: []
        };
      }
      groups[key].vendors.push(v);
    });

    return Object.values(groups);
  }, [db]);

  // Filter matching suppliers list
  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return supplierGroups;

    return supplierGroups.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.nameEn.toLowerCase().includes(query) ||
      s.country.toLowerCase().includes(query) ||
      s.vendors.some(v => 
        v.material.toLowerCase().includes(query) ||
        v.materialEn.toLowerCase().includes(query) ||
        (v.cas && v.cas.toLowerCase().includes(query))
      )
    );
  }, [supplierGroups, searchQuery]);

  // Find active supplier details
  const activeSupplier = useMemo(() => {
    if (!selectedSupplierKey) return null;
    return supplierGroups.find(s => s.key === selectedSupplierKey) || null;
  }, [supplierGroups, selectedSupplierKey]);

  // Aggregate performance metrics for active supplier
  const stats = useMemo(() => {
    if (!activeSupplier) return null;

    const list = activeSupplier.vendors;
    const totalItems = list.length;

    let scoredCount = 0;
    let scoresSum = 0;
    const deptTotals = { commercial: 0, qa: 0, planning: 0, finance: 0 };
    const deptCounts = { commercial: 0, qa: 0, planning: 0, finance: 0 };

    list.forEach(v => {
      let overall = null;
      if (currentUser?.role === 'admin') {
        overall = calculateOverallScore(v.scores, true);
      } else if (currentUser?.role) {
        overall = v.scores?.[currentUser.role as keyof Scores] || 0;
      }
      if (overall !== null && overall > 0) {
        scoresSum += overall;
        scoredCount++;
      }

      if (v.scores) {
        if (v.scores.commercial > 0) { deptTotals.commercial += v.scores.commercial; deptCounts.commercial++; }
        if (v.scores.qa > 0) { deptTotals.qa += v.scores.qa; deptCounts.qa++; }
        if (v.scores.planning > 0) { deptTotals.planning += v.scores.planning; deptCounts.planning++; }
        if (v.scores.finance > 0) { deptTotals.finance += v.scores.finance; deptCounts.finance++; }
      }
    });

    const avgPerformance = scoredCount > 0 ? Math.round(scoresSum / scoredCount) : null;

    const deptAverages = {
      commercial: deptCounts.commercial > 0 ? Math.round(deptTotals.commercial / deptCounts.commercial) : 0,
      qa: deptCounts.qa > 0 ? Math.round(deptTotals.qa / deptCounts.qa) : 0,
      planning: deptCounts.planning > 0 ? Math.round(deptTotals.planning / deptCounts.planning) : 0,
      finance: deptCounts.finance > 0 ? Math.round(deptTotals.finance / deptCounts.finance) : 0,
    };

    // Group count of items by standard status
    const statusDistribution = { approved: 0, conditional: 0, rejected: 0, new: 0 };
    list.forEach(v => {
      statusDistribution[v.status as keyof typeof statusDistribution] = (statusDistribution[v.status as keyof typeof statusDistribution] || 0) + 1;
    });

    // Find dominant grade representation
    const gradeCounts: Record<string, number> = {};
    list.forEach(v => {
      if (v.grade) {
        gradeCounts[v.grade] = (gradeCounts[v.grade] || 0) + 1;
      }
    });

    let dominantGrade = 'N/A';
    let maxCount = 0;
    Object.entries(gradeCounts).forEach(([g, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantGrade = g;
      }
    });

    return {
      totalItems,
      avgPerformance,
      deptAverages,
      statusDistribution,
      dominantGrade
    };
  }, [activeSupplier, currentUser]);

  return (
    <div className="space-y-6 fade-in text-right">
      {/* Breadcrumbs / View switcher header */}
      {!activeSupplier && (
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
      )}

      {/* DETAIL VIEW OF SINGLE SUPPLIER */}
      {activeSupplier && stats ? (
        <div className="space-y-6">
          {/* 📌 Sticky Header for Supplier Details */}
          <StickyRecordHeader
            onBack={() => setSelectedSupplierKey(null)}
            backButtonLabel="بازگشت به مانیتور جامع تامین‌کنندگان"
            title={activeSupplier.name}
            subtitleEn={activeSupplier.nameEn || 'N/A'}
            titleBadge={activeSupplier.country ? {
              text: activeSupplier.country,
              colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
              title: 'کشور تامین‌کننده'
            } : undefined}
            infoBlock1={{
              icon: Building,
              label: 'نوع شرکت',
              value: 'تأمین‌کننده اصلی کالا',
              iconBgClass: 'bg-teal-50 text-teal-600',
            }}
            infoBlock2={{
              items: [
                { label: 'کل اقلام ممیزی', value: `${stats.totalItems} ماده`, dir: 'rtl' },
                { label: 'گرید کیفی غالب', value: stats.dominantGrade || '—', dir: 'rtl' }
              ]
            }}
            statusBadge={
              stats.avgPerformance !== null && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400">شاخص عملکرد:</span>
                  <span className={`text-xs font-black font-mono leading-none ${getScoreColorClass(stats.avgPerformance)} bg-white px-2 py-1 rounded border border-slate-100 shadow-sm`}>
                    {Math.round(stats.avgPerformance)}
                  </span>
                </div>
              )
            }
          />

          {/* Elegant summary callout instead of the 4 boxes */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between gap-4 text-right mb-4">
            <div className="flex items-center gap-3 w-full justify-start">
              <div className="bg-teal-50 border border-teal-100 text-teal-600 p-2.5 rounded-xl shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-slate-800 font-bold text-sm">وضعیت تامین کالا</div>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  تاکنون از این تامین‌کننده تعداد <span className="font-bold font-mono text-slate-900 text-sm mx-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm">{stats.totalItems}</span> مورد تامین و ارزیابی شده است که جزئیات عملکرد هر یک به تفکیک در جدول زیر ارائه گردیده است:
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-900/10 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="w-full sm:w-auto uppercase font-bold text-slate-400 text-xs tracking-wider text-right">
                جدول مقایسه نمرات مواد تامین شده (Materials Performance Matrix)
              </div>
              <span className="text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                تعداد اقلام ممیزی شده: <span className="font-mono">{stats.totalItems}</span> ماده فعال یا نمونه
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right divide-y divide-slate-100">
                <thead className="bg-slate-50/50 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-right">ماده</th>
                    <th className="px-3 sm:px-4 py-3 text-center">CAS No.</th>
                    <th className="px-3 sm:px-4 py-3 text-center">وضعیت</th>
                    <th className="px-3 sm:px-4 py-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {activeSupplier.vendors.map((v) => {
                    const matchedCat = categoryLabels[v.category as keyof typeof categoryLabels] || { fa: v.category, icon: Building };
                    const CatIcon = matchedCat.icon;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 sm:px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 border border-slate-200 text-slate-500 p-1.5 rounded-lg shrink-0">
                              <CatIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-[11px] sm:text-[12px] whitespace-nowrap" title={v.material}>{v.material || 'N/A'}</div>
                              <div className="text-slate-400 text-[9px] sm:text-[10px] font-mono mt-0.5 whitespace-nowrap" dir="ltr" style={{ textAlign: 'right' }} title={v.materialEn}>{v.materialEn || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">
                          <div className="inline-block text-right">
                            {v.cas && (
                               <div className="text-[10px] sm:text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 inline-block font-mono" dir="ltr">
                                 <span className="text-slate-400 font-sans font-bold text-[9px] mr-1">CAS No.:</span>
                                 <span>{v.cas}</span>
                               </div>
                             )}
                            {v.isSample && (
                              <div className="text-[9px] sm:text-[10px] text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded font-bold mt-1 block">
                                نمونه ارزیابی اولیه / سمپل
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-center">
                          <GradeBadge grade={v.grade} status={v.status} scores={v.scores} />
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectVendor(v)}
                            className="text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors border border-teal-200/50 font-bold text-[10px] sm:text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>پرونده ممیزی</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Dimensional Audit Score Breakdown */}
          <div className="bg-white border border-slate-900/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base text-slate-800 font-bold mb-6 flex items-center justify-start gap-2.5">
              <span>شاخص میانگین عملکرد تفکیک شده دپارتمانی (Departmental Performance)</span>
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
            </h3>

            <div className={`grid grid-cols-1 ${currentUser?.role === 'admin' ? 'md:grid-cols-4' : 'max-w-md mx-auto'} gap-6`}>
              {[
                { id: 'commercial', name: 'بازرگانی', avg: stats.deptAverages.commercial, icon: Briefcase, color: 'bg-[#0071E3]' },
                { id: 'qa', name: 'کیفیت', avg: stats.deptAverages.qa, icon: Microscope, color: 'bg-emerald-600' },
                { id: 'planning', name: 'برنامه‌ریزی و انبار', avg: stats.deptAverages.planning, icon: Warehouse, color: 'bg-violet-600' },
                { id: 'finance', name: 'مالی', avg: stats.deptAverages.finance, icon: Coins, color: 'bg-amber-600' }
              ].filter(dept => currentUser?.role === 'admin' || dept.id === currentUser?.role).map((dept) => (
                <div key={dept.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-slate-700 font-bold text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <dept.icon className="w-4 h-4 text-slate-500" />
                        <span>{dept.name}</span>
                      </div>
                      <span className={`text-sm font-bold font-mono ${getScoreColorClass(dept.avg)}`}>{dept.avg} / 100</span>
                    </div>
                  </div>

                  <div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div className={`${getScoreColorClass(dept.avg, true)} h-full rounded-full transition-all`} style={{ width: `${dept.avg}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* GLOBAL SEARCH & DISCOVERY DIRECTORY OF ALL UNIQUE SUPPLIERS */
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
                <span className="font-bold text-slate-600 text-lg">تأمین‌کننده‌ای ثبت نشده است</span>
                <p className="text-slate-400 text-sm mt-1">هنوز هیچ تأمین‌کننده‌ای در سیستم ثبت نشده است، و یا کوئری جستجوی شما مطابقت ندارد.</p>
              </div>
            ) : (
              filteredSuppliers.map((supplier) => {
                // calculate simple overall score average for highlight
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
                        <span className={`text-xs font-bold ${getScoreColorClass(avgScore)} font-mono`}>
                          {avgScore !== null ? `${avgScore}%` : 'N/A'}
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
      )}
    </div>
  );
}
