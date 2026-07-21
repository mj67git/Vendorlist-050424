import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, Search, RotateCcw, Download, SlidersHorizontal, ChevronLeft, 
  ChevronRight, Calendar, User as UserIcon, ShieldAlert, FileText, CheckCircle2, 
  AlertTriangle, Eye, ArrowLeft, RefreshCw, Layers, Handshake, Filter, Info, 
  Settings, LogIn, LogOut, Terminal, X, ArrowUpRight, ArrowDownRight, ArrowRight,
  Plus, Pencil, Trash2, Microscope
} from 'lucide-react';
import { Vendor, User } from '../types';
import { Material } from './MaterialForm';
import * as XLSX from 'xlsx-js-style';

interface AuditActivityCenterProps {
  db: Vendor[];
  materials: Material[];
  currentUser: User;
  onSelectVendor: (vendor: Vendor) => void;
}

// Complete rich interface for parsed Audit Events
export interface AuditEvent {
  id: string;
  rawDate: string;
  dateOnly: string;
  timeOnly: string;
  user: string;
  action: string;
  vendorName: string;
  vendorId?: string;
  materialName: string;
  materialEn: string;
  cas: string;
  irc: string;
  category: string;
  module: 'Material Master' | 'Source Management' | 'Laboratory Unit' | 'User Directory' | 'System Controller' | 'Risk Manager';
  operation: 'Create' | 'Update' | 'Delete' | 'Laboratory Result' | 'Export' | 'Login' | 'Logout' | 'System';
  status: 'Success' | 'Warning' | 'Error' | 'Info';
  ipAddress: string;
  browser: string;
  os: string;
  changes?: { field: string; before: string; after: string }[];
}

export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let out = str;
  for (let i = 0; i < 10; i++) {
    out = out.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
  }
  return out;
}

export function AuditActivityCenter({ db, materials, currentUser, onSelectVendor }: AuditActivityCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, yesterday, week, month
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedOperation, setSelectedOperation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterCas, setFilterCas] = useState('');
  const [filterIrc, setFilterIrc] = useState('');
  const [filterRecordType, setFilterRecordType] = useState('all'); // domestic, foreign, packaging, veterinary, sample, blacklist
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  
  // Sorting & Pagination States
  const [sortField, setSortField] = useState<'date' | 'user' | 'module' | 'operation'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refreshKey, setRefreshKey] = useState(0);

  // A pool of realistic browser, OS and IP address data for rich, simulated audit compliance trace
  const browserPool = ['Chrome 124.0.5', 'Firefox 125.0', 'Safari 17.4', 'Edge 123.0', 'Chrome Mobile 124.0'];
  const osPool = ['Windows 11', 'macOS Sonoma (14.4)', 'Linux (Ubuntu 22.04)', 'Android 14', 'iOS 17.3'];
  const ipPool = ['192.168.1.104', '10.50.12.87', '192.168.2.45', '10.50.14.21', '172.16.8.99'];

  // Static high-quality system/admin audit actions to pre-populate logs beautifully and show multivariant operations 
  // (e.g. Backups, Login, User Management, Exports, etc.)
  const prePopulatedLogs = useMemo(() => {
    const today = new Date().toLocaleDateString('fa-IR');

    return [
      {
        id: 'mock_sys_reset',
        action: 'پاکسازی کامل اطلاعات آزمایشی و آماده‌سازی سیستم خام (System Data Reset & Initialization Successful)',
        date: `${today}، ۰۸:۰۰:۰۰`,
        user: 'مدیریت سیستم',
        ipAddress: '127.0.0.1',
        browser: 'System Core v2.0',
        os: 'Production Env',
        module: 'System Controller',
        operation: 'System',
        status: 'Success',
        changes: undefined as { field: string; before: string; after: string }[] | undefined
      }
    ];
  }, []);

  // Consolidate real actions in the database + pre-populated logs
  const allEvents = useMemo(() => {
    // 1. Gather all actual activityLogs from the database
    const dbEvents: AuditEvent[] = db.flatMap(vendor => {
      return (vendor.activityLogs || []).map((log, index) => {
        // Deterministically assign browser, OS and IP based on log id/index
        const hash = log.id.charCodeAt(log.id.length - 1) || 0;
        const ipAddress = ipPool[hash % ipPool.length];
        const browser = browserPool[hash % browserPool.length];
        const os = osPool[hash % osPool.length];

        // Parse date and time from the localized Persian string "۱۴۰۲/۰۴/۲۴، ۱۰:۱۵:۰۰"
        let dateOnly = '';
        let timeOnly = '';
        if (log.date) {
          const parts = log.date.split(/[،, \s]+/);
          dateOnly = parts[0] || log.date;
          timeOnly = parts[1] || '';
        }

        // Parse module & operation from log action description
        let module: AuditEvent['module'] = 'Source Management';
        let operation: AuditEvent['operation'] = 'Update';
        let status: AuditEvent['status'] = 'Info';
        let changes: AuditEvent['changes'] = undefined;

        const actionText = log.action || '';

        if (actionText.includes('ثبت نتیجه آزمایش جدید')) {
          module = 'Laboratory Unit';
          operation = 'Laboratory Result';
          status = 'Success';
        } else if (actionText.includes('ویرایش نتیجه آزمایش')) {
          module = 'Laboratory Unit';
          operation = 'Update';
          status = 'Info';
        } else if (actionText.includes('حذف نتیجه آزمایش')) {
          module = 'Laboratory Unit';
          operation = 'Delete';
          status = 'Warning';
        } else if (actionText.includes('ثبت ارزیابی ریسک')) {
          module = 'Risk Manager';
          operation = 'Update';
          status = 'Success';
        } else if (actionText.includes('ثبت ارزیابی نهایی')) {
          module = 'Risk Manager';
          operation = 'Update';
          status = 'Success';
        } else if (actionText.includes('ثبت سورس جدید')) {
          module = 'Source Management';
          operation = 'Create';
          status = 'Success';
        } else if (actionText.includes('ویرایش اطلاعات سورس')) {
          module = 'Source Management';
          operation = 'Update';
          status = 'Info';
        }

        // Try parsing changes like: "تغییر وضعیت از [تایید شده] به [مردود]"
        if (actionText.includes('تغییر وضعیت از') || actionText.includes('تغییر درجه کیفی از')) {
          changes = [];
          const statusRegex = /تغییر وضعیت از \[(.*?)\] به \[(.*?)\]/;
          const statusMatch = actionText.match(statusRegex);
          if (statusMatch) {
            changes.push({
              field: 'وضعیت ارزیابی سورس',
              before: statusMatch[1],
              after: statusMatch[2]
            });
          }

          const gradeRegex = /تغییر درجه کیفی از \[(.*?)\] به \[(.*?)\]/;
          const gradeMatch = actionText.match(gradeRegex);
          if (gradeMatch) {
            changes.push({
              field: 'رتبه‌بندی کیفی (Grade)',
              before: gradeMatch[1],
              after: gradeMatch[2]
            });
          }
        }

        return {
          id: log.id,
          rawDate: log.date,
          dateOnly,
          timeOnly,
          user: log.user,
          action: log.action,
          vendorName: vendor.name,
          vendorId: vendor.id,
          materialName: vendor.material,
          materialEn: vendor.materialEn || '',
          cas: vendor.cas || 'N/A',
          irc: vendor.irc || 'N/A',
          category: vendor.category,
          module,
          operation,
          status,
          ipAddress,
          browser,
          os,
          changes
        };
      });
    });

    // 2. Format pre-populated events correctly
    const formattedPrePopulated: AuditEvent[] = prePopulatedLogs.map(log => {
      let dateOnly = '';
      let timeOnly = '';
      if (log.date) {
        const parts = log.date.split(/[،, \s]+/);
        dateOnly = parts[0] || log.date;
        timeOnly = parts[1] || '';
      }

      return {
        id: log.id,
        rawDate: log.date,
        dateOnly,
        timeOnly,
        user: log.user,
        action: log.action,
        vendorName: 'سیستم مرکز',
        materialName: 'کنترل سیستم',
        materialEn: 'SYS_CORE',
        cas: 'SYSTEM',
        irc: 'SYSTEM',
        category: 'all',
        module: log.module as AuditEvent['module'],
        operation: log.operation as AuditEvent['operation'],
        status: log.status as AuditEvent['status'],
        ipAddress: log.ipAddress,
        browser: log.browser,
        os: log.os,
        changes: log.changes
      };
    });

    // 3. Concat and sort
    const combined = [...dbEvents, ...formattedPrePopulated];

    return combined;
  }, [db, prePopulatedLogs, refreshKey]);

  // Unique lists for filters
  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(allEvents.map(e => e.user).filter(Boolean)));
  }, [allEvents]);

  // Filtering Logic
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      // Free Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        e.action.toLowerCase().includes(searchLower) ||
        e.user.toLowerCase().includes(searchLower) ||
        e.vendorName.toLowerCase().includes(searchLower) ||
        e.materialName.toLowerCase().includes(searchLower) ||
        e.materialEn.toLowerCase().includes(searchLower) ||
        e.cas.toLowerCase().includes(searchLower) ||
        e.irc.toLowerCase().includes(searchLower) ||
        e.id.toLowerCase().includes(searchLower);

      // Period Filter
      let matchPeriod = true;
      if (selectedPeriod !== 'all') {
        const todayStr = new Date().toLocaleDateString('fa-IR');
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toLocaleDateString('fa-IR');

        if (selectedPeriod === 'today') {
          matchPeriod = e.dateOnly === todayStr;
        } else if (selectedPeriod === 'yesterday') {
          matchPeriod = e.dateOnly === yesterdayStr;
        } else if (selectedPeriod === 'week') {
          // Just a simple heuristic for mock display: week includes today, yesterday and items with same month prefix
          matchPeriod = e.dateOnly.substring(0, 7) === todayStr.substring(0, 7);
        } else if (selectedPeriod === 'month') {
          matchPeriod = e.dateOnly.substring(0, 7) === todayStr.substring(0, 7);
        }
      }

      // Dropdown filters
      const matchUser = selectedUser === 'all' || e.user === selectedUser;
      const matchModule = selectedModule === 'all' || e.module === selectedModule;
      const matchOperation = selectedOperation === 'all' || e.operation === selectedOperation;
      const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || e.status === selectedStatus;

      // Text input filters
      const matchMaterialText = !filterMaterial || 
        e.materialName.toLowerCase().includes(filterMaterial.toLowerCase()) ||
        e.materialEn.toLowerCase().includes(filterMaterial.toLowerCase());
        
      const matchSourceText = !filterSource || 
        e.vendorName.toLowerCase().includes(filterSource.toLowerCase());

      const matchCasText = !filterCas || e.cas.toLowerCase().includes(filterCas.toLowerCase());
      const matchIrcText = !filterIrc || e.irc.toLowerCase().includes(filterIrc.toLowerCase());

      // Record Type
      const matchRecordType = filterRecordType === 'all' || e.category === filterRecordType;

      return matchSearch && matchPeriod && matchUser && matchModule && 
             matchOperation && matchCategory && matchStatus && 
             matchMaterialText && matchSourceText && matchCasText && 
             matchIrcText && matchRecordType;
    });
  }, [allEvents, searchTerm, selectedPeriod, selectedUser, selectedModule, selectedOperation, selectedCategory, selectedStatus, filterMaterial, filterSource, filterCas, filterIrc, filterRecordType]);

  // Sorting
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortField === 'date') {
        // Numeric sort on date
        const cleanA = toEnglishDigits(a.rawDate).replace(/[^0-9]/g, '').padEnd(14, '0');
        const cleanB = toEnglishDigits(b.rawDate).replace(/[^0-9]/g, '').padEnd(14, '0');
        return sortOrder === 'asc' ? cleanA.localeCompare(cleanB) : cleanB.localeCompare(cleanA);
      } else if (sortField === 'user') {
        valA = a.user;
        valB = b.user;
      } else if (sortField === 'module') {
        valA = a.module;
        valB = b.module;
      } else if (sortField === 'operation') {
        valA = a.operation;
        valB = b.operation;
      }

      return sortOrder === 'asc' 
        ? valA.localeCompare(valB, 'fa') 
        : valB.localeCompare(valA, 'fa');
    });
  }, [filteredEvents, sortField, sortOrder]);

  // Pagination
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedEvents.slice(startIndex, startIndex + pageSize);
  }, [sortedEvents, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedEvents.length / pageSize) || 1;

  // Statistics calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('fa-IR');
    const todayEvents = allEvents.filter(e => e.dateOnly === todayStr);
    
    // Last activity time
    const sortedAll = [...allEvents].sort((a, b) => {
      const cleanA = toEnglishDigits(a.rawDate).replace(/[^0-9]/g, '').padEnd(14, '0');
      const cleanB = toEnglishDigits(b.rawDate).replace(/[^0-9]/g, '').padEnd(14, '0');
      return cleanB.localeCompare(cleanA);
    });
    const lastActive = sortedAll[0] ? sortedAll[0].timeOnly : '--:--';

    // Counts by operations
    let createCount = 0;
    let updateCount = 0;
    let deleteCount = 0;
    let labCount = 0;
    let exportCount = 0;
    let loginCount = 0;

    allEvents.forEach(e => {
      if (e.operation === 'Create') createCount++;
      else if (e.operation === 'Update') updateCount++;
      else if (e.operation === 'Delete') deleteCount++;
      else if (e.operation === 'Laboratory Result') labCount++;
      else if (e.operation === 'Export') exportCount++;
      else if (e.operation === 'Login') loginCount++;
    });

    // Week events
    const weekCount = allEvents.filter(e => e.dateOnly.substring(0, 7) === todayStr.substring(0, 7)).length;

    return {
      total: allEvents.length,
      today: todayEvents.length,
      lastActive,
      weekCount,
      createCount,
      updateCount,
      deleteCount,
      labCount,
      exportCount,
      loginCount
    };
  }, [allEvents]);

  // Short Timeline events (last 5 daily events for side chronological view)
  const timelineEvents = useMemo(() => {
    const sorted = [...allEvents].sort((a, b) => {
      const cleanA = toEnglishDigits(a.rawDate).replace(/[^0-9]/g, '').padEnd(14, '0');
      const cleanB = toEnglishDigits(b.rawDate).replace(/[^0-9]/g, '').padEnd(14, '0');
      return cleanB.localeCompare(cleanA);
    });
    return sorted.slice(0, 6);
  }, [allEvents]);

  // Excel Exporter for Audit logs
  const handleExportToExcel = () => {
    const headerRow = [
      'ردیف',
      'شناسه رویداد',
      'تاریخ',
      'ساعت',
      'کاربر',
      'نوع عملیات',
      'ماژول مربوطه',
      'دسته‌بندی سورس',
      'نام ماده',
      'نام تامین‌کننده / سورس',
      'آدرس IP کاربر',
      'سیستم عامل / مرورگر',
      'شرح فعالیت ثبت شده'
    ];

    const dataRows = sortedEvents.map((e, index) => [
      index + 1,
      e.id,
      e.dateOnly,
      e.timeOnly,
      e.user,
      e.operation,
      e.module,
      e.category === 'all' ? 'سیستمی' : e.category,
      e.materialName,
      e.vendorName,
      e.ipAddress,
      `${e.os} / ${e.browser}`,
      e.action
    ]);

    // Build worksheet with custom styles
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

    // Apply corporate header design matching standard tables
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:M1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { patternType: 'solid', fgColor: { rgb: '1E3A8A' } }, // Navy style matching Archive
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '475569' } },
            bottom: { style: 'medium', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        };
      }
    }

    // Apply standard values cell styles
    for (let row = 1; row <= sortedEvents.length; row++) {
      for (let col = 0; col <= 12; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellRef];
        if (cell) {
          cell.s = {
            font: { name: 'Segoe UI', sz: 9, color: { rgb: '1E293B' } }, // Deep slate matching Archive
            alignment: { 
              horizontal: (col === 4 || col === 8 || col === 9 || col === 12) ? 'right' : 'center', // Right-align RTL texts
              vertical: 'center',
              wrapText: true
            },
            fill: { patternType: 'solid', fgColor: { rgb: row % 2 === 0 ? 'F1F5F9' : 'FFFFFF' } }, // Slate-100 alternating rows matching Archive
            border: {
              top: { style: 'thin', color: { rgb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
              left: { style: 'thin', color: { rgb: 'E2E8F0' } },
              right: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
          };

          // Style operation badge column specifically
          if (col === 5) {
            const val = String(cell.v || '');
            if (val === 'Create') {
              cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'D1FAE5' } }; // Emerald-100
              cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '065F46' } };
            } else if (val === 'Update') {
              cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } }; // Blue-100
              cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '1E40AF' } };
            } else if (val === 'Delete') {
              cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } }; // Red-100
              cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '991B1B' } };
            } else if (val === 'Laboratory Result') {
              cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'FFEDD5' } }; // Orange-100
              cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '9A3412' } };
            } else if (val === 'Export') {
              cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'F3E8FF' } }; // Purple-100
              cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '6B21A8' } };
            } else if (val === 'Login' || val === 'Logout') {
              cell.s.fill = { patternType: 'solid', fgColor: { rgb: 'FEF9C3' } }; // Yellow-100
              cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: '854D0E' } };
            }
          }
        }
      }
    }

    // Width declarations
    ws['!cols'] = [
      { wch: 6 },   // index
      { wch: 14 },  // id
      { wch: 14 },  // date
      { wch: 12 },  // time
      { wch: 18 },  // user
      { wch: 18 },  // operation
      { wch: 22 },  // module
      { wch: 18 },  // category
      { wch: 24 },  // material
      { wch: 24 },  // vendor
      { wch: 16 },  // ip
      { wch: 28 },  // system
      { wch: 65 }   // description
    ];

    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ RTL: true });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Log_Audit_Trail');
    const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
    XLSX.writeFile(wb, `گزارش_لاگ_سیستم_${dateStr}.xlsx`);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPeriod('all');
    setSelectedUser('all');
    setSelectedModule('all');
    setSelectedOperation('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setFilterMaterial('');
    setFilterSource('');
    setFilterCas('');
    setFilterIrc('');
    setFilterRecordType('all');
  };

  // Color mapper helper for badges
  const getOperationBadgeConfig = (op: AuditEvent['operation']) => {
    switch (op) {
      case 'Create':
        return { text: 'ایجاد رکورد', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Update':
        return { text: 'ویرایش اطلاعات', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'Delete':
        return { text: 'حذف رکورد', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'Laboratory Result':
        return { text: 'ثبت آزمایشگاه', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'Export':
        return { text: 'خروجی اکسل', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'Login':
        return { text: 'ورود به سیستم', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Logout':
        return { text: 'خروج از سیستم', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      default:
        return { text: 'عملیات سیستم', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
  };

  const getStatusBadgeConfig = (status: AuditEvent['status']) => {
    switch (status) {
      case 'Success':
        return { text: 'موفق', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'Warning':
        return { text: 'هشدار', icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Error':
        return { text: 'خطا', icon: ShieldAlert, color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { text: 'اطلاعات', icon: Info, color: 'bg-sky-50 text-sky-700 border-sky-100' };
    }
  };

  const handleRowClick = (e: AuditEvent) => {
    setSelectedEvent(e);
  };

  return (
    <div className="space-y-6 fade-in relative pb-10 max-w-7xl mx-auto text-right" dir="rtl">
      
      {/* 1- STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all duration-300 print:hidden select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-sm">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-relaxed flex items-center gap-2">
              Audit & Activity Center
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md font-mono">
                LIMS & GMP Compliant
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">مرکز پایش، ممیزی سراسری و مدیریت یکپارچه لاگ‌های سیستمی تماد</p>
          </div>
        </div>

        {/* Info Badges in Sticky Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-semibold">کل رویدادها</div>
            <div className="text-xs font-bold text-slate-800 font-mono">{stats.total}</div>
          </div>
          <div className="bg-emerald-50/40 border border-emerald-100 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] text-emerald-600 font-semibold">امروز</div>
            <div className="text-xs font-bold text-emerald-700 font-mono">{stats.today}</div>
          </div>
          <div className="bg-sky-50/40 border border-sky-100 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] text-sky-600 font-semibold">آخرین پایش</div>
            <div className="text-xs font-bold text-sky-700 font-mono">{stats.lastActive}</div>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

          {/* Buttons */}
          <button 
            onClick={handleRefresh}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="بروزرسانی لحظه‌ای"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 h-9 rounded-xl border transition-all text-xs font-bold cursor-pointer active:scale-95 ${
              showFilters 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فیلترهای پیشرفته</span>
          </button>

          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/10 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل کامل</span>
          </button>
        </div>
      </div>

      {/* 2- STATS SUMMARY DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: 'فعالیت‌های امروز', value: stats.today, icon: Calendar, color: 'text-emerald-600 border-emerald-100 bg-emerald-50/20' },
          { label: 'فعالیت‌های هفته', value: stats.weekCount, icon: Activity, color: 'text-indigo-600 border-indigo-100 bg-indigo-50/20' },
          { label: 'عملیات Create', value: stats.createCount, icon: Plus, color: 'text-teal-600 border-teal-100 bg-teal-50/20' },
          { label: 'عملیات Update', value: stats.updateCount, icon: Pencil, color: 'text-blue-600 border-blue-100 bg-blue-50/20' },
          { label: 'عملیات Delete', value: stats.deleteCount, icon: Trash2, color: 'text-rose-600 border-rose-100 bg-rose-50/20' },
          { label: 'عملیات Export', value: stats.exportCount, icon: Download, color: 'text-purple-600 border-purple-100 bg-purple-50/20' },
          { label: 'ورود کاربران', value: stats.loginCount, icon: LogIn, color: 'text-amber-600 border-amber-100 bg-amber-50/20' },
          { label: 'نتایج آزمایشگاهی', value: stats.labCount, icon: Microscope, color: 'text-orange-600 border-orange-100 bg-orange-50/20' },
        ].map((card, i) => {
          const CardIcon = card.icon;
          return (
            <div key={i} className={`bg-white border rounded-2xl p-3.5 space-y-2 flex flex-col justify-between shadow-xs transition-all hover:scale-[1.02] ${card.color}`}>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-white/80 border border-slate-100 flex items-center justify-center">
                  <CardIcon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold truncate leading-normal">{card.label}</div>
                <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3- ADVANCED FILTERS PANEL */}
      {(showFilters || searchTerm) && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              فیلترهای پیشرفته و پایش هوشمند رویدادها
            </h3>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              پاک کردن همه فیلترها
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Free search */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">جستجوی آزاد (کلیه ستون‌ها)</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-right pr-8" 
                  placeholder="جستجوی نام، کاربر، CAS، IRC..." 
                  value={searchTerm} 
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Time period filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">بازه زمانی</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={selectedPeriod}
                onChange={e => { setSelectedPeriod(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">کل دوره (All Time)</option>
                <option value="today">امروز (Today)</option>
                <option value="yesterday">دیروز (Yesterday)</option>
                <option value="week">این هفته (This Week)</option>
                <option value="month">این ماه (This Month)</option>
              </select>
            </div>

            {/* Operator User Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">کاربر ثبت‌کننده</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={selectedUser}
                onChange={e => { setSelectedUser(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">همه کاربران سیستم</option>
                {uniqueUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Module Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">ماژول سیستم</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={selectedModule}
                onChange={e => { setSelectedModule(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">همه ماژول‌ها</option>
                <option value="Material Master">بانک مواد اولیه (Material Master)</option>
                <option value="Source Management">مدیریت سورس‌ها (Source Management)</option>
                <option value="Laboratory Unit">واحد آزمایشگاه (Laboratory Unit)</option>
                <option value="User Directory">مدیریت دسترسی و کاربران (User Directory)</option>
                <option value="System Controller">هسته کنترل سیستم (System Controller)</option>
                <option value="Risk Manager">ارزیابی ریسک و مخاطرات (Risk Manager)</option>
              </select>
            </div>

            {/* Operation Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">نوع عملیات</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={selectedOperation}
                onChange={e => { setSelectedOperation(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">همه عملیات‌ها</option>
                <option value="Create">ایجاد رکورد جدید (Create)</option>
                <option value="Update">ویرایش اطلاعات (Update)</option>
                <option value="Delete">حذف فیزیکی/منطقی (Delete)</option>
                <option value="Laboratory Result">ثبت تست آزمایشگاهی (Lab Result)</option>
                <option value="Export">خروجی اکسل و گزارش‌گیری (Export)</option>
                <option value="Login">ورود کاربران به پلتفرم (Login)</option>
                <option value="Logout">خروج از پلتفرم (Logout)</option>
                <option value="System">رویداد ساختاری سیستم (System)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">وضعیت رویداد</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="Success">موفق (Success)</option>
                <option value="Warning">هشدار (Warning)</option>
                <option value="Error">ناموفق / خطا (Error)</option>
                <option value="Info">اطلاعاتی (Info)</option>
              </select>
            </div>

            {/* Source Category type Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">طبقه‌بندی منبع</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                <option value="foreign">خرید خارجی (Foreign)</option>
                <option value="domestic">خرید داخلی (Domestic)</option>
                <option value="veterinary">دامی (Veterinary)</option>
                <option value="packaging">بسته‌بندی (Packaging)</option>
                <option value="sample">نمونه (Sample)</option>
                <option value="blacklist">لیست سیاه (Blacklist)</option>
              </select>
            </div>

            {/* Record category source */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">نوع رکورد سورس</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                value={filterRecordType}
                onChange={e => { setFilterRecordType(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">همه رکوردها</option>
                <option value="domestic">تولیدکننده داخلی</option>
                <option value="foreign">تولیدکننده خارجی</option>
                <option value="sample">نمونه اولیه</option>
                <option value="blacklist">بلک لیست</option>
              </select>
            </div>
          </div>

          {/* Row 2: Secondary Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100/60">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">نام ماده (فارسی / انگلیسی)</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                placeholder="پاراستامول، آسپیرین، ..."
                value={filterMaterial}
                onChange={e => { setFilterMaterial(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">تامین‌کننده / کمپانی (Source Name)</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                placeholder="Sinochem, CSPC, Merck..."
                value={filterSource}
                onChange={e => { setFilterSource(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">شماره ثبت CAS Number</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center font-mono"
                placeholder="e.g. 103-90-2"
                value={filterCas}
                onChange={e => { setFilterCas(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold">شماره IRC / IVC</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center font-mono"
                placeholder="e.g. 4802957291039"
                value={filterIrc}
                onChange={e => { setFilterIrc(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4- MAIN LAYOUT: TABLE + TIMELINE UNDERNEATH */}
      <div className="space-y-6">
        
        {/* MAIN LOGS TABLE (Now occupies full 100% width) */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-b border-slate-100 gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-slate-100 text-[10px] font-mono px-2 py-0.5 rounded">
                Records: {sortedEvents.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">پیدا شده در جستجو</span>
            </div>

            {/* Page Size & Sorting */}
            <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>نمایش:</span>
                <select 
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>۱۰ ردیف</option>
                  <option value={25}>۲۵ ردیف</option>
                  <option value={50}>۵۰ ردیف</option>
                  <option value={100}>۱۰۰ ردیف</option>
                </select>
              </div>

              <div className="h-4 w-[1px] bg-slate-200" />

              <div className="flex items-center gap-1">
                <span className="text-slate-500">مرتب‌سازی:</span>
                <button 
                  onClick={() => {
                    if (sortField === 'date') {
                      setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('date');
                      setSortOrder('desc');
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    sortField === 'date' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  تاریخ {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
                <button 
                  onClick={() => {
                    if (sortField === 'user') {
                      setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('user');
                      setSortOrder('asc');
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    sortField === 'user' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  کاربر {sortField === 'user' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200/60 select-none">
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3 text-center w-24">تاریخ رویداد</th>
                  <th className="p-3 text-center w-18">ساعت</th>
                  <th className="p-3 text-center w-28">کاربر</th>
                  <th className="p-3 text-center w-32">نوع عملیات</th>
                  <th className="p-3 text-center w-40">ماژول سیستمی</th>
                  <th className="p-3 text-right">شرح رویداد ممیزی</th>
                  <th className="p-3 text-center w-28">وضعیت</th>
                  <th className="p-3 text-center w-16">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium italic">
                      هیچ رویدادی با شرایط فیلتر انتخاب شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((evt, index) => {
                    const rowNum = (currentPage - 1) * pageSize + index + 1;
                    const opBadge = getOperationBadgeConfig(evt.operation);
                    const statusBadge = getStatusBadgeConfig(evt.status);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <tr 
                        key={evt.id} 
                        onClick={() => handleRowClick(evt)}
                        className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                      >
                        <td className="p-3 text-center font-mono text-slate-400 font-bold select-none">{rowNum}</td>
                        <td className="p-3 text-center font-mono text-slate-600 font-bold">{evt.dateOnly}</td>
                        <td className="p-3 text-center font-mono text-slate-500 font-semibold">{evt.timeOnly}</td>
                        <td className="p-3 text-center">
                          <div className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {evt.user}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${opBadge.color}`}>
                            {opBadge.text}
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-500">{evt.module}</td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-slate-800 leading-relaxed max-w-md line-clamp-1 group-hover:line-clamp-2 transition-all">
                            {evt.action}
                          </div>
                          {evt.vendorName && evt.vendorName !== 'سیستم مرکز' && (
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-0.5 font-semibold">
                              <span>سورس: {evt.vendorName}</span>
                              <span>•</span>
                              <span>ماده: {evt.materialName}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusBadge.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="p-3 text-center select-none" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => handleRowClick(evt)}
                            className="w-7 h-7 rounded-lg border border-slate-200 hover:border-emerald-500/30 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer"
                            title="مشاهده جزئیات رویداد"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/40 select-none">
              <span className="text-xs text-slate-500 font-medium">
                نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, sortedEvents.length)} از {sortedEvents.length} رویداد
              </span>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'border border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TIMELINE / LIVE FEED SECTION (Now underneath, beautifully formatted) */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-950 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              رویدادهای اخیر (Live Feed)
            </h3>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-emerald-600 font-bold">پایش زنده</span>
            </span>
          </div>

          <div className="space-y-3">
            {timelineEvents.map((te, idx) => {
              const badge = getOperationBadgeConfig(te.operation);
              const opColor = badge.color;
              
              return (
                <div 
                  key={te.id} 
                  className="group transition-all bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 px-4 py-3 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-right"
                >
                  {/* Operation Badge & Time Info */}
                  <div className="flex items-center gap-2.5 shrink-0 select-none">
                    <span className="font-mono font-bold text-slate-500 text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                      {te.rawDate.substring(11, 19) || te.timeOnly}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border ${opColor} uppercase tracking-wider`}>
                      {te.operation}
                    </span>
                  </div>

                  {/* Main Event Action Description */}
                  <div className="flex-1 text-slate-800 text-xs leading-relaxed font-bold break-words w-full">
                    {te.action}
                  </div>

                  {/* Metadata (User & IP Address) */}
                  <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400 font-semibold font-mono border-t md:border-t-0 border-slate-100 pt-2 md:pt-0 w-full md:w-auto justify-between md:justify-end" dir="ltr">
                    <span className="flex items-center gap-1">
                      <span>{te.user}</span>
                      <span className="text-slate-300">👤</span>
                    </span>
                    <span className="text-slate-300 select-none">•</span>
                    <span className="flex items-center gap-1">
                      <span>{te.ipAddress}</span>
                      <span className="text-slate-300">🖥️</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 leading-relaxed">
            <div className="font-bold text-slate-700">پشتیبان امنیتی کالا و سورس</div>
            <div>تمام فعالیتهای سیستمی توسط فریمورک یکپارچه QMS مانیتور و لاگ می‌شوند.</div>
          </div>
        </div>

      </div>

      {/* 5- EVENT DETAIL SIDE PANEL (DRAWER) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden print:hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div 
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-500" 
            />

            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
              <div className="pointer-events-auto w-screen max-w-md transform transition-all duration-500 ease-in-out sm:max-w-lg">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl border-r border-slate-200">
                  
                  {/* Header */}
                  <div className="bg-slate-900 px-5 py-5 text-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-sm font-bold leading-normal">مشخصات فنی و امنیتی رویداد</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedEvent(null)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-white/15 px-2 py-0.5 rounded text-slate-200">
                        ID: {selectedEvent.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white`}>
                        {selectedEvent.operation}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-6 px-5 py-6 text-right">
                    
                    {/* General Metadata */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
                        <Info className="w-4 h-4 text-slate-400" />
                        اطلاعات عمومی رویداد
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block mb-0.5">کاربر مسئول</span>
                          <span className="font-bold text-slate-800">{selectedEvent.user}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block mb-0.5">ماژول مرجع</span>
                          <span className="font-bold text-slate-800">{selectedEvent.module}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block mb-0.5">تاریخ ثبت</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedEvent.dateOnly}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block mb-0.5">ساعت دقیق</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedEvent.timeOnly}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                          <span className="text-[10px] text-slate-400 block mb-0.5">آدرس IP کلاینت</span>
                          <span className="font-bold text-slate-800 font-mono" dir="ltr">{selectedEvent.ipAddress}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                          <span className="text-[10px] text-slate-400 block mb-0.5">پلتفرم / مرورگر کلاینت</span>
                          <span className="font-bold text-slate-800 font-mono" dir="ltr">{selectedEvent.os} / {selectedEvent.browser}</span>
                        </div>
                      </div>
                    </div>

                    {/* Context Source Information */}
                    {selectedEvent.vendorName && selectedEvent.vendorName !== 'سیستم مرکز' && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
                          <Handshake className="w-4 h-4 text-slate-400" />
                          اطلاعات سورس و کالا
                        </h3>
                        
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">نام سورس / کمپانی:</span>
                            <span className="font-bold text-slate-800">{selectedEvent.vendorName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">نام تجاری کالا (Material):</span>
                            <span className="font-bold text-slate-800">{selectedEvent.materialName}</span>
                          </div>
                          {selectedEvent.materialEn && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">کد لاتین کالا:</span>
                              <span className="font-bold text-slate-800 font-mono">{selectedEvent.materialEn}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">شماره ثبت CAS Number:</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedEvent.cas}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">کد رهگیری IRC / IVC:</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedEvent.irc}</span>
                          </div>
                          
                          {selectedEvent.vendorId && (
                            <div className="pt-2 border-t border-slate-200/50 flex justify-end">
                              <button 
                                onClick={() => {
                                  const foundVend = db.find(x => x.id === selectedEvent.vendorId);
                                  if (foundVend) {
                                    onSelectVendor(foundVend);
                                    setSelectedEvent(null);
                                  }
                                }}
                                className="text-emerald-600 hover:text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-200 rounded-lg px-2.5 py-1 bg-white hover:bg-emerald-50 cursor-pointer"
                              >
                                <span>انتقال مستقیم به پرونده تامین‌کننده</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detailed Change Log Descriptions */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        شرح تفصیلی رویداد
                      </h3>
                      
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium text-slate-800 text-xs leading-relaxed">
                        {selectedEvent.action}
                      </div>
                    </div>

                    {/* Before & After Values Visual Diff */}
                    {selectedEvent.changes && selectedEvent.changes.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
                          <Settings className="w-4 h-4 text-slate-400" />
                          تاریخچه تغییرات مقادیر (Before / After)
                        </h3>
                        
                        <div className="space-y-3">
                          {selectedEvent.changes.map((ch, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                              <div className="bg-slate-100 p-2 font-bold text-slate-700 border-b border-slate-200">
                                {ch.field}
                              </div>
                              <div className="grid grid-cols-2 divide-x divide-slate-200 text-center">
                                
                                {/* Before */}
                                <div className="p-3 bg-rose-50/50 space-y-1">
                                  <span className="text-[9px] text-rose-500 font-bold block">قبل از ویرایش (Before)</span>
                                  <span className="font-semibold text-rose-800 line-through decoration-rose-400 decoration-2">{ch.before || 'ثبت‌نشده / خالی'}</span>
                                </div>

                                {/* After */}
                                <div className="p-3 bg-emerald-50/50 space-y-1">
                                  <span className="text-[9px] text-emerald-500 font-bold block">بعد از ویرایش (After)</span>
                                  <span className="font-bold text-emerald-800">{ch.after || 'حذف‌شده / خالی'}</span>
                                </div>

                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 flex items-center justify-between select-none">
                    <span className="text-[10px] text-slate-400 font-mono">Operator Token verified</span>
                    <button 
                      onClick={() => setSelectedEvent(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      بستن پنجره جزئیات
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
