import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShamsiDatePicker } from './ShamsiDatePicker';
import { Layers, Check, X, ShieldAlert, AlertTriangle, HelpCircle, Save } from 'lucide-react';

export interface Material {
  id: string;
  name: string;
  nameEn: string;
  cas: string;
  role: string;
  parentProduct: string;
  parentProductEn: string;
  standardNameFa: string;
  standardNameEn: string;
}

interface MaterialFormProps {
  materials: Material[];
  existingMaterial?: Material;
  onSave: (material: Material) => void;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { val: 'API', label: 'ماده مؤثره (API)', prefixFa: 'ماده مؤثره', codeEn: 'API' },
  { val: 'INT', label: 'حدواسط (INT)', prefixFa: 'حدواسط', codeEn: 'INT' },
  { val: 'REA', label: 'واکنشگر (REA)', prefixFa: 'واکنشگر', codeEn: 'REA' },
  { val: 'SOL', label: 'حلال (SOL)', prefixFa: 'حلال', codeEn: 'SOL' },
  { val: 'Excipient', label: 'ماده کمکی (Excipient)', prefixFa: 'ماده کمکی', codeEn: 'EXP' },
];

export const MaterialForm: React.FC<MaterialFormProps> = ({
  materials,
  existingMaterial,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(existingMaterial?.name || '');
  const [nameEn, setNameEn] = useState(existingMaterial?.nameEn || '');
  const [cas, setCas] = useState(existingMaterial?.cas || '');
  const [role, setRole] = useState(existingMaterial?.role || 'API');
  const [parentProduct, setParentProduct] = useState(existingMaterial?.parentProduct || '');
  const [parentProductEn, setParentProductEn] = useState(existingMaterial?.parentProductEn || '');

  // Previews
  const [standardNameFa, setStandardNameFa] = useState('');
  const [standardNameEn, setStandardNameEn] = useState('');

  // Duplicate states
  const [isDuplicateCas, setIsDuplicateCas] = useState(false);
  const [isDuplicateNameFa, setIsDuplicateNameFa] = useState(false);
  const [isDuplicateNameEn, setIsDuplicateNameEn] = useState(false);

  // Auto generation formulas
  useEffect(() => {
    const selectedRole = ROLE_OPTIONS.find(r => r.val === role);
    const prefixFa = selectedRole ? selectedRole.prefixFa : role;
    const codeEn = selectedRole ? selectedRole.codeEn : role;

    const standardFa = name && parentProduct 
      ? `${prefixFa}- ${name} ( برای ${parentProduct} )` 
      : name 
        ? `${prefixFa}- ${name}`
        : '';
        
    const standardEn = nameEn && parentProductEn 
      ? `${codeEn} – ${nameEn} (for ${parentProductEn})` 
      : nameEn 
        ? `${codeEn} – ${nameEn}`
        : '';

    setStandardNameFa(standardFa);
    setStandardNameEn(standardEn);
  }, [name, nameEn, role, parentProduct, parentProductEn]);

  // Check duplicates live
  useEffect(() => {
    if (!materials) return;
    
    const otherMaterials = existingMaterial 
      ? materials.filter(m => m.id !== existingMaterial.id)
      : materials;

    const trimmedCas = cas.trim();
    setIsDuplicateCas(
      trimmedCas !== '' && trimmedCas !== 'N/A' && trimmedCas !== 'NA' &&
      otherMaterials.some(m => m.cas?.toLowerCase().trim() === trimmedCas.toLowerCase())
    );

    const trimmedFa = name.trim();
    setIsDuplicateNameFa(
      trimmedFa !== '' &&
      otherMaterials.some(m => m.name?.toLowerCase().trim() === trimmedFa.toLowerCase())
    );

    const trimmedEn = nameEn.trim();
    setIsDuplicateNameEn(
      trimmedEn !== '' &&
      otherMaterials.some(m => m.nameEn?.toLowerCase().trim() === trimmedEn.toLowerCase())
    );
  }, [cas, name, nameEn, materials, existingMaterial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nameEn) return;

    onSave({
      id: existingMaterial?.id || `mat_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
      name: name.trim(),
      nameEn: nameEn.trim(),
      cas: cas.trim() || 'N/A',
      role,
      parentProduct: parentProduct.trim(),
      parentProductEn: parentProductEn.trim(),
      standardNameFa,
      standardNameEn,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-right">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              {existingMaterial ? 'ویرایش ماده اولیه' : 'تعریف ماده اولیه جدید (Material)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">افزودن و اصلاح رکوردهای اطلاعاتی بانک مواد اولیه</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DUPLICATE WARNINGS */}
        {(isDuplicateCas || isDuplicateNameFa || isDuplicateNameEn) && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex flex-col gap-2 text-amber-800 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>هشدارهای امنیتی و رگولاتوری (کالای تکراری)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pr-2">
              {isDuplicateCas && (
                <li><strong>شماره CAS</strong> وارد شده قبلاً در سیستم ثبت شده است. از تطابق رکوردهای موازی اطمینان حاصل کنید.</li>
              )}
              {isDuplicateNameFa && (
                <li>ماده‌ای با این <strong>نام فارسی</strong> قبلاً ثبت شده است.</li>
              )}
              {isDuplicateNameEn && (
                <li>ماده‌ای با این <strong>نام لاتین</strong> قبلاً ثبت شده است.</li>
              )}
            </ul>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persian Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">نام فارسی ماده <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: آتورواستاتین کلسیم"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all placeholder:text-slate-300 text-right font-medium"
            />
          </div>

          {/* Latin Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">نام انگلیسی ماده (IUPAC / Generic) <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Atorvastatin Calcium"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all placeholder:text-slate-300 text-left font-mono"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-600">نقش ماده در فرآیند</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setRole(opt.val)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                    role === opt.val
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* CAS Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">شماره ریجستری مواد آزمایشگاهی (CAS Number)</label>
            <input 
              type="text"
              value={cas}
              onChange={(e) => setCas(e.target.value)}
              placeholder="e.g. 134-03-2 or N/A"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all placeholder:text-slate-300 text-left font-mono"
            />
          </div>

          {/* Parent Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">برای محصول (نام فارسی نهایی)</label>
            <input 
              type="text"
              value={parentProduct}
              onChange={(e) => setParentProduct(e.target.value)}
              placeholder="مثال: قرص آتورواستاتین"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all placeholder:text-slate-300 text-right"
            />
          </div>

          {/* Parent Product Name English */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">For Product (Latin/English)</label>
            <input 
              type="text"
              value={parentProductEn}
              onChange={(e) => setParentProductEn(e.target.value)}
              placeholder="e.g. Atorvastatin Tablets"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all placeholder:text-slate-300 text-left font-mono"
            />
          </div>
        </div>

        {/* Automatic Standard Naming Previews */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 border-b border-slate-200/50 pb-1.5">پیش‌نمایش نام‌های استاندارد اتوماتیک رگولاتوری</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400">نام استاندارد فارسی:</span>
              <p className="text-xs font-bold text-slate-700 bg-white border border-slate-200/60 p-2.5 rounded-lg text-right min-h-[36px] flex items-center justify-end">
                {standardNameFa || <span className="text-slate-300">در حال تولید خودکار...</span>}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400">Standard English Name:</span>
              <p className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200/60 p-2.5 rounded-lg text-left min-h-[36px] flex items-center justify-start">
                {standardNameEn || <span className="text-slate-300">Auto generating...</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={!name || !nameEn}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره ماده اولیه</span>
          </button>
        </div>
      </form>
    </div>
  );
};
