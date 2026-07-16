import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building, Pencil, Trash2, AlertCircle, Globe, ClipboardCheck, Info, 
  AlertTriangle, FileText, Microscope, Save, Trash, Plus, X, 
  Handshake, Warehouse, Coins, CheckCircle, ShieldAlert, ChevronDown, 
  Activity, Printer, ChevronLeft, ChevronRight, Menu, Shield, DollarSign,
  User as UserIcon, Pill, Boxes, PawPrint, Clipboard, Hash, RotateCcw, 
  Download, ChevronUp, Database, Award, Layers, Archive
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Vendor, User, Scores, RiskAssessmentData, AnalysisRecord } from '../../types';
import { Material } from '../MaterialForm';
import { StickyRecordHeader } from '../StickyRecordHeader';
import { VendorForm } from './VendorForm';
import { GradeBadge } from '../GradeBadge';
import { MaterialRoleBadge, getRoleBadgeDetails } from '../MaterialRoleBadge';
import { getScoreColorClass, getScoreColorConfig } from '../ScoreBar';
import { getDisplayCountry, calculateOverallScore } from '../../utils/vendorUtils';
import { FmeaService } from '../../utils/fmeaService';
import { ScoringGuide, ScoreCard } from '../ScoringGuide';
import { ShamsiDatePicker } from '../ShamsiDatePicker';

export interface VendorDetailProps {
  vendor: Vendor;
  db: Vendor[];
  onBack: () => void;
  onSave: (v: Vendor, msg?: string | null) => void;
  onDelete: (id: string) => void;
  currentUser: User;
  materials?: Material[];
}

export function VendorDetail({ 
  vendor, 
  db, 
  onBack, 
  onSave, 
  onDelete, 
  currentUser, 
  materials = [] 
}: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [isEditing]);

  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showAdminScoresEdit, setShowAdminScoresEdit] = useState(false);

  const [showAddAnalysisForm, setShowAddAnalysisForm] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [newAnalysis, setNewAnalysis] = useState({
    date: new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/[۰-۹]/g, c => '0123456789'[c.charCodeAt(0) - 1776]),
    qcCode: '',
    decision: 'Pass' as 'Pass' | 'Reject' | 'Approved Conditional',
    deviationReason: 'None' as 'None' | 'NCR' | 'Deviation' | 'OOS' | 'CAPA' | 'OOT' | 'Complaint' | 'Other',
    comments: ''
  });

  const handleAddAnalysisSubmit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newAnalysis.date.trim()) {
      alert('لطفاً تاریخ آزمایش را انتخاب کنید.');
      return;
    }
    if (!newAnalysis.qcCode.trim()) {
      alert('لطفاً کد آزمایشگاهی (QC Code) را وارد کنید.');
      return;
    }

    const record = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      date: newAnalysis.date,
      qcCode: newAnalysis.qcCode.trim(),
      decision: newAnalysis.decision,
      deviationReason: newAnalysis.deviationReason,
      comments: newAnalysis.comments.trim(),
      recordedBy: currentUser ? currentUser.name : 'کیفیت / سیستم'
    };

    const updatedRecords = [...(vendor.analysisRecords || []), record];
    
    const decisionMapList = { Pass: 'قبول (Pass)', Reject: 'مردود (Reject)', 'Approved Conditional': 'قبول مشروط (Approved Conditional)' };
    const newLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      action: `ثبت نتیجه آزمایش جدید برای سورس "${vendor.material}" (${vendor.name}) - تصمیم: [${decisionMapList[record.decision] || record.decision}] (کد QC: ${record.qcCode})`,
      date: new Date().toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }),
      user: currentUser?.name || 'کاربر سیستم'
    };

    onSave({
      ...vendor,
      analysisRecords: updatedRecords,
      activityLogs: [...(vendor.activityLogs || []), newLog]
    }, null);

    setAnalysisSuccess(true);

    setTimeout(() => {
      setAnalysisSuccess(false);
      setShowAddAnalysisForm(false);
      setNewAnalysis({
        date: new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/[۰-۹]/g, c => '0123456789'[c.charCodeAt(0) - 1776]),
        qcCode: '',
        decision: 'Pass',
        deviationReason: 'None',
        comments: ''
      });
    }, 1000);
  };

  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<{
    date: string;
    qcCode: string;
    decision: 'Pass' | 'Reject' | 'Approved Conditional';
    deviationReason: 'None' | 'NCR' | 'Deviation' | 'OOS' | 'CAPA' | 'OOT' | 'Complaint' | 'Other';
    comments: string;
  } | null>(null);
  const [confirmDeleteAnalysisId, setConfirmDeleteAnalysisId] = useState<string | null>(null);

   const handleEditAnalysisStart = (record: AnalysisRecord) => {
    setEditingAnalysisId(record.id);
    setEditingAnalysis({
      date: record.date || '',
      qcCode: record.qcCode,
      decision: record.decision,
      deviationReason: record.deviationReason,
      comments: record.comments || ''
    });
    setConfirmDeleteAnalysisId(null);
  };

  const handleEditAnalysisCancel = () => {
    setEditingAnalysisId(null);
    setEditingAnalysis(null);
  };

  const handleEditAnalysisSave = (recordId: string) => {
    if (!editingAnalysis || !editingAnalysis.date.trim()) {
      alert('لطفاً تاریخ آزمایش را انتخاب کنید.');
      return;
    }
    if (!editingAnalysis.qcCode.trim()) {
      alert('لطفاً کد آزمایشگاهی (QC Code) را وارد کنید.');
      return;
    }

    const updatedRecords = (vendor.analysisRecords || []).map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          date: editingAnalysis.date,
          qcCode: editingAnalysis.qcCode.trim(),
          decision: editingAnalysis.decision,
          deviationReason: editingAnalysis.deviationReason,
          comments: editingAnalysis.comments.trim(),
          recordedBy: currentUser ? `${currentUser.name} (ویرایشگر)` : r.recordedBy
        };
      }
      return r;
    });

    const decisionMapList = { Pass: 'قبول (Pass)', Reject: 'مردود (Reject)', 'Approved Conditional': 'قبول مشروط (Approved Conditional)' };
    const newLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      action: `ویرایش نتیجه آزمایش برای سورس "${vendor.material}" (${vendor.name}) - تصمیم جدید: [${decisionMapList[editingAnalysis.decision] || editingAnalysis.decision}] (کد QC: ${editingAnalysis.qcCode})`,
      date: new Date().toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }),
      user: currentUser?.name || 'کاربر سیستم'
    };

    onSave({
      ...vendor,
      analysisRecords: updatedRecords,
      activityLogs: [...(vendor.activityLogs || []), newLog]
    }, 'نتیجه آزمایش با موفقیت ویرایش شد!');

    setEditingAnalysisId(null);
    setEditingAnalysis(null);
  };

  const handleDeleteAnalysis = (recordId: string) => {
    const updatedRecords = (vendor.analysisRecords || []).filter(r => r.id !== recordId);
    const deletedRecord = (vendor.analysisRecords || []).find(r => r.id === recordId);
    const newLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      action: `حذف نتیجه آزمایش برای سورس "${vendor.material}" (${vendor.name}) ${deletedRecord ? `(کد QC: ${deletedRecord.qcCode})` : ''}`,
      date: new Date().toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }),
      user: currentUser?.name || 'کاربر سیستم'
    };

    onSave({
      ...vendor,
      analysisRecords: updatedRecords,
      activityLogs: [...(vendor.activityLogs || []), newLog]
    }, 'نتیجه آزمایش با موفقیت حذف شد!');
    setConfirmDeleteAnalysisId(null);
  };
  
  const evalFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showAdminScoresEdit && evalFormRef.current) {
      setTimeout(() => {
        evalFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showAdminScoresEdit]);

  const overall = calculateOverallScore(vendor.scores, true);
  let displayedScore: number | null = overall;
  if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'lab') {
    const deptId = currentUser.role;
    if (deptId === 'qa' || deptId === 'commercial' || deptId === 'planning' || deptId === 'finance') {
      displayedScore = (vendor.scores as any)?.[deptId] ?? null;
    }
  }
  const scoreConfig = getScoreColorConfig(displayedScore, vendor.status);

  const matchingMaterial = useMemo(() => {
    if (!materials || !vendor) return null;
    return materials.find(m => m.id === vendor.materialId || m.name === vendor.material || m.standardNameFa === vendor.material);
  }, [materials, vendor]);

  const materialRole = matchingMaterial?.role || 'API';
  const roleBadge = getRoleBadgeDetails(materialRole);

  return (
    <div className="space-y-6 fade-in relative pb-10 max-w-6xl mx-auto text-right" dir="rtl">
      
      {/* 📌 Sticky Header */}
      <StickyRecordHeader
        onBack={onBack}
        title={vendor.material}
        subtitleEn={vendor.materialEn || 'N/A'}
        titleBadge={{
          text: roleBadge.code,
          colorClass: roleBadge.colors,
          title: `نقش کالا: ${roleBadge.label}`
        }}
        infoBlock1={{
          icon: Building,
          label: 'تأمین‌کننده (Supplier)',
          value: vendor.name,
          valueEn: vendor.nameEn || 'N/A',
          badge: vendor.country || undefined,
        }}
        infoBlock2={{
          items: [
            { label: 'CAS No.', value: vendor.cas || '—', dir: 'ltr' },
            { 
              label: vendor.category === 'veterinary' ? 'کد IVC (دامی)' : 'کد IRC (دارویی)', 
              value: vendor.irc || '—', 
              dir: 'ltr' 
            }
          ]
        }}
        statusBadge={
          vendor.isSample ? (
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-250">
              نمونه تستی (Sample)
            </span>
          ) : (
            <GradeBadge grade={vendor.grade} status={vendor.status} scores={vendor.scores} />
          )
        }
        actions={
          currentUser?.role === 'admin' ? (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center justify-center gap-1.5 text-xs transition-all h-9 px-3 rounded-lg border font-bold cursor-pointer ${isEditing ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 shadow-sm'}`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditing ? 'انصراف' : 'ویرایش سورس'}</span>
            </button>
          ) : undefined
        }
      />

      {showConfirmDelete && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center fade-in shadow-sm">
           <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-slate-900 mb-1">آیا از حذف این فایل مطمئن هستید؟</h3>
           <p className="text-red-700 mb-6 font-medium text-sm">این عملیات غیر قابل بازگشت است و سورس به همراه تمامی ارزیابی‌های آن از سیستم حذف خواهد شد.</p>
           <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="px-6 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm"
              >
                انصراف
              </button>
              <button 
                onClick={() => onDelete(vendor.id)}
                className="px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-bold text-sm shadow-[0_4px_14px_rgba(220,38,38,0.25)]"
              >
                بله، حذف شود
              </button>
           </div>
        </div>
      )}

      {/* Editing Form */}
      <div ref={editFormRef} className={`overflow-hidden transition-all duration-300 ease-in-out ${isEditing ? 'opacity-100 max-h-[2000px] mb-6' : 'opacity-0 max-h-0'}`}>
        {isEditing && (
          <VendorForm 
            db={db}
            categoryId={vendor.category} 
            existingVendor={vendor}
            materials={materials}
            onClose={() => setIsEditing(false)} 
            onSave={(v, msg) => { onSave(v, msg); setIsEditing(false); }} 
            currentUser={currentUser}
          />
        )}
      </div>

      {/* HERO CARD */}
      <div className={`bg-white border border-slate-200/60 rounded-2xl p-6 mb-6 shadow-sm ${scoreConfig.heroBorder}`}>
        <div className="flex flex-col xl:flex-row items-start justify-between gap-5 pb-1">
          <div className="flex items-center gap-5">
            {/* Score Ring */}
            <div className={`w-20 h-20 shrink-0 rounded-full border-4 flex items-center justify-center bg-slate-50 ${scoreConfig.border}`}>
              <span className="font-mono text-2xl font-black">
                {displayedScore !== null ? displayedScore : '-'}
              </span>
            </div>
            
            <div className="text-right">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-1 leading-tight">{vendor.name}</h2>
              <div className="text-slate-500 text-sm font-mono tracking-wide mb-3" dir="ltr">{vendor.nameEn}</div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="bg-slate-900/5 border border-slate-900/10 px-2 py-0.5 rounded-full text-slate-500 text-xs flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {getDisplayCountry(vendor)}
                </span>
                {vendor.isSample ? (
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    vendor.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    vendor.status === 'conditional' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <ClipboardCheck className="w-4 h-4 mr-1.5 ml-1" />
                    {vendor.status === 'approved' ? 'نمونه: Approved' :
                     vendor.status === 'conditional' ? 'نمونه: Not Approved' : 'نمونه: Rejected'}
                  </div>
                ) : (
                  <GradeBadge grade={vendor.grade} status={vendor.status} scores={vendor.scores} />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {currentUser.role === 'admin' && (
              <>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center justify-center gap-2 text-sm transition-all h-10 px-4 rounded-xl border font-bold ${isEditing ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 shadow-sm'}`}
                >
                  <Pencil className="w-4 h-4" />
                  <span>{isEditing ? 'انصراف' : 'ویرایش اطلاعات'}</span>
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center justify-center h-10 w-10 transition-colors rounded-xl border bg-white border-slate-300 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 shadow-sm"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 1. اطلاعات تامین کننده */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm text-right">
        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
          <Globe className="w-4 h-4 text-cyan-600" />
          <h3 className="font-bold text-slate-800 text-sm">مشخصات فنی و اطلاعات عمومی</h3>
        </div>
        
        <div className="flex flex-col gap-5 text-sm">
          {/* مشخصات اصلی ماده اولیه و کدهای ثبتی */}
          <div className="space-y-4">
            {/* جعبه شاخص ماده اولیه */}
            <div className="bg-slate-50/40 border border-slate-900/5 rounded-xl p-4 shadow-inner">
              <div className="text-slate-400 text-xs mb-1 font-medium">ماده اولیه / Material</div>
              <div className="font-black text-slate-900 text-lg sm:text-xl leading-relaxed mb-1" title={vendor.material}>
                {vendor.material}
              </div>
              <div className="text-xs sm:text-sm font-mono font-semibold text-slate-500 pb-0.5" dir="ltr">
                {vendor.materialEn}
              </div>
            </div>

            {/* کارت‌های فرعی مشخصات عددی */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-right">
                <div className="text-slate-400 text-xs mb-1.5 font-mono">CAS Number</div>
                <div className="font-mono text-slate-700 font-bold bg-slate-50 text-center py-1.5 px-3 rounded-lg border border-slate-900/5 text-sm" dir="ltr">
                  {vendor.cas || 'N/A'}
                </div>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-right">
                <div className="text-slate-400 text-xs mb-1.5 font-mono">
                  {vendor.category === 'veterinary' ? 'IVC Code' : 'IRC Code'}
                </div>
                <div className="font-mono text-slate-700 font-bold bg-slate-50 text-center py-1.5 px-3 rounded-lg border border-slate-900/5 text-sm" dir="ltr">
                  {vendor.irc || 'N/A'}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-right">
                <div className="text-slate-400 text-xs mb-1.5">کد سیستم / Unique ID</div>
                <div className="font-mono text-cyan-700 font-bold bg-cyan-50/50 text-center py-1.5 px-3 rounded-lg border border-cyan-100 text-sm" dir="ltr">
                  {vendor.id.substring(0, 8).toUpperCase()}
                </div>
              </div>

              {vendor.ircReceivedDate && (
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-right">
                  <div className="text-slate-400 text-xs mb-1.5">تاریخ دریافت IRC</div>
                  <div className="text-slate-700 font-bold bg-slate-50 text-center py-1.5 px-3 rounded-lg border border-slate-900/5 text-sm">
                    {vendor.ircReceivedDate}
                  </div>
                </div>
              )}

              {vendor.ircExpiryDate && (
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-right">
                  <div className="text-slate-400 text-xs mb-1.5">تاریخ انقضای IRC</div>
                  <div className="text-slate-700 font-bold bg-slate-50 text-center py-1.5 px-3 rounded-lg border border-slate-900/5 text-sm">
                    {vendor.ircExpiryDate}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* کادر اطلاعات تماس */}
          <div className="bg-slate-50/60 border border-slate-200/50 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-xs sm:text-sm">
              <Building className="w-4 h-4 text-cyan-600" />
              <span>اطلاعات تماس و آدرس تامین‌کننده</span>
            </div>
            
            <div className="min-h-[40px]">
              {vendor.contactInfo ? (
                <div className="text-slate-700 font-semibold text-sm leading-relaxed whitespace-pre-wrap text-right" dir="auto">
                  {vendor.contactInfo}
                </div>
              ) : (
                <div className="text-slate-400 text-xs text-center py-2">
                  اطلاعات تماسی برای این تامین‌کننده ثبت نشده است.
                </div>
              )}
            </div>
          </div>

          {/* سوابق انحرافات */}
          {vendor.rejectionReasons && vendor.rejectionReasons.length > 0 && (
            <div className="bg-slate-50/60 border border-slate-200/50 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-cyan-600" />
                <span>سوابق انحرافات</span>
              </div>
              <div className="text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap text-right" dir="auto">
                <ul className="list-disc list-inside space-y-1.5">
                  {vendor.rejectionReasons.map((reason, idx) => (
                    <li key={idx} className="break-words">{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {vendor.isSample && (
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl border border-indigo-200 shrink-0 text-indigo-600">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h3 className="text-base font-bold text-indigo-850 mb-1">نمونه تستی (Sample)</h3>
            <p className="text-indigo-700 text-sm font-medium">برای مواردی که به عنوان «نمونه» ثبت می‌شوند، نیازی به ارزیابی ریسک و فرم امتیازدهی دوره‌ای دپارتمان‌ها نمی‌باشد.</p>
          </div>
        </div>
      )}

      {vendor.status === 'rejected' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-rose-100 p-3 rounded-xl border border-rose-200 shrink-0">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-rose-800 mb-1">وضعیت: لیست سیاه — تامین‌کننده رد صلاحیت شده</h3>
              <p className="text-rose-700 text-sm mb-5 max-w-2xl font-semibold">این تامین‌کننده به دلایل زیر از لیست تامین‌کنندگان مجاز حذف شده است (Disqualified due to critical non-conformities):</p>
              
              <ul className="space-y-2">
                {vendor.rejectionReasons?.map((reason, idx) => (
                  <li key={idx} className="bg-white border border-rose-100 px-4 py-3 rounded-xl text-rose-800 text-sm flex gap-3 items-start font-medium shadow-sm">
                    <span className="bg-rose-50 text-rose-700 text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold">{idx + 1}</span>
                    {reason}
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-rose-200 pt-4 flex items-center text-xs text-rose-600/70 font-mono">
                <Info className="w-4 h-4 mr-2" /> {vendor.category === 'veterinary' ? 'IVC' : 'IRC'}_ISSUE_DATE: {vendor.lastAudit || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. اول بخش امتیاز دهی بیاد */}
      {!vendor.isSample && (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden text-right">
          <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-slate-800 text-sm">ارزیابی عملکرد تامین‌کنندگان <span className="text-slate-400 text-xs font-normal font-mono relative top-[0.5px]">(Evaluation)</span></h3>
            </div>
            {currentUser && currentUser.role !== 'lab' && !showAdminScoresEdit && (
              <button 
                onClick={() => setShowAdminScoresEdit(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition-colors text-xs font-bold flex items-center gap-1.5"
              >
                {vendor.scores && Object.values(vendor.scores).some(v => v > 0) ? 'تغییر امتیازات' : 'ثبت امتیاز ارزیابی'}
              </button>
            )}
            {showAdminScoresEdit && (
              <button 
                onClick={() => setShowAdminScoresEdit(false)}
                className="flex items-center justify-center gap-1.5 text-xs transition-colors w-fit px-4 py-1.5 rounded-lg border font-bold bg-white text-slate-700 hover:bg-slate-50 border-slate-300 shadow-sm"
              >
                <span>انصراف</span>
              </button>
            )}
          </div>

          <div className="p-6">
            {showAdminScoresEdit ? (
              <div ref={evalFormRef} className="space-y-6">
                <div className="bg-cyan-600/5 border border-cyan-600/20 rounded-xl p-4 flex items-center gap-3 text-cyan-700 text-right">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">{vendor.scores && Object.values(vendor.scores).some(v => v > 0) ? 'ویرایش امتیازات ارزیابی' : 'ثبت ارزیابی جدید'}</h4>
                    <p className="text-xs opacity-90 mt-0.5">لطفاً ارزیابی مربوط به بخش خود را بر اساس مستندات ثبت کنید.</p>
                  </div>
                </div>
                <EvaluationForm vendor={vendor} onSave={onSave} onClose={() => setShowAdminScoresEdit(false)} currentUser={currentUser} />
              </div>
            ) : vendor.scores ? (
              <div className="space-y-6">
                {/* Weighted average score */}
                {currentUser?.role === 'admin' ? (
                  <div className="flex justify-center p-2">
                    <div className="text-center bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col items-center justify-center min-w-[240px] shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-[3px] bg-cyan-600" />
                      <span className="text-slate-600 text-xs font-bold mb-1">امتیاز کل (میانگین وزنی)</span>
                      <span className="text-[10px] text-slate-400 font-mono mb-2">Weighted Average Score</span>
                      <span id="weighted-average-score-badge" className={`text-3xl font-extrabold font-mono tracking-tighter ${getScoreColorClass(overall)}`}>
                        {overall !== null ? overall : '-'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-right flex items-center gap-3 text-slate-600 mb-2">
                    <div className="w-1.5 h-8 bg-cyan-600 rounded-full" />
                    <div className="text-xs">
                      کاربر گرامی، شما با سطح دسترسی <strong className="text-cyan-700">
                        {currentUser?.role === 'qa' ? 'کیفیت (QA)' : 
                         currentUser?.role === 'commercial' ? 'بازرگانی' : 
                         currentUser?.role === 'planning' ? 'برنامه‌ریزی و انبار' : 
                         currentUser?.role === 'finance' ? 'مالی' : 'کاربر'}
                      </strong> وارد شده‌اید. بر این اساس، صرفاً به امتیاز ارزیابی ثبت شده واحد خود دسترسی دارید.
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  {/* ScoreCards - 2x2 Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FORM_LAYOUT.map(layout => {
                      const deptScore = vendor.scores[layout.id as keyof typeof vendor.scores];
                      if (deptScore === undefined || deptScore === null) return null;
                      
                      // Security Restriction: Only show the score of the user's role, except for Admin
                      if (currentUser?.role !== 'admin' && layout.id !== currentUser?.role) return null;
                      
                      return (
                        <ScoreCard 
                           key={layout.id} 
                           title={layout.title} 
                           titleEn={
                             layout.id === 'commercial' ? 'COMMERCIAL DEPT' : 
                             layout.id === 'qa' ? 'QUALITY' : 
                             layout.id === 'planning' ? 'PLANNING & WAREHOUSE' : 'FINANCE DEPT'}
                           icon={layout.icon}
                           score={deptScore}
                           items={layout.criteria.map(crit => ({
                             label: crit.label,
                             value: getRawScoreValue(vendor, layout.id, crit.key),
                             max: 5
                           }))}
                        />
                      );
                    })}
                  </div>

                  {/* Radar Chart (Distribution) is now below the scores, Admin only */}
                  {currentUser?.role === 'admin' && (
                    <div className="bg-white border border-slate-900/10 rounded-xl p-4 shadow-sm">
                      <div className="text-center mb-4">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">نمودار توزیع امتیازات بخش‌ها <span className="font-mono text-xs">(Score Distribution)</span></h4>
                        <div className="w-16 h-1 bg-cyan-500/20 mx-auto rounded-full" />
                      </div>
                      <div className="h-56 sm:h-64 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                            { subject: 'بازرگانی', A: vendor.scores.commercial || 0, fullMark: 100 },
                            { subject: 'کیفیت', A: vendor.scores.qa || 0, fullMark: 100 },
                            { subject: 'برنامه‌ریزی و انبار', A: vendor.scores.planning || 0, fullMark: 100 },
                            { subject: 'مالی', A: vendor.scores.finance || 0, fullMark: 100 },
                          ]}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Vazirmatn FD' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Radar name="Vendor" dataKey="A" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-250">
                هیچ امتیازی برای این تامین‌کننده ثبت نشده است. لطفاً نسبت به ثبت ارزیابی اقدام کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ارزیابی ریسک تامین کنندگان */}
      {!vendor.isSample && (currentUser?.role === 'admin' || currentUser?.role === 'qa' || currentUser?.role === 'lab') && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm text-right">
          <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">ارزیابی ریسک تامین کنندگان <span className="text-slate-400 text-xs font-normal font-mono relative top-[0.5px]">(Risk Assessment)</span></h3>
            </div>
            {(currentUser.role === 'qa' || currentUser.role === 'lab' || currentUser.role === 'admin') && !showRiskAssessment && (
              <button 
                onClick={() => setShowRiskAssessment(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors text-xs font-bold"
              >
                {vendor.riskAssessment ? 'بروزرسانی ارزیابی ریسک' : 'ثبت ارزیابی ریسک'}
              </button>
            )}
          </div>

          {showRiskAssessment ? (
            <RiskAssessmentForm 
              vendor={vendor} 
              onSave={onSave} 
              onClose={() => setShowRiskAssessment(false)} 
              currentUser={currentUser} 
            />
          ) : vendor.riskAssessment ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 md:col-span-1 ${
                vendor.riskAssessment.riskLevel === 'Low' ? 'bg-emerald-50/40 border-emerald-500/20' : 
                vendor.riskAssessment.riskLevel === 'Medium' ? 'bg-amber-50/40 border-amber-500/20' : 
                'bg-red-50/40 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  <Activity className={`w-6 h-6 shrink-0 ${
                    vendor.riskAssessment.riskLevel === 'Low' ? 'text-emerald-600' : 
                    vendor.riskAssessment.riskLevel === 'Medium' ? 'text-amber-600' : 
                    'text-red-600'
                  }`} />
                  <div className="text-right">
                    <div className="font-black text-slate-800 text-base">
                      سطح ریسک: {vendor.riskAssessment.riskLevel === 'Low' ? 'پایین' : vendor.riskAssessment.riskLevel === 'Medium' ? 'متوسط' : 'بالا'}
                    </div>
                    <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wide mt-0.5">Supplier Risk Index</div>
                  </div>
                </div>
                <div className={`text-3xl font-black font-mono shrink-0 leading-none ${
                    vendor.riskAssessment.riskLevel === 'Low' ? 'text-emerald-600' : 
                    vendor.riskAssessment.riskLevel === 'Medium' ? 'text-amber-600' : 
                    'text-red-600'
                }`}>
                  {Number(vendor.riskAssessment.sri).toFixed(1)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between px-5">
                  <span className="text-xs text-slate-505 font-semibold font-mono">Risk Score</span>
                  <span className="text-sm font-black font-mono text-slate-800">{vendor.riskAssessment.riskScore}</span>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between px-5">
                  <span className="text-xs text-slate-505 font-semibold">کلاس ریسک کلی</span>
                  <span className={`text-sm font-bold ${
                    vendor.riskAssessment.riskLevel === 'Low' ? 'text-emerald-600' :
                    vendor.riskAssessment.riskLevel === 'Medium' ? 'text-amber-600' : 'text-red-600'
                  }`}>{vendor.riskAssessment.riskLevel}</span>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 col-span-2 flex justify-between items-center px-5">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono mb-0.5">Evaluator</div>
                    <div className="text-xs font-bold text-slate-700">{vendor.riskAssessment.evaluator}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono mb-0.5">Evaluation Date</div>
                    <div className="text-xs font-bold text-slate-800 font-mono" dir="ltr">{vendor.riskAssessment.date}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              هیچ ارزیابی ریسکی برای این تامین‌کننده ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {/* 4. ثبت نتایج آزمایشگاه */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'qa') && (
        <div id="purchase-history-analysis-section" className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm text-right">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <Microscope className="w-5 h-5 text-indigo-600 animate-pulse" />
              <div>
                <h3 className="font-bold text-[#1D1D1F] text-sm">سابقه خرید و نتایج آنالیز آزمایشگاهی</h3>
                <p className="text-xs text-slate-500 mt-1">مدیریت و ثبت اطلاعات آزمایش، کدهای آزمایشگاهی (QC)، وضعیت انحراف و تصمیم نهایی (صرفاً ادمین و واحد کیفیت)</p>
              </div>
            </div>
            <button
              id="add-analysis-record-btn"
              onClick={() => {
                if (editingAnalysisId) {
                  setEditingAnalysisId(null);
                  setEditingAnalysis(null);
                }
                setShowAddAnalysisForm(!showAddAnalysisForm);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت نتیجه آزمایش جدید</span>
            </button>
          </div>

          {/* Inline Form for adding laboratory record */}
          <AnimatePresence>
            {showAddAnalysisForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-slate-50/70 border border-indigo-150/50 rounded-2xl p-5 md:p-6 space-y-6 text-right shadow-inner">
                  {/* Form Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="text-right">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-600" />
                        <span>ثبت نتیجه آزمایش جدید</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">ثبت و ممیزی نتایج آزمون‌های فیزیکوشیمیایی و میکروبیولوژی سورس</p>
                    </div>
                    <button 
                      onClick={() => setShowAddAnalysisForm(false)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                      title="بستن فرم"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {analysisSuccess ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center fade-in">
                      <div className="bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20 mb-1">
                        <CheckCircle className="w-10 h-10 text-emerald-600 bounce-in" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">سابقه آزمایش با موفقیت ثبت گردید</h3>
                      <p className="text-slate-500 text-[10px]">اطلاعات به شناسنامه کیفی این سورس افزوده شد و جدول نتایج به‌روزرسانی شد.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 font-bold text-xs">تاریخ انجام آزمایش <span className="text-red-500">*</span></label>
                          <ShamsiDatePicker
                            value={newAnalysis.date}
                            onChange={(date) => setNewAnalysis({ ...newAnalysis, date })}
                            placeholder="YYYY/MM/DD"
                          />
                        </div>

                        {/* QC Code */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 font-bold text-xs">کد آزمایشگاهی / QC Code <span className="text-red-500">*</span></label>
                          <input
                            id="new-qc-code-input"
                            type="text"
                            required
                            value={newAnalysis.qcCode}
                            onChange={e => setNewAnalysis({ ...newAnalysis, qcCode: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left"
                            placeholder="QC-1405-102"
                            dir="ltr"
                          />
                        </div>

                        {/* Final Decision */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 font-bold text-xs">نتیجه نهایی (Decision)</label>
                          <select
                            id="new-decision-select"
                            value={newAnalysis.decision}
                            onChange={e => setNewAnalysis({ ...newAnalysis, decision: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                          >
                            <option value="Pass">Pass (قبول قطعی)</option>
                            <option value="Approved Conditional">Approved Conditional (مشروط)</option>
                            <option value="Reject">Reject (مردود)</option>
                          </select>
                        </div>

                        {/* Deviation Reason */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 font-bold text-xs">وضعیت انحراف (OOS / Deviation)</label>
                          <select
                            id="new-deviation-select"
                            value={newAnalysis.deviationReason}
                            onChange={e => setNewAnalysis({ ...newAnalysis, deviationReason: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                          >
                            <option value="None">None (فاقد انحراف)</option>
                            <option value="NCR">NCR (عدم انطباق)</option>
                            <option value="Deviation">Deviation (انحراف)</option>
                            <option value="OOS">OOS (خارج از محدوده)</option>
                            <option value="CAPA">CAPA (اقدام اصلاحی)</option>
                            <option value="OOT">OOT (خارج از روند)</option>
                            <option value="Complaint">Complaint (شکایت کیفی)</option>
                            <option value="Other">Other (سایر)</option>
                          </select>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold text-xs">توضیحات تفصیلی و گزارش آنالیز آزمایشگاهی</label>
                        <textarea
                          id="new-comments-textarea"
                          value={newAnalysis.comments}
                          onChange={e => setNewAnalysis({ ...newAnalysis, comments: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all leading-relaxed"
                          placeholder="درصد خلوص، وضعیت فیزیکوشیمیایی، حلال‌های باقیمانده، اندوتوکسین، تطابق با آزمون‌های فارماکوپه USP/BP/EP و نتایج کشت میکروبیولوژی..."
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddAnalysisForm(false);
                            setNewAnalysis({ date: new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/[۰-۹]/g, c => '0123456789'[c.charCodeAt(0) - 1776]), qcCode: '', decision: 'Pass', deviationReason: 'None', comments: '' });
                          }}
                          className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all font-bold text-xs cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAnalysisSubmit}
                          disabled={!newAnalysis.qcCode || !newAnalysis.date}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>ثبت نتیجه آزمایش</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline Form for editing laboratory record */}
          <AnimatePresence>
            {editingAnalysisId && editingAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-5 md:p-6 space-y-6 text-right shadow-inner">
                  {/* Form Header */}
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <div className="text-right">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-amber-600" />
                        <span>ویرایش نتیجه آزمایش</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">اصلاح و به‌روزرسانی رکوردهای پیشین آنالیز و کنترل کیفیت سورس</p>
                    </div>
                    <button 
                      onClick={handleEditAnalysisCancel}
                      className="p-1 rounded-lg text-slate-400 hover:bg-amber-100 hover:text-slate-600 transition-colors"
                      title="انصراف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold text-xs">تاریخ انجام آزمایش <span className="text-red-500">*</span></label>
                        <ShamsiDatePicker
                          value={editingAnalysis.date}
                          onChange={(date) => setEditingAnalysis({ ...editingAnalysis, date })}
                          placeholder="YYYY/MM/DD"
                        />
                      </div>

                      {/* QC Code */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold text-xs">کد آزمایشگاهی / QC Code <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={editingAnalysis.qcCode}
                          onChange={e => setEditingAnalysis({ ...editingAnalysis, qcCode: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-left"
                          placeholder="QC-1405-102"
                          dir="ltr"
                        />
                      </div>

                      {/* Final Decision */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold text-xs">نتیجه نهایی (Decision)</label>
                        <select
                          value={editingAnalysis.decision}
                          onChange={e => setEditingAnalysis({ ...editingAnalysis, decision: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                        >
                          <option value="Pass">Pass (قبول قطعی)</option>
                          <option value="Approved Conditional">Approved Conditional (مشروط)</option>
                          <option value="Reject">Reject (مردود)</option>
                        </select>
                      </div>

                      {/* Deviation Reason */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-bold text-xs">وضعیت انحراف (OOS / Deviation)</label>
                        <select
                          value={editingAnalysis.deviationReason}
                          onChange={e => setEditingAnalysis({ ...editingAnalysis, deviationReason: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                        >
                          <option value="None">None (فاقد انحراف)</option>
                          <option value="NCR">NCR (عدم انطباق)</option>
                          <option value="Deviation">Deviation (انحراف)</option>
                          <option value="OOS">OOS (خارج از محدوده)</option>
                          <option value="CAPA">CAPA (اقدام اصلاحی)</option>
                          <option value="OOT">OOT (خارج از روند)</option>
                          <option value="Complaint">Complaint (شکایت کیفی)</option>
                          <option value="Other">Other (سایر)</option>
                        </select>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 font-bold text-xs">توضیحات تفصیلی و گزارش آنالیز آزمایشگاهی</label>
                      <textarea
                        value={editingAnalysis.comments}
                        onChange={e => setEditingAnalysis({ ...editingAnalysis, comments: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all leading-relaxed"
                        placeholder="درصد خلوص، وضعیت فیزیکوشیمیایی، حلال‌های باقیمانده، اندوتوکسین، تطابق با آزمون‌های فارماکوپه USP/BP/EP و نتایج کشت میکروبیولوژی..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleEditAnalysisCancel}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all font-bold text-xs cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditAnalysisSave(editingAnalysisId!)}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>ذخیره تغییرات</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lab Records List / Table */}
          {vendor.analysisRecords && vendor.analysisRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-xs bg-white">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5F5F7] text-[#1D1D1F] border-b border-slate-200/60 font-semibold text-slate-700">
                    <th className="py-2.5 px-3 font-bold text-center w-12">ردیف</th>
                    <th className="py-2.5 px-3">تاریخ آزمایش</th>
                    <th className="py-2.5 px-3">کد آزمایشگاهی (QC Code)</th>
                    <th className="py-2.5 px-3">تصمیم نهایی (Decision)</th>
                    <th className="py-2.5 px-3">وضعیت انحراف</th>
                    <th className="py-2.5 px-3 max-w-sm">گزارش و توضیحات آزمایش</th>
                    <th className="py-2.5 px-3">کاربر ثبت‌کننده</th>
                    <th className="py-2.5 px-3 text-center w-36">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...vendor.analysisRecords].reverse().map((record, index) => {
                    const rowNumber = vendor.analysisRecords!.length - index;
                    const isDeletingThis = confirmDeleteAnalysisId === record.id;

                    return (
                      <tr key={record.id || index} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-semibold">{rowNumber}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-slate-500" dir="ltr">{record.date}</div>
                        </td>
                        
                        {/* QC Code */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 font-mono tracking-wide" dir="ltr">{record.qcCode}</span>
                        </td>

                        {/* Decision */}
                        <td className="py-3 px-3 font-mono">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            record.decision === 'Pass' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            record.decision === 'Approved Conditional' ? 'bg-indigo-50 text-[#3b82f6] border border-blue-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${record.decision === 'Pass' ? 'bg-emerald-500 animate-pulse' : record.decision === 'Approved Conditional' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                            <span>{record.decision === 'Pass' ? 'قبول (Pass)' : record.decision === 'Approved Conditional' ? 'قبول مشروط' : 'مردود (Reject)'}</span>
                          </span>
                        </td>

                        {/* Deviation */}
                        <td className="py-3 px-3 font-mono">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                            record.deviationReason === 'None' ? 'bg-slate-100 text-slate-600' :
                            record.deviationReason === 'NCR' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            record.deviationReason === 'Deviation' ? 'bg-amber-100 text-amber-800 border border-amber-250' :
                            record.deviationReason === 'OOS' ? 'bg-red-100 text-red-700 border border-red-300' :
                            record.deviationReason === 'CAPA' ? 'bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/20' :
                            record.deviationReason === 'OOT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {record.deviationReason}
                          </span>
                        </td>

                        {/* Comments */}
                        <td className="py-3 px-3 max-w-sm">
                          <span className="text-slate-600 leading-relaxed font-light">{record.comments || 'فاقد توضیحات تکمیلی'}</span>
                        </td>

                        {/* RecordedBy */}
                        <td className="py-3 px-3 text-slate-500 font-semibold">
                          {record.recordedBy}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          {isDeletingThis ? (
                            <div className="flex items-center justify-center gap-1.5" dir="ltr">
                              <button
                                onClick={() => handleDeleteAnalysis(record.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer"
                                title="تایید حذف"
                              >
                                حذف قطعی
                              </button>
                              <button
                                onClick={() => setConfirmDeleteAnalysisId(null)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded transition-all cursor-pointer"
                                title="لغو"
                              >
                                لغو
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1" dir="ltr">
                              <button
                                onClick={() => {
                                  if (showAddAnalysisForm) {
                                    setShowAddAnalysisForm(false);
                                  }
                                  handleEditAnalysisStart(record);
                                }}
                                className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                title="ویرایش"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteAnalysisId(record.id)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
              هیچ سابقه خرید یا نتیجه آنالیز آزمایشگاهی برای این سورس ثبت نشده است.
            </div>
          )}
        </div>
      )}

      </div>
  );
}

// --- View: Risk Assessment Form ---
export function RiskAssessmentForm({ vendor, onSave, onClose, currentUser }: { vendor: Vendor, onSave: (v: Vendor, msg?: string | null) => void, onClose: () => void, currentUser: User | null }) {
  const spsScore = calculateOverallScore(vendor.scores, true) || 0;
  
  // Calculate recommended probability based on SPS via the isolated FmeaService
  const recommendedProb = FmeaService.getRecommendedProbability(spsScore);

  const [criticality, setCriticality] = useState<number>(vendor.riskAssessment?.materialCriticality || 5);
  const [detectability, setDetectability] = useState<number>(vendor.riskAssessment?.detectability || 1);
  const [probability, setProbability] = useState<number>(vendor.riskAssessment?.probability || recommendedProb);
  const [isSuccess, setIsSuccess] = useState(false);

  // Call the isolated FmeaService to run the full FMEA mathematical assessment
  const { riskScore, sri, riskLevel } = FmeaService.performAssessment(criticality, detectability, probability, spsScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'qa' && currentUser?.role !== 'lab' && currentUser?.role !== 'admin') {
      alert('شما دسترسی ثبت ارزیابی ریسک را ندارید.');
      return;
    }

    const assessment: RiskAssessmentData = {
      materialCriticality: criticality,
      detectability: detectability,
      probability: probability,
      sps: spsScore,
      riskScore,
      sri: sri,
      riskLevel,
      date: new Date().toLocaleDateString('fa-IR'),
      evaluator: currentUser?.name || 'کاربر سیستم'
    };

    const newLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 8),
      action: `ثبت ارزیابی ریسک برای "${vendor.material}" (${vendor.name}) - سطح ریسک: ${riskLevel === 'High' ? 'بالا (High)' : riskLevel === 'Medium' ? 'متوسط (Medium)' : riskLevel === 'Low' ? 'پایین (Low)' : 'نامشخص'}، امتیاز نهایی: ${riskScore}، شاخص SRI: ${sri || 'N/A'}`,
      date: new Date().toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }),
      user: currentUser?.name || 'کاربر سیستم'
    };

    onSave({
      ...vendor,
      riskAssessment: assessment,
      activityLogs: [...(vendor.activityLogs || []), newLog]
    }, null);
    
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-16 text-center flex flex-col items-center justify-center mb-8 shadow-[0_0_20px_rgba(16,185,129,0.1)] fade-in" dir="rtl">
        <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 mb-6">
          <CheckCircle className="w-16 h-16 text-emerald-400 bounce-in" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">ارزیابی ریسک با موفقیت ثبت شد</h3>
        <p className="text-slate-400 font-medium">نتایج ارزیابی ریسک و محاسبات شاخص SRI با موفقیت ثبت گردید. در حال بازگشت...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 mb-8 shadow-[0_0_20px_rgba(245,158,11,0.1)] fade-in">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" />
          ارزیابی ریسک تامین کنندگان (Supplier Risk Assessment)
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Material Criticality */}
          <div className="space-y-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <label className="block text-sm font-medium text-slate-300">۱. اهمیت ماده (Material Criticality)</label>
            <select value={criticality} onChange={e => setCriticality(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500">
              <option value={5}>ماده موثره - امتیاز ۵</option>
              <option value={4}>اکسپیانت - امتیاز ۴</option>
              <option value={3}>حدواسط شیمیایی، حلال ها و واکنشگرها - امتیاز ۳</option>
              <option value={2}>اقلام بسته بندی اولیه - امتیاز ۲</option>
              <option value={1}>اقلام بسته بندی ثانویه - امتیاز ۱</option>
            </select>
          </div>

          {/* Probability of Failure */}
          <div className="space-y-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <label className="block text-sm font-medium text-slate-300">۲. احتمال خرابی (Probability of failure)</label>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>SPS فعلی: <strong className="text-amber-400 text-sm">{spsScore > 0 ? spsScore : 'تعیین نشده'}</strong></span>
            </div>
            <select value={probability} onChange={e => setProbability(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500">
              <option value={1}>عدم خرابی (SPS: 80-100) - امتیاز ۱</option>
              <option value={2}>احتمال کم (SPS: 60-79) - امتیاز ۲</option>
              <option value={3}>احتمال متوسط (SPS: 40-59) - امتیاز ۳</option>
              <option value={4}>احتمال زیاد (SPS: 25-39) - امتیاز ۴</option>
              <option value={5}>به شدت محتمل (SPS: 1-24) - امتیاز ۵</option>
            </select>
          </div>

          {/* Detectability */}
          <div className="space-y-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">۳. تشخیص (Detectability)</label>
            <select value={detectability} onChange={e => setDetectability(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500">
              <option value={1}>تمام مشکلات توسط QC قابل تشخیص - امتیاز ۱</option>
              <option value={2}>اکثر مشکلات قابل تشخیص - امتیاز ۲</option>
              <option value={3}>بخشی قابل تشخیص - امتیاز ۳</option>
              <option value={4}>تشخیص دشوار - امتیاز ۴</option>
              <option value={5}>تقریبا غیر قابل تشخیص - امتیاز ۵</option>
            </select>
          </div>
        </div>

        {/* Info / Formulas */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300">
          <div className="font-bold text-slate-200 mb-2 border-b border-slate-700/50 pb-2">نحوه محاسبه شاخص‌ها:</div>
          <div className="space-y-2 font-mono text-xs md:text-sm" dir="ltr">
            <div className="flex gap-2">
               <span className="text-amber-400 font-bold shrink-0">RPN (Risk Score) =</span>
               <span className="text-slate-400 break-all">Material Criticality × Probability of failure × Detectability</span>
            </div>
            <div className="flex gap-2">
               <span className="text-amber-400 font-bold shrink-0">SRI (Supplier Risk Index) =</span>
               <span className="text-slate-400 break-all">(0.6 × RPN) + (0.4 × (100 - SPS Score))</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-900 p-5 rounded-xl border border-amber-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Risk Score</div>
              <div className="text-xl font-bold tabular-nums text-white">{riskScore}</div>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Supplier Risk Index (SRI)</div>
              <div className="text-xl font-bold tabular-nums text-white">{sri.toFixed(1)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">سطح ریسک (Risk Level)</div>
              <div className={`text-xl font-bold ${riskLevel === 'Low' ? 'text-emerald-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-500'}`}>
                {riskLevel === 'Low' ? 'پایین (Low)' : riskLevel === 'Medium' ? 'متوسط (Medium)' : 'بالا (High)'}
              </div>
            </div>
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              ثبت نتیجه ارزیابی ریسک
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// --- View: Evaluation Form Layout & Helpers ---
export const FORM_LAYOUT = [
  {
    id: 'commercial', title: 'بازرگانی', icon: Handshake,
    criteria: [
      { key: 'delivery', label: 'تحویل به موقع', weight: 40 },
      { key: 'responsiveness', label: 'پاسخگویی و جبران خسارت', weight: 30 },
      { key: 'history', label: 'سابقه همکاری و تعداد دفعات خرید', weight: 30 }
    ]
  },
  {
    id: 'qa', title: 'کیفیت', icon: Microscope,
    criteria: [
      { key: 'quality', label: 'کیفیت و تطابق با مشخصات', weight: 35 },
      { key: 'consistency', label: 'تداوم کیفیت', weight: 25 },
      { key: 'ncr', label: 'نداشتن OOS, NCR و Deviation', weight: 25 },
      { key: 'documents', label: 'ارائه مستندات درخواستی', weight: 15 }
    ]
  },
  {
    id: 'planning', title: 'برنامه‌ریزی و انبار', icon: Warehouse,
    criteria: [
      { key: 'efficiency', label: 'راندمان', weight: 60 },
      { key: 'conformance', label: 'تطابق کالا با مشخصات فنی درج شده در پکینگ لیست', weight: 40 }
    ]
  },
  {
    id: 'finance', title: 'مالی', icon: Coins,
    criteria: [
      { key: 'price', label: 'قیمت', weight: 60 },
      { key: 'payment', label: 'نوع پرداخت', weight: 40 }
    ]
  }
];

export function calculateDeptAverage(deptId: string, deptScores: Record<string, number>) {
  const layout = FORM_LAYOUT.find(l => l.id === deptId);
  if (!layout) return 0;
  
  let total = 0;
  layout.criteria.forEach(crit => {
     const weight = crit.weight || 0;
     const score = deptScores[crit.key] || 0;
     total += (score / 5) * weight;
  });
  return Math.round(total);
}

export function getRawScoreValue(vendor: Vendor, deptId: string, critKey: string): number {
  if (!vendor) return 5;
  let raw = vendor.rawScores;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }
  if (raw && (raw as any)[deptId] && (raw as any)[deptId][critKey] !== undefined) {
    return Number((raw as any)[deptId][critKey]);
  }
  
  if (vendor.scores && (vendor.scores as any)[deptId] > 0) {
    const rawVal = Number((vendor.scores as any)[deptId]);
    const deconstructed = deconstructScores(deptId, rawVal);
    if (deconstructed && deconstructed[critKey] !== undefined) {
      return deconstructed[critKey];
    }
    return Math.max(1, Math.min(5, Math.round(rawVal / 20)));
  }
  return 5;
}

export function deconstructScores(deptId: string, targetScore: number): Record<string, number> {
  const layout = FORM_LAYOUT.find(l => l.id === deptId);
  if (!layout) return {};
  
  const criteria = layout.criteria;
  const numCrit = criteria.length;
  
  let bestCombination: number[] = [];
  let bestDiff = Infinity;
  
  const search = (index: number, current: number[]) => {
    if (index === numCrit) {
      let total = 0;
      criteria.forEach((crit, idx) => {
        total += (current[idx] / 5) * crit.weight;
      });
      const calcVal = Math.round(total);
      const diff = Math.abs(calcVal - targetScore);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestCombination = [...current];
      }
      return;
    }
    for (let val = 1; val <= 5; val++) {
      search(index + 1, [...current, val]);
    }
  };
  
  search(0, []);
  
  const result: Record<string, number> = {};
  criteria.forEach((crit, idx) => {
    result[crit.key] = bestCombination[idx] !== undefined ? bestCombination[idx] : 1;
  });
  return result;
}

// --- View: Evaluation Form ---
export function EvaluationForm({ vendor, onSave, onClose, currentUser }: { vendor: Vendor, onSave: (v: Vendor, msg?: string | null) => void, onClose: () => void, currentUser: User | null }) {
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(() => {
    const initialDepts = ['commercial', 'qa', 'planning', 'finance'];
    const res: Record<string, Record<string, number>> = {};
    initialDepts.forEach(dept => {
      res[dept] = {};
      const layout = FORM_LAYOUT.find(l => l.id === dept);
      if (layout) {
        layout.criteria.forEach(crit => {
          res[dept][crit.key] = getRawScoreValue(vendor, dept, crit.key);
        });
      }
    });
    return res;
  });

  useEffect(() => {
    const initialDepts = ['commercial', 'qa', 'planning', 'finance'];
    const res: Record<string, Record<string, number>> = {};
    initialDepts.forEach(dept => {
      res[dept] = {};
      const layout = FORM_LAYOUT.find(l => l.id === dept);
      if (layout) {
        layout.criteria.forEach(crit => {
          res[dept][crit.key] = getRawScoreValue(vendor, dept, crit.key);
        });
      }
    });
    setScores(res);
  }, [vendor.id, vendor.scores, vendor.rawScores]);

  const [modifiedDepts, setModifiedDepts] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const visibleFormLayout = currentUser?.role === 'admin' 
    ? FORM_LAYOUT 
    : FORM_LAYOUT.filter(d => d.id === currentUser?.role);

  const handleSlider = (deptId: string, critKey: string, val: string) => {
    setScores(prev => ({
      ...prev,
      [deptId]: { ...prev[deptId], [critKey]: parseInt(val, 10) }
    }));
    setModifiedDepts(prev => ({
      ...prev,
      [deptId]: true
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      const prevScores = vendor.scores || { commercial: 0, qa: 0, planning: 0, finance: 0 };
      const submittedScores = {
        commercial: calculateDeptAverage('commercial', scores.commercial),
        qa: calculateDeptAverage('qa', scores.qa),
        planning: calculateDeptAverage('planning', scores.planning),
        finance: calculateDeptAverage('finance', scores.finance)
      };

      const effectiveModifiedDepts = { ...modifiedDepts };
      visibleFormLayout.forEach(dept => {
        effectiveModifiedDepts[dept.id] = true;
      });

      const finalScores = {
        commercial: effectiveModifiedDepts.commercial ? submittedScores.commercial : (prevScores.commercial || 0),
        qa: effectiveModifiedDepts.qa ? submittedScores.qa : (prevScores.qa || 0),
        planning: effectiveModifiedDepts.planning ? submittedScores.planning : (prevScores.planning || 0),
        finance: effectiveModifiedDepts.finance ? submittedScores.finance : (prevScores.finance || 0)
      };

      const finalRawScores = {
        commercial: effectiveModifiedDepts.commercial ? scores.commercial : vendor.rawScores?.commercial,
        qa: effectiveModifiedDepts.qa ? scores.qa : vendor.rawScores?.qa,
        planning: effectiveModifiedDepts.planning ? scores.planning : vendor.rawScores?.planning,
        finance: effectiveModifiedDepts.finance ? scores.finance : vendor.rawScores?.finance
      };

      const isFullyScored = finalScores.commercial > 0 && finalScores.qa > 0 && finalScores.planning > 0 && finalScores.finance > 0;
      
      let grade = vendor.grade;
      let pStatus = vendor.status;
      let pCategory = vendor.category;

      if (isFullyScored) {
        const overall = calculateOverallScore(finalScores);
        if (overall! >= 80) {
          grade = 'A';
          pStatus = 'approved';
        } else if (overall! >= 60) {
          grade = 'B';
          pStatus = 'approved';
        } else if (overall! >= 40) {
          grade = 'C';
          pStatus = 'conditional';
        } else {
          grade = 'rejected';
          pStatus = 'rejected';
        }
      }

      const statusMapList = { approved: 'تایید شده', conditional: 'تایید مشروط', rejected: 'مردود', new: 'جدید' };
      const newLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 8),
        action: `ثبت ارزیابی نهایی سورس "${vendor.material}" (${vendor.name}) - گرید نهایی: [Grade ${grade}]، وضعیت جدید: [${statusMapList[pStatus] || pStatus}] (امتیازات: آزمایشگاهی: ${finalScores.qa || 0}، بازرگانی: ${finalScores.commercial || 0}، برنامه‌ریزی: ${finalScores.planning || 0}، مالی: ${finalScores.finance || 0})`,
        date: new Date().toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }),
        user: currentUser?.name || 'کاربر سیستم'
      };

      onSave({
        ...vendor,
        status: pStatus,
        grade: grade,
        category: pCategory,
        scores: finalScores,
        rawScores: finalRawScores,
        lastAudit: isFullyScored ? new Date().toLocaleDateString('fa-IR') : vendor.lastAudit,
        activityLogs: [...(vendor.activityLogs || []), newLog]
      }, null);

      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 600);
  };

  if (isSuccess) {
    return (
      <div className="bg-white border border-emerald-500/20 rounded-xl p-16 text-center shadow-sm flex flex-col items-center justify-center fade-in">
        <div className="bg-emerald-50/10 p-4 rounded-full border border-emerald-500/20 mb-6">
          <CheckCircle className="w-16 h-16 text-emerald-500 bounce-in" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">ارزیابی با موفقیت ثبت شد</h3>
        <p className="text-slate-500 font-medium">اطلاعات امتیازدهی و نتایج ارزیابی با موفقیت ثبت گردید. در حال بازگشت...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScoringGuide currentUser={currentUser} />

      <div className="bg-white border border-slate-900/10 rounded-xl p-6 md:p-8 fade-in shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {visibleFormLayout.map(dept => {
             const Icon = dept.icon;
             const isModified = modifiedDepts[dept.id] || false;
             const prevDeptScore = vendor.scores?.[dept.id as keyof Scores] || 0;
             const avg = isModified ? calculateDeptAverage(dept.id, scores[dept.id]) : prevDeptScore;

             return (
               <div key={dept.id} className="bg-slate-50 border border-slate-900/10 rounded-xl p-5 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-full h-[3px] opacity-80 ${getScoreColorClass(avg, true)}`} />
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                       <div className="bg-white p-2 rounded-lg border border-slate-900/10 shadow-sm">
                         <Icon className="w-5 h-5 text-slate-500" />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 leading-none">{dept.title}</h4>
                         <span className="text-[10px] text-slate-400 font-medium block mt-1">
                           <span className="text-slate-400">ارزیابی ثبت شده</span>
                         </span>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-[10px] text-slate-400 font-semibold mb-0.5">میانگین بخش</div>
                       <div className={`text-2xl font-black font-mono tracking-tighter ${getScoreColorClass(avg)}`}>
                         {avg}
                       </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                    {dept.criteria.map(crit => {
                      const prevValue = vendor.rawScores?.[dept.id]?.[crit.key] ?? 
                                        (vendor.scores && (vendor.scores as any)[dept.id] > 0 
                                          ? Math.round((vendor.scores as any)[dept.id] / 20) 
                                          : 0);
                      const isChanged = scores[dept.id][crit.key] !== prevValue;

                      return (
                        <div key={crit.key} className="bg-white border border-slate-100 rounded-lg p-3 space-y-2 shadow-xs">
                          <div className="flex justify-between items-start text-xs">
                            <span className="text-slate-700 font-medium leading-relaxed max-w-[70%]">{crit.label} <span className="text-cyan-600 font-semibold ml-1">(وزن: {crit.weight})</span></span>
                            <div className="flex items-center gap-1.5 shrink-0 select-none">
                              {prevValue > 0 && (
                                <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 font-medium">
                                  قبلی: {prevValue}
                                </span>
                              )}
                              <span className={`text-[11px] px-1.5 py-0.5 rounded border font-mono font-bold ${
                                isChanged 
                                  ? 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse' 
                                  : 'text-slate-600 bg-slate-50 border-slate-200'
                              }`}>
                                {scores[dept.id][crit.key]} / 5
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" dir="ltr"
                              min="1" max="5" step="1"
                              value={scores[dept.id][crit.key]}
                              onChange={(e) => handleSlider(dept.id, crit.key, e.target.value)}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
             )
          })}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات و توجیه ارزیابی</label>
          <textarea 
            dir="rtl"
            rows={4}
            className="w-full bg-white border border-slate-900/10 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none shadow-sm transition-shadow"
            placeholder="موارد کیفی مهم، تعهدات اخذ شده جهت بهبود، یا دلایل اعطای نمرات پایین..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          ></textarea>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-end gap-6 border-t border-slate-900/10 pt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full md:w-auto flex flex-row-reverse items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-75"
          >
            {isSaving ? (
              <span className="inline-block w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            ) : (
              <Archive className="w-5 h-5" />
            )}
             <span>ذخیره ارزیابی</span>
          </button>
        </div>
      </div>
    </div>
  );
}
