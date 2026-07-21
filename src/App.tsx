import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Home, Factory, Globe, Package, Archive, AlertTriangle, FileText,
  Activity, ChevronLeft, ChevronRight, Search, Menu, X, Shield, Info, Briefcase, 
  Microscope, Building, CheckCircle, AlertCircle, DollarSign, Plus, Pencil, User as UserIcon,
  Pill, Handshake, Warehouse, Boxes, Coins, PawPrint, ClipboardCheck, Hash, Trash2, ShieldAlert, Printer,
  RotateCcw, Download, ChevronDown, ChevronUp, Database, Award, Layers, Save
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

import { INITIAL_VENDORS_DB } from './db_foreign_only';
import { Category, Status, Grade, Scores, Vendor, User, Role, RiskAssessmentData, AnalysisRecord } from './types';
import { Material } from './components/MaterialForm';
import { MaterialMasterView } from './components/MaterialMasterView';
import { AuditActivityCenter } from './components/AuditActivityCenter';
import { exportCategoryToExcel } from './utils/excelExport';
import { StickyRecordHeader } from './components/StickyRecordHeader';
// @ts-ignore
import temadLogo from './assets/logo.png';

// --- Utilities & Reusable Components ---

const categoryLabels = {
  foreign: { fa: 'خرید خارجی', en: 'Foreign Purchase', icon: Globe },
  domestic: { fa: 'خرید داخلی', en: 'Domestic Purchase', icon: Factory },
  veterinary: { fa: 'دامی', en: 'Veterinary', icon: PawPrint },
  packaging: { fa: 'اقلام بسته‌بندی', en: 'Packaging Items', icon: Package },
  sample: { fa: 'نمونه‌', en: 'Sample', icon: ClipboardCheck },
  blacklist: { fa: 'لیست سیاه', en: 'Black List', icon: AlertTriangle }
};

import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { GradeBadge } from './components/GradeBadge';
import { MaterialRoleBadge, getRoleBadgeDetails } from './components/MaterialRoleBadge';
import { ScoreBar, getScoreColorClass, getSRIColorClass, getScoreColorConfig } from './components/ScoreBar';
import { extractCountry, getDisplayCountry, calculateOverallScore, setCalculationWeights, CALCULATION_WEIGHTS } from './utils/vendorUtils';
import { FmeaService } from './utils/fmeaService';
import { ScoringGuide, ScoreCard } from './components/ScoringGuide';
import { PrintableSampleForm, PrintableEvaluationForm } from './components/PrintableForms';
import { ShamsiDatePicker } from './components/ShamsiDatePicker';

// --- Views (Modularized) ---
import { HomeView } from './components/views/HomeView';
import { CategoryView } from './components/views/CategoryView';
import { ArchiveView } from './components/views/ArchiveView';
import { SupplierAuditView } from './components/views/SupplierAuditView';
import { VendorDetail } from './components/views/VendorDetail';
import { VendorForm } from './components/views/VendorForm';

// --- Main App Component ---

const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('app_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers }).then(res => {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('app_jwt_token');
      localStorage.removeItem('app_currentUser');
      localStorage.removeItem('app_viewHistory');
      window.location.reload();
      throw new Error("Session has expired. Please log in again.");
    }
    return res;
  });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('app_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [systemTime, setSystemTime] = useState(() => {
    const d = new Date();
    return {
      faDate: d.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/،/g, ''),
      time: d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setSystemTime({
        faDate: d.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/،/g, ''),
        time: d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const normalizeAndCleanVendor = (v: any): Vendor => {
    if (v.isSample) {
      if (v.status === 'rejected') {
        return { ...v, grade: 'rejected' };
      }
      return v;
    }

    const isInitialVendor = typeof v.id === 'string' && v.id.startsWith('vF');
    const hasBeenEvaluatedByUser = (v.rawScores && Object.keys(v.rawScores).length > 0) || (v.scores && (v.scores.commercial > 0 || v.scores.qa > 0));

    if (isInitialVendor && !hasBeenEvaluatedByUser && !v.scores) {
      const isRejected = v.status === 'rejected' || v.category === 'blacklist' || v.grade === 'rejected';
      v.scores = null;
      v.rawScores = null;
      v.status = isRejected ? 'rejected' : 'new';
      v.grade = isRejected ? 'rejected' : 'new';
    }

    if (v.scores && v.scores.qc !== undefined) {
       v.scores.planning = v.scores.qc;
       delete v.scores.qc;
    }
    if (v.status === 'rejected' || v.grade === 'rejected') {
       return { ...v, status: 'rejected', grade: 'rejected' };
    }
    const isFullyScored = v.scores && v.scores.commercial > 0 && v.scores.qa > 0 && v.scores.planning > 0 && v.scores.finance > 0;
    if (isFullyScored) {
       const rounded = calculateOverallScore(v.scores, true) || 0;
       let calcGrade: Grade = v.grade;
       let calcStatus: Status = v.status;
       if (rounded >= 80) {
          calcGrade = 'A';
          calcStatus = 'approved';
       } else if (rounded >= 60) {
          calcGrade = 'B';
          calcStatus = 'approved';
       } else if (rounded >= 40) {
          calcGrade = 'C';
          calcStatus = 'conditional';
       } else {
          calcGrade = 'rejected';
          calcStatus = 'rejected';
       }
       return { ...v, grade: calcGrade, status: calcStatus };
    }
    return v;
  };

  const [db, setDb] = useState<Vendor[]>(() => {
    const isAllowedVendor = (v: any) => {
      if (!v || !v.id) return false;
      if (typeof v.id === 'string' && v.id.startsWith('vF')) {
        const numPart = parseInt(v.id.substring(2), 10);
        if (!isNaN(numPart) && numPart > 128) return false;
      }
      return true;
    };
    const CLEANED_VENDORS_DB = INITIAL_VENDORS_DB.filter(isAllowedVendor).map(normalizeAndCleanVendor);
    try {
      const saved = localStorage.getItem('app_db');
      if (saved) {
        let parsed = JSON.parse(saved);
        parsed = parsed.filter(isAllowedVendor).map(normalizeAndCleanVendor);
        
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      }
      return CLEANED_VENDORS_DB;
    } catch {
      return CLEANED_VENDORS_DB;
    }
  });

  const [materials, setMaterials] = useState<Material[]>([]);

  const handleSaveMaterial = async (m: Material) => {
    const res = await authFetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'خطا در ذخیره‌سازی ماده اولیه');
    }
    const data = await res.json();
    setMaterials(prev => {
      const idx = prev.findIndex(x => x.id === m.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = data.material || m;
        return updated;
      }
      return [...prev, data.material || m];
    });
  };

  const handleDeleteMaterial = async (id: string): Promise<boolean> => {
    const res = await authFetch(`/api/materials/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      return false;
    }
    setMaterials(prev => prev.filter(x => x.id !== id));
    return true;
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_currentUser');
      localStorage.removeItem('app_viewHistory');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('app_db', JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    const isAllowedVendor = (v: any) => {
      if (!v || !v.id) return false;
      if (typeof v.id === 'string' && v.id.startsWith('vF')) {
        const numPart = parseInt(v.id.substring(2), 10);
        if (!isNaN(numPart) && numPart > 128) return false;
      }
      return true;
    };

    // First fetch server calculation weights config dynamically to achieve high regulatory resilience
    authFetch('/api/config/evaluation')
      .then(res => res.json())
      .then(config => {
        if (config && config.weights) {
          setCalculationWeights(config.weights);
          console.log("[DynamicRules] Loaded evaluation weights from backend config server:", config.weights);
        }
      })
      .catch(err => console.error("Error fetching dynamic configuration weights:", err))
      .finally(() => {
        authFetch('/api/vendors')
          .then(res => {
            if (!res.ok) throw new Error('API response failed');
            return res.json();
          })
          .then((data: Vendor[]) => {
            if (Array.isArray(data)) {
              const filtered = data.filter(isAllowedVendor).map(normalizeAndCleanVendor);
              setDb(filtered);
            }
          })
          .catch(err => {
            console.error("Failed to load vendors from Cloud SQL. Falling back to local storage.", err);
          });

        authFetch('/api/materials')
          .then(res => {
            if (!res.ok) throw new Error('API response failed');
            return res.json();
          })
          .then((data: Material[]) => {
            if (Array.isArray(data)) {
              setMaterials(data);
            }
          })
          .catch(err => {
            console.error("Failed to load materials.", err);
          });
      });
  }, []);

  type ViewState = {
    view: 'home' | 'category' | 'archive' | 'supplier-audit' | 'material-master' | 'audit-center';
    categoryId: Category | null;
    selectedVendor: Vendor | null;
  };

  const [viewHistory, setViewHistory] = useState<ViewState[]>(() => {
    try {
      const saved = localStorage.getItem('app_viewHistory');
      return saved ? JSON.parse(saved) : [{ view: 'home', categoryId: null, selectedVendor: null }];
    } catch {
      return [{ view: 'home', categoryId: null, selectedVendor: null }];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_viewHistory', JSON.stringify(viewHistory));
    } catch (err) {
      console.error("Failed to save view history to localStorage:", err);
    }
  }, [viewHistory]);

  const currentViewState = viewHistory[viewHistory.length - 1] || { view: 'home', categoryId: null, selectedVendor: null };
  const view = currentViewState.view;
  const categoryId = currentViewState.categoryId;
  const selectedVendor = currentViewState.selectedVendor
    ? (db.find(v => v.id === currentViewState.selectedVendor!.id) || currentViewState.selectedVendor)
    : null;

  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  if (currentUser && currentUser.mustChangePassword) {
    return (
      <ChangePasswordModal
        currentUser={currentUser}
        isForceChange={true}
        onPasswordChanged={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
        onLogout={() => {
          localStorage.removeItem('app_jwt_token');
          localStorage.removeItem('app_currentUser');
          localStorage.removeItem('app_viewHistory');
          setCurrentUser(null);
        }}
      />
    );
  }

  const navigate = (newView: 'home' | 'category' | 'archive' | 'supplier-audit' | 'material-master' | 'audit-center', newCat: Category | null = null) => {
    setExpandedMaterial(null);
    setViewHistory(prev => {
      if (newView === 'home') {
        return [{ view: 'home', categoryId: null, selectedVendor: null }];
      }
      const last = prev[prev.length - 1];
      if (last && last.view === newView && last.categoryId === newCat && last.selectedVendor === null) {
        return prev;
      }
      return [...prev, { view: newView, categoryId: newCat, selectedVendor: null }];
    });
    setSidebarOpen(false);
  };

  const handleSelectVendor = (vendor: Vendor | null) => {
    if (vendor) {
      if (vendor.materialEn) {
        setExpandedMaterial(vendor.materialEn);
      }
      setViewHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last.selectedVendor?.id === vendor.id) {
          return prev;
        }
        return [...prev, { ...last, selectedVendor: vendor }];
      });
    } else {
      setViewHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }
  };

  const goBack = () => {
    setViewHistory(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  const getViewStateLabel = (state: ViewState) => {
    if (state.selectedVendor) {
      return state.selectedVendor.name || 'جزییات سورس';
    }
    if (state.view === 'home') return 'صفحه اصلی';
    if (state.view === 'archive') return 'آرشیو کامل';
    if (state.view === 'supplier-audit') return 'بررسی یکپارچه تامین‌کننده';
    if (state.view === 'audit-center') return 'Audit & Activity Center';
    if (state.view === 'material-master') return 'بانک مواد اولیه (Material Master)';
    if (state.view === 'category' && state.categoryId) {
      return categoryLabels[state.categoryId]?.fa || 'دسته‌بندی';
    }
    return '';
  };

  const updateCurrentVendorInHistory = (vendor: Vendor | null) => {
    setViewHistory(prev => {
      const newHistory = [...prev];
      if (newHistory.length > 0) {
        newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], selectedVendor: vendor };
      }
      return newHistory;
    });
  };

  const handleDownloadBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
      downloadAnchor.setAttribute("download", `vendor-scores-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setToastMsg('بانک اطلاعاتی لوکال با موفقیت دانلود شد!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error("Failed to download backup JSON:", err);
      setToastMsg('خطا در پشتیبان‌گیری از اطلاعات.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleUpdateVendor = (updatedVendor: Vendor, msg?: string | null) => {
    const normalized = normalizeAndCleanVendor(updatedVendor);
    const original = db.find(v => v.id === normalized.id);

    setDb(db.map(v => v.id === normalized.id ? normalized : v));
    updateCurrentVendorInHistory(normalized);
    if (msg !== null) {
      setToastMsg(msg || 'تغییرات با موفقیت ذخیره شد!');
      setTimeout(() => setToastMsg(null), 3000);
    }

    if (!original) {
      // Fallback to traditional monolithic POST if there is no previous record found to diff safely
      authFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized)
      }).catch(err => {
        console.error("Failed to sync updated vendor to DB:", err);
      });
      return;
    }

    // Determine fine-grained delta adjustments for API Splitting
    const contactChanged = original.contactInfo !== normalized.contactInfo || original.lastAudit !== normalized.lastAudit;
    const scoresChanged = JSON.stringify(original.scores) !== JSON.stringify(normalized.scores) || 
                          JSON.stringify(original.rawScores) !== JSON.stringify(normalized.rawScores) || 
                          JSON.stringify(original.rejectionReasons) !== JSON.stringify(normalized.rejectionReasons);
    const logsChanged = JSON.stringify(original.activityLogs) !== JSON.stringify(normalized.activityLogs);
    const analysisChanged = JSON.stringify(original.analysisRecords) !== JSON.stringify(normalized.analysisRecords);
    const riskChanged = JSON.stringify(original.riskAssessment) !== JSON.stringify(normalized.riskAssessment);
    
    const profileChanged = original.material !== normalized.material ||
                           original.materialEn !== normalized.materialEn ||
                           original.cas !== normalized.cas ||
                           original.irc !== normalized.irc ||
                           original.name !== normalized.name ||
                           original.nameEn !== normalized.nameEn ||
                           original.country !== normalized.country ||
                           original.grade !== normalized.grade ||
                           original.status !== normalized.status ||
                           original.isSample !== normalized.isSample;

    // Dispatch precision requests based on modified data blocks
    if (profileChanged) {
      authFetch(`/api/vendors/${normalized.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: normalized.material,
          materialEn: normalized.materialEn,
          cas: normalized.cas,
          irc: normalized.irc,
          name: normalized.name,
          nameEn: normalized.nameEn,
          country: normalized.country,
          grade: normalized.grade,
          status: normalized.status,
          isSample: normalized.isSample
        })
      }).catch(err => console.error("Profile sync failed:", err));
    }

    if (contactChanged) {
      authFetch(`/api/vendors/${normalized.id}/contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactInfo: normalized.contactInfo,
          lastAudit: normalized.lastAudit
        })
      }).catch(err => console.error("Contact sync failed:", err));
    }

    if (scoresChanged) {
      authFetch(`/api/vendors/${normalized.id}/scores`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: normalized.scores,
          rawScores: normalized.rawScores,
          rejectionReasons: normalized.rejectionReasons
        })
      }).catch(err => console.error("Scores sync failed:", err));
    }

    if (analysisChanged) {
      authFetch(`/api/vendors/${normalized.id}/analysis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisRecords: normalized.analysisRecords,
          activityLogs: normalized.activityLogs
        })
      }).catch(err => console.error("Analysis sync failed:", err));
    } else if (logsChanged) {
      authFetch(`/api/vendors/${normalized.id}/logs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityLogs: normalized.activityLogs
        })
      }).catch(err => console.error("Logs sync failed:", err));
    }

    if (riskChanged) {
      authFetch(`/api/vendors/${normalized.id}/risk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskAssessment: normalized.riskAssessment
        })
      }).catch(err => console.error("Risk sync failed:", err));
    }
  };

  const handleDeleteVendor = (vendorId: string) => {
    setDb(db.filter(v => v.id !== vendorId));
    handleSelectVendor(null);
    setToastMsg('سورس با موفقیت حذف شد!');
    setTimeout(() => setToastMsg(null), 3000);
    authFetch(`/api/vendors/${vendorId}`, {
      method: 'DELETE'
    }).catch(err => {
      console.error("Failed to sync vendor deletion to DB:", err);
    });
  };

  const handleAddVendor = (newVendor: Vendor) => {
    const normalized = normalizeAndCleanVendor(newVendor);
    setDb([normalized, ...db]);
    setToastMsg('سورس جدید با موفقیت اضافه شد!');
    setTimeout(() => setToastMsg(null), 3000);
    authFetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    }).catch(err => {
      console.error("Failed to sync new vendor to DB:", err);
    });
  };

  // Views Content
  const renderContent = () => {
    let mainContent;
    let keyName = '';

    if (view === 'home') {
      keyName = 'home';
      mainContent = <HomeView db={db} materials={materials} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
    } else if (view === 'archive') {
      if (currentUser?.role === 'admin') {
        keyName = 'archive';
        mainContent = <ArchiveView db={db} currentUser={currentUser} materials={materials} />;
      } else {
        keyName = 'home-fallback';
        mainContent = <HomeView db={db} materials={materials} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
      }
    } else if (view === 'supplier-audit') {
      keyName = 'supplier-audit';
      mainContent = <SupplierAuditView db={db} onSelectVendor={handleSelectVendor} currentUser={currentUser} />;
    } else if (view === 'material-master') {
      keyName = 'material-master';
      mainContent = (
        <MaterialMasterView
          materials={materials}
          vendors={db}
          onSaveMaterial={handleSaveMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onNavigateToVendor={(vendorId) => {
            const v = db.find(x => x.id === vendorId);
            if (v) {
              handleSelectVendor(v);
            }
          }}
          currentUserRole={currentUser?.role}
        />
      );
    } else if (view === 'audit-center') {
      keyName = 'audit-center';
      mainContent = (
        <AuditActivityCenter 
          db={db} 
          materials={materials} 
          currentUser={currentUser} 
          onSelectVendor={handleSelectVendor} 
        />
      );
    } else if (view === 'category' && categoryId) {
      keyName = `category-${categoryId}`;
      mainContent = <CategoryView db={db} materials={materials} categoryId={categoryId} onSelectVendor={handleSelectVendor} currentUser={currentUser} expandedMaterial={expandedMaterial} onToggleMaterial={setExpandedMaterial} />;
    } else {
      keyName = 'home-fallback';
      mainContent = <HomeView db={db} onNavigate={navigate} onSelectVendor={handleSelectVendor} onAddVendor={handleAddVendor} currentUser={currentUser} onDownloadBackup={handleDownloadBackup} />;
    }

    return (
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={keyName}
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {mainContent}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Custom scrollbar for webkit */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #F5F5F7; }
        ::-webkit-scrollbar-thumb { background: #D2D2D7; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #F5F5F7; }
      `}</style>

      <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-600 flex overflow-hidden print:overflow-visible print:bg-white print:text-black print:block">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-20 md:hidden fade-in-fast" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* LEFT PANEL: Fixed Sidebar */}
        <aside className={`
          fixed top-0 bottom-0 right-0 z-30 w-[272px] bg-white/75 backdrop-blur-md border-l border-slate-900/10 
          transform transition-transform duration-300 ease-in-out md:translate-x-0 slide-in print:hidden
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}>
          {/* BRAND BLOCK */}
          <div className="px-5 py-5 border-b border-slate-900/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0">
                <img src={temadLogo} alt="Logo" className="h-16 w-auto object-contain" />
              </div>
              <div className="flex flex-col justify-center text-right">
                <span className="font-black text-slate-800 text-xs sm:text-sm leading-snug tracking-tight">Vendor List & Supplier</span>
                <span className="text-cyan-600 font-mono text-[10px] sm:text-[11px] mt-0.5 tracking-tighter uppercase whitespace-normal leading-tight max-w-[170px] font-bold">Evaluation System</span>
              </div>
            </div>
            <button 
              className="md:hidden text-slate-400 hover:text-slate-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <SidebarButton 
              icon={Home} label="صفحه اصلی" 
              variant="home"
              active={view === 'home' && !selectedVendor} 
              onClick={() => navigate('home')} 
            />
            <div className="pt-5 pb-2 px-4 text-xs font-mono uppercase tracking-widest text-slate-300">CATEGORIES</div>
            {(Object.entries(categoryLabels) as [Category, any][]).map(([id, meta]) => (
              <SidebarButton 
                key={id}
                variant={id}
                icon={meta.icon} label={meta.fa} sub={meta.en}
                active={view === 'category' && categoryId === id && !selectedVendor} 
                onClick={() => navigate('category', id)} 
              />
            ))}
            <div className="pt-5 pb-2 px-4 text-xs font-mono uppercase tracking-widest text-slate-300">MANAGEMENT</div>
            {currentUser?.role === 'admin' && (
              <>
                <SidebarButton 
                  icon={Archive} label="آرشیو کامل" 
                  sub="COMPLETE ARCHIVE"
                  variant="archive"
                  active={view === 'archive' && !selectedVendor} 
                  onClick={() => navigate('archive')} 
                />
                <SidebarButton 
                  icon={Activity} label="مرکز ممیزی و فعالیت‌ها" 
                  sub="AUDIT & ACTIVITY CENTER"
                  variant="audit-center"
                  active={view === 'audit-center' && !selectedVendor} 
                  onClick={() => navigate('audit-center')} 
                />
              </>
            )}
            <SidebarButton 
              icon={Handshake} label="بررسی یکپارچه تامین‌کننده" 
              sub="INTEGRATED SUPPLIER AUDIT"
              variant="supplier-audit"
              active={view === 'supplier-audit' && !selectedVendor} 
              onClick={() => navigate('supplier-audit')} 
            />
            <SidebarButton 
              icon={Layers} label="بانک مواد اولیه" 
              sub="MATERIAL MASTER BANK"
              variant="material-master"
              active={view === 'material-master' && !selectedVendor} 
              onClick={() => navigate('material-master')} 
            />

          </nav>

          {currentUser && (
            <div className="px-5 py-4 border-t border-slate-900/10 flex items-center justify-between gap-3 bg-slate-50/40">
              <div className="flex items-center gap-2 overflow-hidden text-right">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600 truncate">
                  {currentUser.role === 'admin' ? 'مدیریت سیستم' : 
                   currentUser.role === 'qa' ? 'واحد کیفیت QA' : 
                   currentUser.role === 'commercial' ? 'واحد بازرگانی' : 
                   currentUser.role === 'planning' ? 'واحد برنامه‌ریزی و انبار' : 
                   currentUser.role === 'finance' ? 'واحد مالی' : 'کاربر سیستم'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => setShowChangePasswordModal(true)} 
                  className="flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all duration-200 hover:shadow-xs cursor-pointer" 
                  title="تغییر کلمه عبور"
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('app_jwt_token');
                    localStorage.removeItem('app_currentUser');
                    localStorage.removeItem('app_viewHistory');
                    setCurrentUser(null);
                  }} 
                  className="flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all duration-200 hover:shadow-xs cursor-pointer" 
                  title="خروج"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT PANEL: Main Content Area */}
        <main className="flex-1 md:pr-[272px] flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:pr-0 print:block">
          
          {/* Sticky Topbar */}
          <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-[12px] border-b border-slate-900/10 px-5 py-3 flex items-center justify-between shrink-0 print:hidden shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-4">
              <button 
                className="md:hidden p-2 rounded-xl text-slate-400 bg-transparent hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Navigation History & Back Handler */}
              <div className="flex items-center gap-3">
                {viewHistory.length > 1 && (
                  <button 
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer shadow-xs select-none"
                    title="برگشت به مرحله قبل"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                    <span>برگشت</span>
                  </button>
                )}

                {/* Breadcrumbs for visual path stack */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 select-none overflow-hidden max-w-[320px] xl:max-w-[450px]">
                   {viewHistory.map((state, idx) => {
                     const isLast = idx === viewHistory.length - 1;
                     const label = getViewStateLabel(state);
                     if (!label) return null;
                     return (
                       <React.Fragment key={idx}>
                         {idx > 0 && <ChevronLeft className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                         <button 
                           onClick={() => setViewHistory(prev => prev.slice(0, idx + 1))}
                           className={`truncate transition-colors ${isLast ? 'font-bold text-slate-700 pointer-events-none' : 'hover:text-[#0071E3] cursor-pointer'}`}
                         >
                           {label}
                         </button>
                       </React.Fragment>
                     );
                   })}
                </div>
              </div>

              {/* Beautiful Live System Clock & Calendar */}
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-sans" dir="rtl">
                <span className="font-semibold text-slate-700">{systemTime.faDate}</span>
                <span className="text-slate-300">|</span>
                <span className="font-mono font-bold text-[#0071E3] tracking-widest leading-none mt-[1px]" dir="ltr">{systemTime.time}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={handleDownloadBackup}
                  className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="دانلود پشتیبان کامل پایگاه‌داده (JSON)"
                >
                  <Download className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span className="hidden md:inline">پشتیبان‌گیری کامل (JSON)</span>
                </button>
              )}

              <div className="bg-slate-900/5 border border-slate-900/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-emerald-800">سیستم فعال</span>
              </div>
            </div>
          </header>

          {selectedVendor ? (
            <div className="flex-1 overflow-y-auto w-full print:overflow-visible bg-[#F5F5F7] scroll-smooth">
              <motion.div
                key={`vendor-detail-${selectedVendor.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="max-w-6xl mx-auto px-4 sm:px-8 py-6"
              >
                <VendorDetail 
                  db={db} 
                  vendor={selectedVendor} 
                  materials={materials} 
                  onBack={goBack} 
                  onSave={handleUpdateVendor} 
                  onDelete={(id) => { handleDeleteVendor(id); goBack(); }} 
                  currentUser={currentUser} 
                />
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto w-full print:overflow-visible">
              <div className="max-w-5xl mx-auto p-4 sm:p-8 fade-in">
                {renderContent()}
              </div>
            </div>
          )}

        </main>

        {/* Global Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in flex items-center gap-2 bg-white border border-[#E5E5EA] text-[#1D1D1F] px-4 py-2.5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] interactive-element">
            <CheckCircle className="w-4 h-4 flex-shrink-[#86868B] text-emerald-500 bounce-in" />
            <span className="font-medium text-xs font-sans text-right" dir="rtl">{toastMsg}</span>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <ChangePasswordModal
            currentUser={currentUser}
            onClose={() => setShowChangePasswordModal(false)}
            onPasswordChanged={(updatedUser) => {
              setCurrentUser(updatedUser);
              setToastMsg("کلمه عبور با موفقیت تغییر یافت");
              setTimeout(() => setToastMsg(null), 3000);
            }}
          />
        )}

      </div>
    </>
  );
}

const variantStyles: Record<string, {
  activeClass: string;
  hoverClass: string;
  iconActiveClass: string;
  iconHoverClass: string;
}> = {
  home: {
    activeClass: 'bg-cyan-50/80 text-cyan-600 border-cyan-500/30 shadow-[inset_3px_0_0_#0891b2] border',
    hoverClass: 'text-slate-500 hover:text-cyan-600 hover:bg-cyan-50/40 hover:border-cyan-500/15 hover:shadow-[inset_3px_0_0_#0891b2]/30',
    iconActiveClass: 'bg-cyan-600/10 border border-cyan-500/25 text-cyan-600',
    iconHoverClass: 'group-hover:bg-cyan-600/5 group-hover:border-cyan-500/20 group-hover:text-cyan-600',
  },
  archive: {
    activeClass: 'bg-blue-50/80 text-blue-600 border-blue-500/30 shadow-[inset_3px_0_0_#2563eb] border',
    hoverClass: 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/40 hover:border-blue-500/15 hover:shadow-[inset_3px_0_0_#2563eb]/30',
    iconActiveClass: 'bg-blue-600/10 border border-blue-500/25 text-blue-600',
    iconHoverClass: 'group-hover:bg-blue-600/5 group-hover:border-blue-500/20 group-hover:text-blue-600',
  },
  foreign: {
    activeClass: 'bg-indigo-50/80 text-indigo-600 border-indigo-500/30 shadow-[inset_3px_0_0_#4f46e5] border',
    hoverClass: 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40 hover:border-indigo-500/15 hover:shadow-[inset_3px_0_0_#4f46e5]/30',
    iconActiveClass: 'bg-indigo-600/10 border border-indigo-500/25 text-indigo-600',
    iconHoverClass: 'group-hover:bg-indigo-600/5 group-hover:border-indigo-500/20 group-hover:text-indigo-600',
  },
  domestic: {
    activeClass: 'bg-emerald-50/80 text-emerald-600 border-emerald-500/30 shadow-[inset_3px_0_0_#059669] border',
    hoverClass: 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/40 hover:border-emerald-500/15 hover:shadow-[inset_3px_0_0_#059669]/30',
    iconActiveClass: 'bg-emerald-600/10 border border-emerald-500/25 text-emerald-600',
    iconHoverClass: 'group-hover:bg-emerald-600/5 group-hover:border-emerald-500/20 group-hover:text-emerald-600',
  },
  veterinary: {
    activeClass: 'bg-fuchsia-50/80 text-fuchsia-600 border-fuchsia-200 shadow-[inset_3px_0_0_#c026d3] border',
    hoverClass: 'text-slate-500 hover:text-fuchsia-600 hover:bg-fuchsia-50/40 hover:border-fuchsia-500/15 hover:shadow-[inset_3px_0_0_#c026d3]/30',
    iconActiveClass: 'bg-fuchsia-600/10 border border-fuchsia-500/25 text-fuchsia-600',
    iconHoverClass: 'group-hover:bg-fuchsia-600/5 group-hover:border-fuchsia-500/20 group-hover:text-fuchsia-600',
  },
  packaging: {
    activeClass: 'bg-amber-50/80 text-amber-600 border-amber-500/30 shadow-[inset_3px_0_0_#d97706] border',
    hoverClass: 'text-slate-500 hover:text-amber-600 hover:bg-amber-50/40 hover:border-amber-500/15 hover:shadow-[inset_3px_0_0_#d97706]/30',
    iconActiveClass: 'bg-amber-600/10 border border-amber-500/25 text-amber-600',
    iconHoverClass: 'group-hover:bg-amber-600/5 group-hover:border-amber-500/20 group-hover:text-amber-600',
  },
  sample: {
    activeClass: 'bg-violet-50/80 text-violet-600 border-violet-500/30 shadow-[inset_3px_0_0_#7c3aed] border',
    hoverClass: 'text-slate-500 hover:text-violet-600 hover:bg-violet-50/40 hover:border-violet-500/15 hover:shadow-[inset_3px_0_0_#7c3aed]/30',
    iconActiveClass: 'bg-violet-600/10 border border-violet-500/25 text-violet-600',
    iconHoverClass: 'group-hover:bg-violet-600/5 group-hover:border-violet-500/20 group-hover:text-violet-600',
  },
  blacklist: {
    activeClass: 'bg-rose-50/80 text-rose-600 border-rose-500/30 shadow-[inset_3px_0_0_#e11d48] border',
    hoverClass: 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/40 hover:border-rose-500/15 hover:shadow-[inset_3px_0_0_#e11d48]/30',
    iconActiveClass: 'bg-rose-600/10 border border-rose-500/25 text-rose-600',
    iconHoverClass: 'group-hover:bg-rose-600/5 group-hover:border-rose-500/20 group-hover:text-rose-600',
  },
  'supplier-audit': {
    activeClass: 'bg-teal-50/80 text-teal-600 border-teal-500/30 shadow-[inset_3px_0_0_#0d9488] border',
    hoverClass: 'text-slate-500 hover:text-teal-600 hover:bg-teal-50/40 hover:border-teal-500/15 hover:shadow-[inset_3px_0_0_#0d9488]/30',
    iconActiveClass: 'bg-teal-600/10 border border-teal-500/25 text-teal-600',
    iconHoverClass: 'group-hover:bg-teal-600/5 group-hover:border-teal-500/20 group-hover:text-teal-600',
  },
  'audit-center': {
    activeClass: 'bg-emerald-50/80 text-emerald-600 border-emerald-500/30 shadow-[inset_3px_0_0_#059669] border',
    hoverClass: 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/40 hover:border-emerald-500/15 hover:shadow-[inset_3px_0_0_#059669]/30',
    iconActiveClass: 'bg-emerald-600/10 border border-emerald-500/25 text-emerald-600',
    iconHoverClass: 'group-hover:bg-emerald-600/5 group-hover:border-emerald-500/20 group-hover:text-emerald-600',
  }
};

const SidebarButton: React.FC<{ icon: any, label: string, sub?: string, active: boolean, onClick: () => void, variant?: string }> = ({ icon: Icon, label, sub, active, onClick, variant = 'home' }) => {
  const currentStyle = variantStyles[variant] || variantStyles.home;
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 text-right group border
        ${active 
          ? currentStyle.activeClass 
          : `bg-transparent border-transparent ${currentStyle.hoverClass}`
        }
      `}
    >
      <div className={`
        w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-mono text-xs font-black transition-all duration-300
        ${active 
          ? currentStyle.iconActiveClass 
          : `bg-slate-900/5 border border-slate-900/10 text-slate-400 ${currentStyle.iconHoverClass}`
        }
      `}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col overflow-hidden text-right">
        <span className="font-semibold leading-tight truncate text-inherit">{label}</span>
        {sub && <span className="text-[10px] opacity-60 truncate font-mono uppercase tracking-wider">{sub}</span>}
      </div>
    </button>
  );
}
