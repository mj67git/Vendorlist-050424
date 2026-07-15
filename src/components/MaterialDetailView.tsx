import React from 'react';
import { Material } from './MaterialForm';
import { 
  ArrowRight, FlaskConical, ExternalLink, Layers, Info
} from 'lucide-react';
import { StickyRecordHeader } from './StickyRecordHeader';
import { MaterialRoleBadge, getRoleBadgeDetails } from './MaterialRoleBadge';

interface MaterialDetailViewProps {
  material: Material;
  linkedVendors: any[];
  onBack: () => void;
  onNavigateToVendor: (vendorId: string) => void;
}

const ROLE_OPTIONS = [
  { val: 'API', label: 'ماده مؤثره (API)', prefixFa: 'ماده مؤثره', codeEn: 'API' },
  { val: 'INT', label: 'حدواسط (INT)', prefixFa: 'حدواسط', codeEn: 'INT' },
  { val: 'REA', label: 'واکنشگر (REA)', prefixFa: 'واکنشگر', codeEn: 'REA' },
  { val: 'SOL', label: 'حلال (SOL)', prefixFa: 'حلال', codeEn: 'SOL' },
  { val: 'Excipient', label: 'ماده کمکی (Excipient)', prefixFa: 'ماده کمکی', codeEn: 'EXP' },
];

export const MaterialDetailView: React.FC<MaterialDetailViewProps> = ({
  material,
  linkedVendors,
  onBack,
  onNavigateToVendor,
}) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'API': return 'ماده مؤثره (API)';
      case 'INT': return 'حدواسط (INT)';
      case 'REA': return 'واکنشگر (REA)';
      case 'SOL': return 'حلال (SOL)';
      case 'Excipient': return 'ماده کمکی (Excipient)';
      default: return role;
    }
  };

  const selectedRole = ROLE_OPTIONS.find(r => r.val === material.role);
  const prefixFa = selectedRole ? selectedRole.prefixFa : material.role;
  const codeEn = selectedRole ? selectedRole.codeEn : material.role;

  const roleBadgeDetails = getRoleBadgeDetails(material.role);

  // Standard names formatted exactly as requested
  const standardNameFa = material.standardNameFa || (
    material.name && material.parentProduct
      ? `${prefixFa}- ${material.name} ( برای ${material.parentProduct} )`
      : material.name
        ? `${prefixFa}- ${material.name}`
        : ''
  );

  const standardNameEn = material.standardNameEn || (
    material.nameEn && material.parentProductEn
      ? `${codeEn} – ${material.nameEn} (for ${material.parentProductEn})`
      : material.nameEn
        ? `${codeEn} – ${material.nameEn}`
        : ''
  );

  return (
    <div className="space-y-6 text-right">
      {/* Header Bar */}
      <StickyRecordHeader
        onBack={onBack}
        backButtonLabel="بازگشت به بانک مواد"
        title={material.name}
        subtitleEn={material.nameEn || 'N/A'}
        titleBadge={{
          text: roleBadgeDetails.code,
          colorClass: roleBadgeDetails.colors,
          title: `نقش کالا: ${roleBadgeDetails.label}`
        }}
        infoBlock1={{
          icon: FlaskConical,
          label: 'نقش ماده اولیه',
          value: getRoleLabel(material.role),
          iconBgClass: 'bg-indigo-50 text-indigo-600',
        }}
        infoBlock2={{
          items: [
            { label: 'CAS No.', value: material.cas && material.cas !== 'N/A' ? material.cas : '—', dir: 'ltr' },
            { label: 'محصول نهایی', value: material.parentProduct || '—' }
          ]
        }}
        statusBadge={
          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200/80">
            پرونده ماده اولیه
          </span>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: User-Registered Specs Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2 justify-end">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
              <span>مشخصات کالا</span>
            </h3>

            {/* Standard Naming Display matching user's format instructions */}
            <div className="space-y-4 border border-dashed border-slate-200 p-4 rounded-xl bg-slate-50/50">
              {/* Persian Standard Name - Right Aligned */}
              <div className="text-right" dir="rtl">
                <span className="font-black text-indigo-900 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-lg inline-block">
                  {standardNameFa}
                </span>
                <span className="text-slate-500 text-xs font-bold mr-2">: نام فارسی جدید</span>
              </div>

              {/* English Standard Name - Left Aligned */}
              <div className="text-left" dir="ltr">
                <span className="font-mono font-bold text-indigo-950 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-lg inline-block">
                  {standardNameEn}
                </span>
                <span className="text-slate-500 text-xs font-bold ml-2"> : نام انگلیسی جدید</span>
              </div>
            </div>

            {/* Registered Specifications Grid */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 justify-end">
                <Info className="w-4 h-4 text-slate-400" />
                <span>اطلاعات ثبت شده در پرونده</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold">نام فارسی پایه</span>
                  <p className="text-xs font-bold text-slate-800">{material.name || 'N/A'}</p>
                </div>

                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 space-y-1 text-left" dir="ltr">
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Base English Name</span>
                  <p className="text-xs font-mono font-bold text-slate-800">{material.nameEn || 'N/A'}</p>
                </div>

                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold">نقش در فرآیند</span>
                  <div className="pt-1">
                    <MaterialRoleBadge role={material.role} />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 space-y-1 text-left" dir="ltr">
                  <span className="text-[10px] text-slate-400 font-bold font-mono">CAS Number</span>
                  <p className="text-xs font-mono font-bold text-slate-800">{material.cas && material.cas !== 'N/A' ? material.cas : 'ثبت نشده'}</p>
                </div>

                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold">برای محصول (نام فارسی نهایی)</span>
                  <p className="text-xs font-bold text-slate-800">{material.parentProduct || 'ثبت نشده'}</p>
                </div>

                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/80 space-y-1 col-span-1 md:col-span-2 text-left" dir="ltr">
                  <span className="text-[10px] text-slate-400 font-bold font-mono">For Product (Latin/English)</span>
                  <p className="text-xs font-mono font-bold text-slate-800">{material.parentProductEn || 'ثبت نشده'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Logistics & Vendor Links */}
        <div className="space-y-6">
          {/* Metadata Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5">وضعیت مجوزهای حاکمیتی</h3>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">نقش پایه رگولاتوری</span>
                <MaterialRoleBadge role={material.role} />
              </div>

              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                <span className="text-slate-400">محصول نهایی هدف</span>
                <span className="font-bold text-slate-800">{material.parentProduct || 'نامشخص'}</span>
              </div>
            </div>
          </div>

          {/* Linked Supply Sources (Vendors) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">{linkedVendors.length}</span>
              <span>سورس‌های تأمین فعال (سازندگان)</span>
            </h3>

            {linkedVendors.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p>هیچ سورس یا سازنده‌ای برای این ماده اولیه در سیستم ثبت نشده است.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {linkedVendors.map((v) => (
                  <div 
                    key={v.id}
                    className="border border-slate-100 hover:border-slate-200 p-3 rounded-xl flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <button
                      onClick={() => onNavigateToVendor(v.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>مشاهده پرونده</span>
                    </button>

                    <div className="text-right space-y-1">
                      <h4 className="font-bold text-slate-700 text-xs">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          v.category === 'domestic' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {v.category === 'domestic' ? 'تولید داخل' : 'وارداتی'}
                        </span>
                        {v.isSample && (
                          <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold">نمونه آزمایشگاهی</span>
                        )}
                        <span>{v.country}</span>
                      </p>
                      {v.irc && v.irc !== 'N/A' && (
                        <div className="text-[10px] text-indigo-600/80 font-mono mt-1" dir="ltr">
                          IRC: {v.irc}
                        </div>
                      )}
                      {(v.ircReceivedDate || v.ircExpiryDate) && (
                        <div className="text-[9px] text-slate-500 mt-0.5 flex flex-wrap gap-1.5 justify-end">
                          {v.ircExpiryDate && <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-medium">انقضا: {v.ircExpiryDate}</span>}
                          {v.ircReceivedDate && <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-medium">دریافت: {v.ircReceivedDate}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
