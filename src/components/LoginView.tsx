import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
// @ts-ignore
import temadLogo from '../assets/logo.png';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }

    setLoading(true);
    setError('');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Invalid username or password.');
        }
        return data;
      })
      .then((data) => {
        if (data.token && data.user) {
          localStorage.setItem('app_jwt_token', data.token);
          onLogin(data.user);
        } else {
          throw new Error('Authentication system returned an invalid response.');
        }
      })
      .catch((err) => {
        console.error("Login verification failed:", err);
        setError(err.message || 'Error connecting to the authentication server.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="ltr">
      {/* Background subtle ambient highlights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main modern card container */}
      <div className="relative z-10 bg-white border border-slate-200/80 rounded-2xl p-8 max-w-md w-full shadow-xl fade-in text-left">
         <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-slate-50 border border-slate-200/60 mb-4 shadow-2xs">
               <img src={temadLogo} alt="Logo" className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-1.5 tracking-tight">Vendor Management System</h1>
            <p className="text-cyan-600 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Supplier Portal</span>
            </p>
         </div>

         <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs leading-relaxed flex items-start gap-2.5 animate-shake">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
               <label className="block text-xs font-bold text-slate-700">Username</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                   <UserIcon className="w-4 h-4" />
                 </div>
                 <input 
                   id="username_input"
                   type="text" 
                   disabled={loading}
                   value={username} 
                   onChange={e=>setUsername(e.target.value)} 
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 text-left font-mono text-sm disabled:opacity-50 transition-all" 
                   placeholder="e.g., admin, qa"
                   dir="ltr" 
                 />
               </div>
            </div>

            <div className="space-y-1.5">
               <label className="block text-xs font-bold text-slate-700">Password</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                   <Lock className="w-4 h-4" />
                 </div>
                 <input 
                   id="password_input"
                   type={showPassword ? "text" : "password"} 
                   disabled={loading}
                   value={password} 
                   onChange={e=>setPassword(e.target.value)} 
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 text-left font-mono text-sm disabled:opacity-50 transition-all" 
                   placeholder="Enter your password"
                   dir="ltr" 
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                 >
                   {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 </button>
               </div>
            </div>

            <button 
              id="login_submit_btn"
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-cyan-600/10 transition-all duration-200 mt-6 text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
               {loading ? (
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Verifying Credentials...</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-2">
                   <span>Sign In to Portal</span>
                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </div>
               )}
            </button>
         </form>

         <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-mono">Secured Enterprise System • Role-Based Control</p>
         </div>
      </div>
    </div>
  );
}

