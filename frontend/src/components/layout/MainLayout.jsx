import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useNotificationStore } from '../../store/notificationStore';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const store = useNotificationStore.getState();
    store.fetchUnreadCount();
    store.fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-surface-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className={`
          transition-all duration-300 ease-out
          ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-68'}
        `}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main className="p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}
