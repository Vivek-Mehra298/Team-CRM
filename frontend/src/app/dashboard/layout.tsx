'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore, NotificationItem } from '../../store/notificationStore';
import { apiFetch } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Layers,
  CheckSquare,
  Users2,
  MessageSquare,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Search,
  X,
  ShieldAlert,
  Loader2,
  Check,
  CheckCheck,
  Menu
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const { notifications, unreadCount, setNotifications, addNotification, markAsRead, markAllAsRead } = useNotificationStore();

  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load user profile & notification center on mount
  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.push('/login');
      return;
    }

    const loadWorkspace = async () => {
      try {
        const notifData = await apiFetch('/notifications');
        setNotifications(notifData.notifications, notifData.unreadCount);
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      }
    };

    loadWorkspace();
  }, [token, router, setNotifications]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Customers', path: '/dashboard/customers', icon: <Users className="w-4 h-4" /> },
    { name: 'Pipeline', path: '/dashboard/pipeline', icon: <Layers className="w-4 h-4" /> },
    { name: 'Tasks', path: '/dashboard/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { name: 'Team', path: '/dashboard/team', icon: <Users2 className="w-4 h-4" />, roles: ['leader', 'manager'] },
    { name: 'Chat', path: '/dashboard/chat', icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 className="w-4 h-4" />, roles: ['leader', 'manager'] },
    { name: 'Audit Logs', path: '/dashboard/audit-logs', icon: <History className="w-4 h-4" />, roles: ['leader', 'manager'] },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      logout();
      router.push('/login');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      markAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      markAllAsRead();
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* 1. Sidebar Nav */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? '64px' : '240px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col border-r border-border bg-card select-none relative z-20 shrink-0"
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-border flex items-center px-4 justify-between overflow-hidden">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base tracking-tight text-foreground whitespace-nowrap">
              <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-black font-extrabold text-xs shadow-sm shadow-sky-500/10">
                T
              </div>
              Team<span className="text-sky-600">CRM</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-7 h-7 rounded bg-sky-500 flex items-center justify-center text-black font-extrabold text-sm mx-auto shadow-sm shadow-sky-500/10">
              T
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto no-scrollbar relative">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user.role)) return null;

            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path}>
                <div
                  className={`flex items-center h-10 px-3 rounded-lg text-sm font-medium transition-colors gap-3 relative group ${
                    isActive ? 'text-sky-600 font-bold' : 'text-muted hover:text-foreground hover:bg-slate-50'
                  }`}
                >
                  {/* Sliding active pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute inset-0 bg-sky-500/10 rounded-lg border-l-2 border-sky-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <div className={`shrink-0 z-10 ${isActive ? 'text-sky-600' : 'text-muted group-hover:text-foreground'}`}>{item.icon}</div>
                  {!sidebarCollapsed && <span className="z-10 whitespace-nowrap">{item.name}</span>}
                  
                  {sidebarCollapsed && (
                    <div className="absolute left-16 hidden group-hover:block px-2.5 py-1.5 rounded-md bg-card border border-border text-xs font-semibold text-foreground whitespace-nowrap shadow-xl z-50">
                      {item.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border flex justify-end">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full h-8 rounded-md bg-background hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* 2. Main content container */}
      <div className="flex-grow flex flex-col min-w-0 relative">
        {/* Header bar */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-border bg-background text-muted hover:text-foreground md:hidden hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider bg-background px-3 py-1.5 rounded-lg border border-border truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
              {user.orgId ? (user.orgId as any).name || 'Org Space' : 'Organization Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search command */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-36 h-9 px-3 rounded-lg bg-background border border-border hover:border-slate-300 flex items-center justify-between text-xs text-muted font-medium transition-all"
            >
              <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-muted" /> Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px] text-muted">Ctrl+K</kbd>
            </button>

            {/* Notification bell */}
            <button
              onClick={() => setNotificationOpen(true)}
              className="w-9 h-9 rounded-lg bg-background hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-500 rounded-full border border-card" />
              )}
            </button>

            {/* User profile avatar */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-lg bg-background hover:bg-slate-50 border border-border flex items-center justify-center font-bold text-xs text-sky-600 tracking-tight transition-colors"
              >
                {getInitials(user.name)}
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <div className="text-xs font-bold text-foreground truncate">{user.name}</div>
                      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold mt-0.5">{user.role}</div>
                      <div className="text-[10px] text-muted truncate mt-0.5">{user.email}</div>
                    </div>
                    
                    {!user.isVerified && (
                      <div className="p-2 mb-1 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-red-600 flex items-start gap-1.5 leading-tight">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Email not verified. Check logs for mock link.</span>
                      </div>
                    )}

                    <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}>
                      <div className="flex items-center gap-2 h-9 px-3 rounded-lg text-xs text-muted hover:text-foreground hover:bg-slate-50 transition-colors cursor-pointer">
                        <Settings className="w-3.5 h-3.5" /> Account Settings
                      </div>
                    </Link>
                    
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 h-9 px-3 rounded-lg text-xs text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content panel */}
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-0">
          {children}
        </main>
      </div>

      {/* 3. Notification center Drawer */}
      <AnimatePresence>
        {notificationOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationOpen(false)}
              className="fixed inset-0 bg-slate-900 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 p-6 flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-600" /> Notifications
                  </h3>
                  <button
                    onClick={() => setNotificationOpen(false)}
                    className="w-7 h-7 rounded-md hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="w-full text-left text-xs text-sky-600 hover:text-sky-500 font-semibold mb-4 border-b border-border pb-3"
                  >
                    Mark all as read
                  </button>
                )}

                <div className="space-y-3 overflow-y-auto max-h-[70vh] no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && handleMarkRead(n._id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors relative group ${
                          n.isRead
                            ? 'bg-background border-border text-foreground'
                            : 'bg-sky-500/5 border-sky-500/20 text-foreground shadow-sm shadow-sky-500/5'
                        }`}
                      >
                        <div className="text-xs font-bold flex justify-between items-center">
                          {n.title}
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted mt-1 leading-relaxed">{n.message}</div>
                        <div className="text-[9px] text-gray-400 mt-2 font-mono">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[10px] text-muted text-center border-t border-border pt-4 font-mono">
                TeamCRM Notifications Center
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Command Palette Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-slate-900 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-0 top-[15%] mx-auto w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-4 z-50"
            >
              <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
                <Search className="w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search customers, pipeline status, settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow bg-transparent text-sm text-foreground placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="px-1.5 py-0.5 rounded bg-background border border-border text-[9px] text-muted font-mono"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto no-scrollbar">
                <div className="text-[10px] uppercase font-bold text-muted px-2 mb-2 tracking-wider">Quick Actions</div>
                <div className="space-y-1">
                  <div 
                    onClick={() => { setIsSearchOpen(false); router.push('/dashboard/customers?action=create'); }}
                    className="flex items-center justify-between h-9 px-3 rounded-lg text-xs text-muted hover:text-foreground hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <span>Create new Customer record</span>
                    <span className="text-[10px] text-gray-400">/customers</span>
                  </div>
                  <div 
                    onClick={() => { setIsSearchOpen(false); router.push('/dashboard/pipeline'); }}
                    className="flex items-center justify-between h-9 px-3 rounded-lg text-xs text-muted hover:text-foreground hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <span>View Kanban Pipeline stages</span>
                    <span className="text-[10px] text-gray-400">/pipeline</span>
                  </div>
                  <div 
                    onClick={() => { setIsSearchOpen(false); router.push('/dashboard/chat'); }}
                    className="flex items-center justify-between h-9 px-3 rounded-lg text-xs text-muted hover:text-foreground hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <span>Open Slack team chatroom</span>
                    <span className="text-[10px] text-gray-400">/chat</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 p-4 flex flex-col justify-between shadow-2xl md:hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base tracking-tight text-foreground" onClick={() => setMobileSidebarOpen(false)}>
                    <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-black font-extrabold text-xs shadow-sm shadow-sky-500/10">
                      T
                    </div>
                    Team<span className="text-sky-600">CRM</span>
                  </Link>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="w-7 h-7 rounded-md hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1 overflow-y-auto no-scrollbar max-h-[75vh]">
                  {navItems.map((item) => {
                    if (item.roles && !item.roles.includes(user.role)) return null;

                    const isActive = pathname === item.path;
                    return (
                      <Link key={item.name} href={item.path} onClick={() => setMobileSidebarOpen(false)}>
                        <div
                          className={`flex items-center h-10 px-3 rounded-lg text-sm font-medium transition-colors gap-3 relative group ${
                            isActive ? 'text-sky-600 font-bold bg-sky-500/10 border-l-2 border-sky-600' : 'text-muted hover:text-foreground hover:bg-slate-50'
                          }`}
                        >
                          <div className={`shrink-0 ${isActive ? 'text-sky-600' : 'text-muted'}`}>{item.icon}</div>
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-border pt-4 text-[10px] text-muted text-center font-mono">
                TeamCRM Mobile Navigation
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
