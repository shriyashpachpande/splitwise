import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const AppShell = ({
  children,
  title,
  onOpenAddExpense,
  onOpenCreateGroup
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Component (Desktop Fixed + Mobile Drawer) */}
      <Sidebar
        onOpenCreateGroup={onOpenCreateGroup}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area (Offset by fixed sidebar on desktop) */}
      <div className={`flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <TopBar
          title={title}
          onOpenAddExpense={onOpenAddExpense}
          onOpenCreateGroup={onOpenCreateGroup}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenAddExpense={onOpenAddExpense} />
    </div>
  );
};
