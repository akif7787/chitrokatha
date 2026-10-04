import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminNavbar } from './AdminNavbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isSidebarCollapsed } = useAdmin();

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col antialiased selection:bg-rose-500 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Subtle Gradient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Persistent Left Sidebar */}
      <AdminSidebar />

      {/* Main Column */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <AdminNavbar />

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Minimal Admin Footer */}
        <footer className="px-6 py-4 border-t border-white/5 text-center text-xs text-zinc-500">
          <p>© 2026 ChitroKatha (চিত্রকথা) — Admin Management Console • Phase 1 UI Foundation</p>
        </footer>
      </div>
    </div>
  );
};
