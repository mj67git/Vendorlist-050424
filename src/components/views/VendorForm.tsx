import React, { useState } from 'react';
import { CheckCircle, Building, Plus, X } from 'lucide-react';
import { Category, Vendor, User } from '../../types';
import { Material } from '../MaterialForm';
import { ShamsiDatePicker } from '../ShamsiDatePicker';
import { MaterialRoleBadge } from '../MaterialRoleBadge';
import { categoryLabels } from '../../utils/constants';
import { extractCountry } from '../../utils/vendorUtils';

export interface VendorFormProps {
  onClose: () => void;
  onSave: (v: Vendor, msg?: string | null) => void;
  categoryId: Category;
  existingVendor?: Vendor;
  currentUser: User | null;
  db?: Vendor[];
  materials?: Material[];
}

export function VendorForm({
  onClose,
  onSave,
  categoryId,
  existingVendor,
  currentUser,
  db = [],
  materials = []
}: VendorFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(existingVendor?.materialId || '');
  
  // Create autocomplete suggestions
  const materialSuggestions = Array.from(new Set(db.map(v => v.material).filter(Boolean)));
  const materialEnSuggestions = Array.from(new Set(db.map(v => v.materialEn).filter(Boolean)));
  const traderSuggestions = Array.from(new Set(db.map(v => v.name).filter(Boolean)));
  const traderEnSuggestions = Array.from(new Set(db.map(v => v.nameEn).filter(Boolean)));

  const initialSourceType = existingVendor ? (
    ['approved_samples', 'rejected_samples', 'sample'].includes(existingVendor.category as string) ? 'domestic' : existingVendor.category
  ) : categoryId;
      
  const [sourceType, setSourceType] = useState<string>(initialSourceType);
  const [isSample, setIsSample] = useState<boolean>(existingVendor ? !!existingVendor.isSample : false);
  const [sampleStatus, setSampleStatus] = useState<string>(
    existingVendor?.status === 'rejected' ? 'rejected' : 
    existingVendor?.status === 'conditional' ? 'not_approved' : 'approved'
  );

  const [formData, setFormData] = useState({
    material: existingVendor?.material || '',
    materialEn: existingVendor?.materialEn || '',
    cas: existingVendor?.cas || '',
    irc: existingVendor?.irc || '',
    ircReceivedDate: existingVendor?.ircReceivedDate || '',
    ircExpiryDate: existingVendor?.ircExpiryDate || '',
    lastAudit: existingVendor?.lastAudit || '',
    name: existingVendor?.name || '',
    nameEn: existingVendor?.nameEn || '',
    contactInfo: existingVendor?.contactInfo || '',
    grade: existingVendor?.grade || 'new',
    status: existingVendor?.status || 'new',
    rejectionReasonList: existingVendor?.rejectionReasons?.join('\n') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = existingVendor?.id || ('v' + Math.random().toString(36).substring(2, 6));
    
    // Process rejections
    const rejectLines = formData.rejectionReasonList.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    let finalCategory = sourceType as Category;
    let finalGrade = formData.grade;
    let finalStatus = formData.status;
    let finalIsSample = isSample;

    if (existingVendor) {
      finalGrade = existingVendor.grade;
      finalStatus = existingVendor.status;
      finalIsSample = !!existingVendor.isSample;
      finalCategory = existingVendor.category;
      if (!existingVendor.isSample && existingVendor.category !== 'blacklist') {
        finalCategory = sourceType as Category;
      }
      if (finalIsSample) {
        finalCategory = 'sample';
        if (sampleStatus === 'rejected') {
          finalStatus = 'rejected';
        } else if (sampleStatus === 'not_approved') {
          finalStatus = 'conditional';
        } else {
          finalStatus = 'approved';
        }
      }
    } else {
      if (finalIsSample) {
        finalGrade = null; // samples don't have evaluation grade
        
        if (sampleStatus === 'rejected') {
          finalStatus = 'rejected';
        } else if (sampleStatus === 'not_approved') {
          finalStatus = 'conditional';
        } else {
          finalStatus = 'approved';
        }
        
        finalCategory = 'sample';
      } else {
        if (formData.status === 'rejected' || formData.grade === 'rejected') {
          finalCategory = 'blacklist';
        }
      }
    }

    const hasStatusChanged = existingVendor && existingVendor.status !== finalStatus;
    const hasGradeChanged = existingVendor && existingVendor.grade !== finalGrade;
    const statusTextMap = { approved: 'تایید شده', conditional: 'تایید مشروط', rejected: 'مردود', new: 'جدید' };
    
    let actionDetail = existingVendor 
      ? `ویرایش اطلاعات سورس "${formData.material}" (${formData.name})`
      : `ثبت سورس جدید "${formData.material}" (${formData.name}) در دسته ${categoryLabels[finalCategory as keyof typeof categoryLabels]?.fa || finalCategory}`;
    
    if (hasStatusChanged) {
      actionDetail += ` | تغییر وضعیت از [${statusTextMap[existingVendor.status] || existingVendor.status}] به [${statusTextMap[finalStatus] || finalStatus}]`;
    }
    if (hasGradeChanged) {
      actionDetail += ` | تغییر درجه کیفی از [Grade ${existingVendor.grade || 'نامشخص'}] به [Grade ${finalGrade || 'نامشخص'}]`;
    }

    const newLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      action: actionDetail,
      date: new Date().toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }),
      user: currentUser?.name || 'کاربر سیستم'
    };

    const finalCas = formData.cas;
    const finalIrc = formData.irc;
    const finalIrcReceivedDate = formData.ircReceivedDate;
    const finalIrcExpiryDate = formData.ircExpiryDate;
    const finalLastAudit = formData.lastAudit;
    const finalNameEn = sourceType === 'domestic' ? '' : formData.nameEn;

    const vendorContext: Vendor = {
      ...existingVendor,
      id: newId,
      category: finalCategory,
      material: formData.material,
      materialEn: formData.materialEn,
      cas: finalCas,
      irc: finalIrc,
      ircReceivedDate: finalIrcReceivedDate,
      ircExpiryDate: finalIrcExpiryDate,
      lastAudit: finalLastAudit,
      name: formData.name,
      nameEn: finalNameEn,
      country: existingVendor?.country && existingVendor.country !== 'نامشخص' ? existingVendor.country : extractCountry(formData.contactInfo),
      contactInfo: formData.contactInfo,
      grade: finalGrade,
      status: finalStatus,
      scores: existingVendor?.scores || null, 
      rejectionReasons: rejectLines.length > 0 ? rejectLines : null,
      registrationDate: existingVendor?.registrationDate || new Date().toLocaleDateString('fa-IR'),
      isSample: finalIsSample,
      activityLogs: [...(existingVendor?.activityLogs || []), newLog],
      materialId: selectedMaterialId || null
    } as Vendor;

    onSave(vendorContext, null);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-16 text-center flex flex-col items-center justify-center mt-6 fade-in" dir="rtl">
        <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 mb-6">
          <CheckCircle className="w-16 h-16 text-emerald-500 bounce-in" />
        </div>
        <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2">{existingVendor ? 'تغییرات با موفقیت ذخیره شد' : 'سورس جدید با موفقیت ثبت شد'}</h3>
        <p className="text-[#6E6E73] text-sm font-medium">اطلاعات با موفقیت در آرشیو ثبت گردید. در حال بازگشت...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-right mt-6 fade-in" dir="rtl">
      <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-center bg-[#F5F5F7]/40 rounded-t-2xl">
        <h2 className="text-lg font-bold flex items-center gap-2 text-[#1D1D1F]">
          {existingVendor ? <Building className="w-5 h-5 text-[#0071E3]" /> : <Plus className="w-5 h-5 text-[#0071E3]" />}
          {existingVendor ? 'ویرایش سورس' : 'افزودن سورس جدید'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[#F5F5F7] rounded-lg text-[#86868B] hover:text-[#1D1D1F] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">نوع دسته بندی (Source Type)</label>
              <select className={`w-full bg-[#0071E3]/5 border border-[#0071E3]/20 rounded-lg px-3 py-2 text-[#0071E3] font-bold focus:outline-none focus:ring-1 focus:ring-[#0071E3] ${existingVendor ? 'opacity-70' : ''}`} value={sourceType} onChange={e => setSourceType(e.target.value as Category)}>
                <option value="domestic">خرید داخلی</option>
                <option value="foreign">خرید خارجی</option>
                <option value="veterinary">دامی</option>
                <option value="packaging">اقلام بسته‌بندی</option>
                <option value="blacklist">لیست سیاه</option>
              </select>
            </div>
            
            {!existingVendor && (
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={isSample} 
                    onChange={e => setIsSample(e.target.checked)}
                    className="w-4 h-4 text-[#0071E3] rounded border-[#D2D2D7] focus:ring-[#0071E3]"
                  />
                  <span className="text-sm font-bold text-[#1D1D1F]">این تامین‌کننده به عنوان یک «نمونه» ثبت می‌شود</span>
                </label>

                {isSample && (
                  <div className="space-y-1 fade-in">
                    <label className="text-[#1D1D1F] font-semibold text-xs">وضعیت نمونه (Sample Status)</label>
                    <select className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3]" value={sampleStatus} onChange={e => setSampleStatus(e.target.value)}>
                      <option value="approved">Approved (تایید شده)</option>
                      <option value="not_approved">Approved conditional (تایید مشروط)</option>
                      <option value="rejected">Reject (رد شده)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {materials.length > 0 && (
            <div className="space-y-1 md:col-span-2 border border-dashed border-indigo-200 bg-indigo-50/20 p-4 rounded-xl text-right">
              <label className="text-indigo-700 font-extrabold text-xs flex items-center gap-1">
                <span>🔗 اتصال هوشمند به بانک مواد اولیه (Material Master)</span>
              </label>
              <select 
                className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] text-right cursor-pointer mt-1.5 text-xs font-bold"
                value={selectedMaterialId} 
                onChange={e => {
                  const matId = e.target.value;
                  setSelectedMaterialId(matId);
                  const matObj = materials.find(m => m.id === matId);
                  if (matObj) {
                    setFormData({
                      ...formData,
                      material: matObj.name,
                      materialEn: matObj.nameEn,
                      cas: matObj.cas && matObj.cas !== 'N/A' ? matObj.cas : '',
                    });
                  }
                }}
              >
                <option value="">-- انتخاب از بانک مواد جهت تکمیل اتوماتیک فیلدهای زیر --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.standardNameFa || m.name} ({m.nameEn})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">در صورت انتخاب، مشخصات این ماده خام بلافاصله در فیلدهای زیر بارگذاری شده و پرونده سورس به صورت رابطه‌ای به شناسه کالا لینک می‌شود.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-1 md:col-span-2">
            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">نام ماده (فارسی)</label>
              <input required list="material-suggestions" type="text" className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3]" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
              <datalist id="material-suggestions">
                {materialSuggestions.map((s, i) => <option key={i} value={s} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">نام ماده (انگلیسی)</label>
              <input required list="material-en-suggestions" type="text" dir="ltr" className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] text-left focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] font-mono text-sm" value={formData.materialEn} onChange={e => setFormData({...formData, materialEn: e.target.value})} />
              <datalist id="material-en-suggestions">
                {materialEnSuggestions.map((s, i) => <option key={i} value={s} />)}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">Trader / تامین‌کننده</label>
              <input required list="trader-suggestions" type="text" className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <datalist id="trader-suggestions">
                {traderSuggestions.map((s, i) => <option key={i} value={s} />)}
              </datalist>
            </div>
            {sourceType !== 'domestic' && (
              <div className="space-y-1">
                <label className="text-[#1D1D1F] font-semibold text-xs">Trader / تامین‌کننده (انگلیسی)</label>
                <input type="text" list="trader-en-suggestions" dir="ltr" className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] text-left focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] font-mono text-sm" value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} />
                <datalist id="trader-en-suggestions">
                  {traderEnSuggestions.map((s, i) => <option key={i} value={s} />)}
                </datalist>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">CAS Number (اختیاری)</label>
              <input type="text" dir="ltr" className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] text-left focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] font-mono text-sm" value={formData.cas} onChange={e => setFormData({...formData, cas: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">کد IRC / کد IVC / شناسه اختصاصی (اختیاری)</label>
              <input type="text" dir="ltr" className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] text-left focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] font-mono text-sm" value={formData.irc} onChange={e => setFormData({...formData, irc: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">تاریخ دریافت IRC (اختیاری)</label>
              <ShamsiDatePicker 
                value={formData.ircReceivedDate}
                onChange={val => setFormData({...formData, ircReceivedDate: val})}
                placeholder="مثال: 1403/05/12"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#1D1D1F] font-semibold text-xs">تاریخ انقضای IRC (اختیاری)</label>
              <ShamsiDatePicker 
                value={formData.ircExpiryDate}
                onChange={val => setFormData({...formData, ircExpiryDate: val})}
                placeholder="مثال: 1408/05/12"
              />
            </div>

            {!existingVendor && (
              <div className="space-y-1 md:col-span-2">
                 <label className="text-[#1D1D1F] text-sm font-semibold select-none text-right">وضعیت و گرید اولیه</label>
                 <div className="w-full bg-[#0071E3]/5 border border-[#0071E3]/20 rounded-lg px-3 py-2.5 text-[#0071E3] font-medium text-center">
                   ثبت جهت بررسی (ارزیابی در مرحله بعد انجام می‌شود)
                 </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[#1D1D1F] font-semibold text-xs">اطلاعات تماس ارزیابی / آدرس شرکت</label>
            <textarea className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] h-20 placeholder:text-slate-400" value={formData.contactInfo} onChange={e => setFormData({...formData, contactInfo: e.target.value})}></textarea>
          </div>

          <div className="space-y-1">
            <label className="text-[#1D1D1F] font-semibold text-xs">سوابق انحرافات (هر مورد در یک خط)</label>
            <textarea className="w-full bg-white border border-[#D2D2D7] rounded-lg px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] focus:border-[#0071E3] h-24 placeholder:text-slate-400" value={formData.rejectionReasonList} onChange={e => setFormData({...formData, rejectionReasonList: e.target.value})}></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5EA]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all font-semibold">انصراف</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-[#0071E3] hover:bg-[#0025D2] text-white font-medium transition-all shadow-sm">
              {existingVendor ? 'ثبت تغییرات' : 'ثبت سورس'}
            </button>
          </div>
        </form>
      </div>
  );
}
