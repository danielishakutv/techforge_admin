import { useState } from 'react';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';

export default function AdminLayout({ children, pageTitle }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SidebarNav />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <SidebarNav embedded onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="md:ml-64">
        <TopBar pageTitle={pageTitle} onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
