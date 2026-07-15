import React from 'react';
import { ChevronLeft, LucideIcon } from 'lucide-react';

export interface InfoBlock1Props {
  icon: LucideIcon;
  label: string;
  value: string;
  valueEn?: string;
  badge?: string;
  iconColorClass?: string;
  iconBgClass?: string;
}

export interface InfoItem {
  label: string;
  value: string;
  dir?: 'rtl' | 'ltr';
}

export interface StickyRecordHeaderProps {
  onBack: () => void;
  backButtonLabel?: string;
  title: string;
  subtitleEn?: string;
  titleBadge?: {
    text: string;
    colorClass?: string;
    title?: string;
  };
  infoBlock1?: InfoBlock1Props;
  infoBlock2?: {
    items: InfoItem[];
  };
  statusBadge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const StickyRecordHeader: React.FC<StickyRecordHeaderProps> = ({
  onBack,
  backButtonLabel,
  title,
  subtitleEn,
  titleBadge,
  infoBlock1,
  infoBlock2,
  statusBadge,
  actions,
}) => {
  return (
    <div 
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 transition-all duration-300 print:hidden select-none"
      dir="rtl"
    >
      {/* RIGHT BLOCK: Back Button + Main Record Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-95 cursor-pointer shadow-xs"
          title={backButtonLabel || "برگشت"}
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 shrink-0" />

        <div className="text-right overflow-hidden max-w-[250px] sm:max-w-xs md:max-w-md">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-extrabold text-slate-800 text-sm sm:text-base md:text-lg truncate">{title}</h1>
            {titleBadge && (
              <span 
                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${titleBadge.colorClass || 'bg-slate-50 text-slate-600 border-slate-200'}`} 
                title={titleBadge.title}
              >
                {titleBadge.text}
              </span>
            )}
          </div>
          {subtitleEn && (
            <span className="text-slate-400 font-mono text-[10px] block mt-1 truncate" dir="ltr">{subtitleEn}</span>
          )}
        </div>
      </div>

      {/* MIDDLE BLOCK 1: Linked Entity Details (e.g. Supplier Name or Category) */}
      {infoBlock1 && (
        <div className="flex items-center gap-3 md:border-r md:border-slate-200 md:pr-4">
          <div className={`${infoBlock1.iconBgClass || 'bg-teal-50 text-teal-600'} p-2 rounded-xl shrink-0`}>
            <infoBlock1.icon className="w-4 h-4" />
          </div>
          <div className="text-right overflow-hidden max-w-[200px] sm:max-w-xs">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{infoBlock1.label}</span>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="font-bold text-slate-700 text-xs sm:text-sm truncate">{infoBlock1.value}</span>
              {infoBlock1.badge && (
                <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded border border-slate-200 font-bold shrink-0">{infoBlock1.badge}</span>
              )}
            </div>
            {infoBlock1.valueEn && (
              <span className="text-slate-400 font-mono text-[9px] block mt-0.5 truncate" dir="ltr">{infoBlock1.valueEn}</span>
            )}
          </div>
        </div>
      )}

      {/* MIDDLE BLOCK 2: Small Specs (e.g. CAS No, IRC Code, etc.) */}
      {infoBlock2 && infoBlock2.items && infoBlock2.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 md:border-r md:border-slate-200 md:pr-4">
          {infoBlock2.items.map((item, index) => (
            <div key={index} className="text-right min-w-[70px] max-w-[150px]">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{item.label}</span>
              <span 
                className={`text-slate-700 text-xs font-bold mt-1 inline-block truncate w-full ${item.dir === 'ltr' ? 'font-mono' : ''}`} 
                dir={item.dir || 'rtl'}
              >
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* LEFT BLOCK: Status Badge / Action Buttons */}
      {(statusBadge || actions) && (
        <div className="flex items-center justify-between md:justify-end gap-3 md:border-r md:border-slate-200 md:pr-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {statusBadge && (
            <div className="text-left shrink-0">
              {statusBadge}
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
