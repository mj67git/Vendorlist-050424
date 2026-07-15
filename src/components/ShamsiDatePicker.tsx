import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, X, ChevronRight, ChevronLeft } from 'lucide-react';
import jalaali from 'jalaali-js';

interface ShamsiDatePickerProps {
  value: string; // YYYY/MM/DD
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const getDaysInMonth = (year: number, month: number) => {
  return jalaali.jalaaliMonthLength(year, month);
};

// پیدا کردن روز شروع ماه
const getStartDayOfWeek = (year: number, month: number) => {
  const { gy, gm, gd } = jalaali.toGregorian(year, month, 1);
  const jsDay = new Date(gy, gm - 1, gd).getDay();
  // تبدیل خروجی getDay جاوااسکریپت (یکشنبه ۰، ... شنبه ۶) به ایندکس‌های ما (شنبه ۰، ... جمعه ۶)
  return jsDay === 6 ? 0 : jsDay + 1;
};

export const ShamsiDatePicker: React.FC<ShamsiDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ...',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // استخراج سال، ماه و روز از مقدار فعلی
  const parts = value.split('/');
  const initialYear = parts.length === 3 ? parseInt(parts[0], 10) : 1403;
  const initialMonth = parts.length === 3 ? parseInt(parts[1], 10) : 1;
  
  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth); // ۱ تا ۱۲

  // مدیریت کلیک بیرون پاپ‌آپ
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleDayClick = (day: number) => {
    const mm = currentMonth.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    onChange(`${currentYear}/${mm}/${dd}`);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDayIndex = getStartDayOfWeek(currentYear, currentMonth);
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDaysArray = Array.from({ length: startDayIndex }, (_, i) => i);

  return (
    <div className="relative inline-block w-full" ref={containerRef} dir="rtl">
      {/* Input Field */}
      <div 
        className={`flex items-center justify-between w-full bg-white border border-slate-250 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-indigo-300'}`}
      >
        <div className="flex items-center gap-2 flex-1">
          <CalendarIcon 
            className="w-4 h-4 text-slate-400 cursor-pointer" 
            onClick={() => !disabled && setIsOpen(!isOpen)} 
          />
          <input
            type="text"
            dir="ltr"
            placeholder="1403/01/01"
            className="w-full bg-transparent font-mono text-sm text-left text-slate-800 focus:outline-none disabled:cursor-not-allowed"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.length > 4) val = val.substring(0, 4) + '/' + val.substring(4);
              if (val.length > 7) val = val.substring(0, 7) + '/' + val.substring(7);
              if (val.length > 10) val = val.substring(0, 10);
              onChange(val);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="absolute top-full right-0 mt-2 z-50 bg-white border border-slate-250 shadow-[0_4px_24px_rgba(15,23,42,0.08)] rounded-2xl p-4 w-72 origin-top"
          >
            {/* Header (Moth & Year Setup) */}
            <div className="flex items-center justify-between mb-4">
              <button 
                type="button" 
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg pr-2 pl-6 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>
                
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold font-mono rounded-lg pr-2 pl-6 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: 100 }, (_, i) => 1350 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <button 
                type="button" 
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEK_DAYS.map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-400 pb-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {emptyDaysArray.map(idx => (
                <div key={`empty-${idx}`} className="h-8 rounded-lg"></div>
              ))}
              
              {daysArray.map(day => {
                const mm = currentMonth.toString().padStart(2, '0');
                const dd = day.toString().padStart(2, '0');
                const thisDate = `${currentYear}/${mm}/${dd}`;
                const isSelected = value === thisDate;
                
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-8 w-full flex items-center justify-center rounded-lg text-xs font-mono transition-all
                      ${isSelected 
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' 
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }
                    `}
                  >
                    {day.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
            
            {/* Today Action (Optional) */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button 
                type="button"
                onClick={() => {
                  const today = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
                  // تبدیل اعداد فارسی به انگلیسی برای استاندارد پرایزما
                  const enToday = today.replace(/[۰-۹]/g, c => '0123456789'[c.charCodeAt(0) - 1776]);
                  onChange(enToday);
                  setIsOpen(false);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                برو به امروز
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
