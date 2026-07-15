import React from 'react';

export interface RoleDetails {
  code: string;
  label: string;
  colors: string;
}

export const getRoleBadgeDetails = (role: string): RoleDetails => {
  const r = String(role || '').trim().toUpperCase();

  if (r === 'API') {
    return {
      code: 'API',
      label: 'ماده مؤثره',
      colors: 'bg-blue-50 text-blue-700 border-blue-200/60'
    };
  } else if (r === 'INT') {
    return {
      code: 'INT',
      label: 'حدواسط',
      colors: 'bg-purple-50 text-purple-700 border-purple-200/60'
    };
  } else if (r === 'REA') {
    return {
      code: 'REA',
      label: 'واکنشگر',
      colors: 'bg-orange-50 text-orange-700 border-orange-200/60'
    };
  } else if (r === 'SOL') {
    return {
      code: 'SOL',
      label: 'حلال',
      colors: 'bg-cyan-50 text-cyan-700 border-cyan-200/60'
    };
  } else if (r === 'EXCIPIENT' || r === 'EXP') {
    return {
      code: 'EXP',
      label: 'ماده کمکی',
      colors: 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    };
  } else {
    return {
      code: r || 'API',
      label: r || 'ماده مؤثره',
      colors: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }
};

interface MaterialRoleBadgeProps {
  role: string;
  className?: string;
}

export const MaterialRoleBadge: React.FC<MaterialRoleBadgeProps> = ({ role, className = '' }) => {
  const details = getRoleBadgeDetails(role);

  return (
    <span 
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full border text-xs font-bold font-sans ${details.colors} ${className}`}
      title={`نقش کالا: ${details.label}`}
      dir="ltr"
    >
      {details.code}
    </span>
  );
};
