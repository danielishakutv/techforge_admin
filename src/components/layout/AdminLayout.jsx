import SidebarNav from './SidebarNav';
import TopBar from './TopBar';

export default function AdminLayout({ children, pageTitle }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav />
      
      <div className="ml-64">
        <TopBar pageTitle={pageTitle} />
        
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
