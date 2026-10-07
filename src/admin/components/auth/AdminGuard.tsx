import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  LogOut,
  Film,
  KeyRound,
  CheckCircle2,
  Loader2,
  Mail,
  AlertTriangle
} from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const {
    isLoggedIn,
    isLoading,
    isAdmin,
    user,
    profile,
    role,
    signInAdmin,
    signOutUser,
    authError,
    setAuthError
  } = useAuth();

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If local development without Supabase credentials configured yet
  const configured = isSupabaseConfigured();

  // State 1: Verifying session
  if (configured && isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 animate-pulse">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-['Cinzel',serif]">
              ChitroKatha Admin Console
            </h3>
            <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>Verifying administrative session & database permissions...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: No authenticated session when Supabase is configured
  if (configured && !isLoggedIn) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await signInAdmin(adminEmail, adminPassword);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#07090e] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-[#0d0f15]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Cinzel',serif]">
                Admin Authentication
              </h2>
              <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">
                ChitroKatha Management Console
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
            Please sign in with your administrative credentials. Role permissions will be checked against the database.
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin Email</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@chitrokatha.com"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Authenticate & Access Console</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/');
                window.location.href = '/';
              }}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Site</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // State 5 & State 6: User is logged in, but their role is not admin/super_admin or their account is suspended/inactive
  if (configured && isLoggedIn && !isAdmin) {
    const isInactive = profile?.status === 'suspended' || user?.status === 'banned';

    return (
      <div className="min-h-screen bg-[#07090e] text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0d0f15] border border-rose-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white font-['Cinzel',serif]">
              {isInactive ? 'Account Inactive / Suspended (অ্যাকাউন্ট নিষ্ক্রিয়)' : 'Access Denied (অননুমোদিত অ্যাক্সেস)'}
            </h2>
            <p className="text-xs text-rose-400 font-semibold mt-1">
              {isInactive ? 'Administrative Account Suspended' : 'Admin Privileges Required'}
            </p>
          </div>

          <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 text-xs text-zinc-400 leading-relaxed text-left space-y-1.5">
            <p>
              Signed in as: <strong className="text-white">{user?.email}</strong>
            </p>
            <p>
              Current Role: <span className="font-mono text-amber-400 uppercase font-bold">{role}</span>
            </p>
            <p>
              Account Status: <span className="font-mono text-rose-400 uppercase font-bold">{profile?.status || user?.status || 'inactive'}</span>
            </p>
            <p className="text-[11px] text-zinc-500 pt-1">
              {isInactive
                ? 'Your administrative account has been deactivated or suspended in the database.'
                : 'Your account does not possess admin or super_admin permissions in the database.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/');
                window.location.href = '/';
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Streaming Site</span>
            </a>

            <button
              onClick={() => signOutUser()}
              className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If local development without Supabase keys, or user is verified admin:
  return (
    <>
      {!configured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Local Admin Preview Mode:</strong> Connect live Supabase in <code>.env.local</code> to enforce PostgreSQL Row Level Security & RBAC.
          </span>
        </div>
      )}
      {children}
    </>
  );
};
