import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Material, MaterialForm } from './MaterialForm';
import { MaterialDetailView } from './MaterialDetailView';
import { MaterialRoleBadge } from './MaterialRoleBadge';
import { 
  Plus, Search, Edit2, Database, Trash2, Layers, Filter, Eye, ArrowUpDown, 
  ChevronRight, ChevronLeft, Calendar, FileText, Globe, Check, AlertCircle 
} from 'lucide-react';

interface MaterialMasterViewProps {
  materials: Material[];
  vendors: any[];
  onSaveMaterial: (material: Material) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<boolean>;
  onNavigateToVendor: (vendorId: string) => void;
  currentUserRole?: string;
}

export const MaterialMasterView: React.FC<MaterialMasterViewProps> = ({
  materials,
  vendors,
  onSaveMaterial,
  onDeleteMaterial,
  onNavigateToVendor,
  currentUserRole,
}) => {
  // Navigation states inside Material Master View
  const [subView, setSubView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Deletion state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'cas' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Filter & Search computation
  const processedMaterials = useMemo(() => {
    let result = [...materials];

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => {
        return m.name?.toLowerCase().includes(q) ||
               m.nameEn?.toLowerCase().includes(q) ||
               m.cas?.toLowerCase().includes(q) ||
               m.parentProduct?.toLowerCase().includes(q) ||
               m.parentProductEn?.toLowerCase().includes(q) ||
               m.standardNameFa?.toLowerCase().includes(q) ||
               m.standardNameEn?.toLowerCase().includes(q);
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(m => m.role === roleFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let fieldA = '';
      let fieldB = '';

      if (sortBy === 'name') {
        fieldA = a.name || '';
        fieldB = b.name || '';
      } else if (sortBy === 'cas') {
        fieldA = a.cas || '';
        fieldB = b.cas || '';
      } else if (sortBy === 'role') {
        fieldA = a.role || '';
        fieldB = b.role || '';
      }

      if (sortOrder === 'asc') {
        return fieldA.localeCompare(fieldB, 'fa');
      } else {
        return fieldB.localeCompare(fieldA, 'fa');
      }
    });

    return result;
  }, [materials, searchQuery, roleFilter, sortBy, sortOrder]);

  // Paginated chunk
  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedMaterials.slice(startIndex, startIndex + itemsPerPage);
  }, [processedMaterials, currentPage]);

  const totalPages = Math.ceil(processedMaterials.length / itemsPerPage) || 1;

  // Find linked vendors for detail page
  const linkedVendors = useMemo(() => {
    if (!selectedMaterial) return [];
    return vendors.filter(v => v.materialId === selectedMaterial.id);
  }, [selectedMaterial, vendors]);

  const handleSave = async (m: Material) => {
    try {
      await onSaveMaterial(m);
      setAlertMsg({ type: 'success', text: 'اطلاعات ماده اولیه با موفقیت ثبت و ذخیره شد.' });
      setSubView('list');
      setEditingMaterial(null);
      setTimeout(() => setAlertMsg(null), 4000);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'خطا در ذخیره‌سازی اطلاعات.' });
      setTimeout(() => setAlertMsg(null), 5000);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { id } = deleteConfirmation;
    setDeleteConfirmation(null);
    try {
      const success = await onDeleteMaterial(id);
      if (success) {
        setAlertMsg({ type: 'success', text: 'ماده اولیه با موفقیت از سیستم حذف گردید.' });
        setCurrentPage(1);
      } else {
        setAlertMsg({ 
          type: 'error', 
          text: 'خطا در حذف: این ماده اولیه دارای منابع تأمین فعال (Sources) در سیستم است و حذف آن مجاز نیست.' 
        });
      }
      setTimeout(() => setAlertMsg(null), 5000);
    } catch (err: any) {
      setAlertMsg({ 
        type: 'error', 
        text: 'خطا در فرآیند حذف ماده اولیه.' 
      });
      setTimeout(() => setAlertMsg(null), 5000);
    }
  };

  const triggerSort = (field: 'name' | 'cas' | 'role') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border text-right text-xs font-bold ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${alertMsg.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
          <p className="flex-1">{alertMsg.text}</p>
        </div>
      )}

      {/* ALWAYS RENDER LIST */}
        <div className="space-y-6">
          {/* Dashboard Header Banner */}
          <div className="bg-gradient-to-l from-indigo-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-right">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 justify-end">
                <span>بانک جامع مواد اولیه (Material Master)</span>
                <Layers className="w-6 h-6 text-indigo-300" />
              </h2>
              <p className="text-xs text-indigo-200/80 mt-1">مدیریت متمرکز، استانداردسازی کدهای رگولاتوری، پایش مجوزها و اطلاعات سم‌شناسی و ایمنی مواد خام</p>
            </div>
            
            {currentUserRole !== 'finance' && (
              <button
                onClick={() => {
                  setEditingMaterial(null);
                  setSubView('form');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white shadow-md hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف ماده جدید (Material)</span>
              </button>
            )}
          </div>

          {/* Quick Statistics Counters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-right">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400">کل مواد ثبت‌شده</span>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{materials.length}</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400">مواد موثره فعال (APIs)</span>
              <p className="text-xl font-extrabold text-indigo-600 mt-1">{materials.filter(m => m.role === 'API').length}</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400">سورس‌های متصل به مواد</span>
              <p className="text-xl font-extrabold text-amber-600 mt-1">{vendors.filter(v => v.materialId).length}</p>
            </div>
          </div>

          {/* Search and Filters panel */}
          {materials.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-right">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Search input */}
                <div className="md:col-span-8 relative">
                  <input
                    type="text"
                    placeholder="جستجو در نام، نام لاتین، CAS، محصول..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs transition-all text-right"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>

                {/* Role filter */}
                <div className="md:col-span-4 flex items-center gap-2 justify-end">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 outline-none focus:border-indigo-500 text-right font-medium"
                  >
                    <option value="all">همه نقش‌های پایه</option>
                    <option value="API">ماده مؤثره (API)</option>
                    <option value="INT">حدواسط (INT)</option>
                    <option value="REA">واکنشگر (REA)</option>
                    <option value="SOL">حلال (SOL)</option>
                    <option value="Excipient">ماده کمکی (Excipient)</option>
                  </select>
                  <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* Records Table or Empty State */}
          {materials.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-6 shadow-sm">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">بانک مواد اولیه خالی است</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 max-w-md">
                هنوز هیچ ماده اولیه‌ای ثبت نشده است. برای شروع فرآیند ارزیابی تأمین‌کنندگان، ابتدا باید مواد اولیه پایه را در سیستم تعریف کنید.
              </p>
              {currentUserRole !== 'finance' && (
                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setSubView('form');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>ثبت اولین ماده اولیه</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-right">
            <div className="overflow-x-auto">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-4 px-4 text-center w-36">عملیات کنترلی</th>
                    <th className="py-4 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors w-32" onClick={() => triggerSort('role')}>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>نقش ماده</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-4 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors w-44" onClick={() => triggerSort('cas')}>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>CAS Number</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-4 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => triggerSort('name')}>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>عنوان استاندارد رگولاتوری</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <p>هیچ ماده اولیه منطبق با فیلترهای بالا یافت نشد.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedMaterials.map((m) => {
                      const vendorCount = vendors.filter(v => v.materialId === m.id).length;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Actions */}
                          <td className="py-3 px-4 text-center w-36">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMaterial(m);
                                  setSubView('detail');
                                }}
                                title="مشاهده شناسنامه تخصصی شیمی و رگولاتوری"
                                className="p-1.5 rounded-lg border border-slate-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {currentUserRole !== 'finance' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMaterial(m);
                                      setSubView('form');
                                    }}
                                    title="ویرایش اطلاعات"
                                    className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(m.id, m.name)}
                                    title="حذف از بانک"
                                    className="p-1.5 rounded-lg border border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4 text-right w-32">
                            <MaterialRoleBadge role={m.role} />
                          </td>

                          {/* CAS */}
                          <td className="py-3 px-4 text-right font-mono text-slate-600 w-44">
                            {m.cas && m.cas !== 'N/A' ? m.cas : <span className="text-slate-300">N/A</span>}
                          </td>

                          {/* Titles */}
                          <td className="py-3 px-4 text-right">
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-start gap-1.5">
                                <span>{m.standardNameFa || m.name}</span>
                                {vendorCount > 0 && (
                                  <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full" title="تعداد سازنده‌های فعال">
                                    {vendorCount} سورس
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] font-mono text-slate-400">{m.standardNameEn || m.nameEn}</p>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="px-3">صفحه {currentPage} از {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <span>کل مواد یافت شده: {processedMaterials.length} مورد</span>
            </div>
          </div>
          )}
        </div>


      {/* Full Page View for MaterialForm */}
      <AnimatePresence>
        {subView === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#F5F5F7] z-40 overflow-y-auto"
          >
            <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-5xl mx-auto">
              <MaterialForm
                materials={materials}
                existingMaterial={editingMaterial || undefined}
                onSave={handleSave}
                onClose={() => setSubView('list')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Page View for MaterialDetailView */}
      <AnimatePresence>
        {subView === 'detail' && selectedMaterial && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#F5F5F7] z-40 overflow-y-auto"
          >
            <div className="p-6 md:p-8 lg:p-12 min-h-full max-w-7xl mx-auto">
              <MaterialDetailView
                material={selectedMaterial}
                linkedVendors={linkedVendors}
                onBack={() => setSubView('list')}
                onNavigateToVendor={onNavigateToVendor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            {/* Dialog Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100 text-right space-y-4"
              dir="rtl"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-800 text-sm">حذف ماده اولیه</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    آیا از حذف ماده اولیه <strong className="text-slate-700">«{deleteConfirmation.name}»</strong> اطمینان دارید؟ این عملیات غیر قابل بازگشت است.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  بله، حذف شود
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
