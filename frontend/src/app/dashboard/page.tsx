'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  User,
  ArrowRight,
  Check
} from 'lucide-react';

export default function DashboardOverview() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerCompany, setQuickCustomerCompany] = useState('');
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [quickError, setQuickError] = useState('');

  // 1. Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'overview'],
    queryFn: () => apiFetch('/tasks'),
  });

  // 2. Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', 'overview'],
    queryFn: () => apiFetch('/customers?limit=5'),
  });

  // 3. Fetch analytics summary (only for leader/manager roles)
  const isLeaderOrManager = user?.role === 'leader' || user?.role === 'manager';
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiFetch('/analytics'),
    enabled: isLeaderOrManager,
  });

  const quickCreateMutation = useMutation({
    mutationFn: (newCust: { name: string; company: string; status: string }) => 
      apiFetch('/customers', { method: 'POST', bodyData: newCust }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setQuickCustomerName('');
      setQuickCustomerCompany('');
      setIsCreatingQuick(false);
    },
    onError: (err: any) => {
      setQuickError(err.message || 'Failed to create customer');
    }
  });

  const handleQuickCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError('');
    if (!quickCustomerName) return;
    quickCreateMutation.mutate({
      name: quickCustomerName,
      company: quickCustomerCompany,
      status: 'lead'
    });
  };

  const toggleTaskMutation = useMutation({
    mutationFn: (task: { id: string; status: string }) =>
      apiFetch(`/tasks/${task.id}`, { method: 'PATCH', bodyData: { status: task.status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleToggleTask = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    toggleTaskMutation.mutate({ id, status: nextStatus });
  };

  const tasks = tasksData?.tasks || [];
  const customers = customersData?.customers || [];
  const summary = analyticsData?.summary || null;

  // Filter tasks
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayTasks = tasks.filter((t: any) => {
    const due = new Date(t.dueDate);
    return due >= startOfToday && due <= endOfToday && t.status !== 'completed';
  });

  const upcomingTasks = tasks.filter((t: any) => {
    const due = new Date(t.dueDate);
    return due > endOfToday && t.status !== 'completed';
  });

  const overdueTasks = tasks.filter((t: any) => {
    const due = new Date(t.dueDate);
    return due < startOfToday && t.status === 'pending';
  });

  // Stagger entry configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 select-none text-left">
      {/* Greetings banner */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Hello, {user?.name}</h2>
        <p className="text-muted text-sm mt-0.5">Here is an overview of your workspace actions and checklists today.</p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLeaderOrManager && summary ? (
          <>
            <motion.div 
              whileHover={{ y: -3 }}
              className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Customers</span>
                <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">{summary.totalCustomers}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/5 border border-sky-500/10 flex items-center justify-center text-sky-600">
                <Users className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -3 }}
              className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Active Leads</span>
                <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">{summary.activeLeads}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-center text-yellow-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -3 }}
              className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Deals Won</span>
                <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">{summary.wonDeals}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -3 }}
              className="p-5 rounded-xl border border-border bg-card flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Conversion Rate</span>
                <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">{summary.conversionRate}%</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </motion.div>
          </>
        ) : (
          <div className="p-5 rounded-xl border border-border bg-card flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-4 shadow-sm">
            <div>
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Your Dashboard Role</span>
              <div className="text-xl font-bold text-sky-600 mt-1 uppercase tracking-wider">{user?.role}</div>
            </div>
            <div className="text-xs text-muted max-w-md leading-relaxed text-right">
              As a team member, you have access to customers assigned to you and team channels. Leaders retain central organization administration and analytics visibility.
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-sky-600" /> Task checklists
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Widget: Today's Tasks */}
            <div className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between h-56 shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" /> Today
                </h4>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="mt-4 space-y-2 overflow-y-auto max-h-32 no-scrollbar"
                >
                  {todayTasks.length === 0 ? (
                    <div className="text-[11px] text-muted py-4">No tasks due today</div>
                  ) : (
                    todayTasks.map((t: any) => (
                      <motion.div 
                        variants={itemVariants}
                        key={t._id} 
                        className="flex items-start gap-2 group cursor-pointer" 
                        onClick={() => handleToggleTask(t._id, t.status)}
                      >
                        <div className="w-3.5 h-3.5 rounded border border-slate-300 flex items-center justify-center mt-0.5 group-hover:border-sky-500 shrink-0 bg-background">
                          <Check className="w-2.5 h-2.5 text-sky-600 opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-[11px] text-muted group-hover:text-foreground line-clamp-1 transition-colors">{t.title}</span>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
              <Link href="/dashboard/tasks" className="text-[10px] text-sky-600 hover:text-sky-500 font-bold flex items-center gap-1 mt-3">
                View all tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Widget: Upcoming Tasks */}
            <div className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between h-56 shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" /> Upcoming
                </h4>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="mt-4 space-y-2 overflow-y-auto max-h-32 no-scrollbar"
                >
                  {upcomingTasks.length === 0 ? (
                    <div className="text-[11px] text-muted py-4">No upcoming tasks</div>
                  ) : (
                    upcomingTasks.map((t: any) => (
                      <motion.div 
                        variants={itemVariants}
                        key={t._id} 
                        className="flex items-start gap-2 group cursor-pointer" 
                        onClick={() => handleToggleTask(t._id, t.status)}
                      >
                        <div className="w-3.5 h-3.5 rounded border border-slate-300 flex items-center justify-center mt-0.5 group-hover:border-sky-500 shrink-0 bg-background">
                          <Check className="w-2.5 h-2.5 text-sky-600 opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-[11px] text-muted group-hover:text-foreground line-clamp-1 transition-colors">{t.title}</span>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
              <Link href="/dashboard/tasks" className="text-[10px] text-sky-600 hover:text-sky-500 font-bold flex items-center gap-1 mt-3">
                View all tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Widget: Overdue Tasks */}
            <div className="p-5 rounded-xl border border-red-200 bg-card flex flex-col justify-between h-56 shadow-sm shadow-red-100">
              <div>
                <h4 className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Overdue
                </h4>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="mt-4 space-y-2 overflow-y-auto max-h-32 no-scrollbar"
                >
                  {overdueTasks.length === 0 ? (
                    <div className="text-[11px] text-muted py-4">No overdue tasks</div>
                  ) : (
                    overdueTasks.map((t: any) => (
                      <motion.div 
                        variants={itemVariants}
                        key={t._id} 
                        className="flex items-start gap-2 group cursor-pointer" 
                        onClick={() => handleToggleTask(t._id, t.status)}
                      >
                        <div className="w-3.5 h-3.5 rounded border border-red-300 flex items-center justify-center mt-0.5 group-hover:border-red-500 shrink-0 bg-background">
                          <Check className="w-2.5 h-2.5 text-red-500 opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-[11px] text-red-500 font-bold line-clamp-1 transition-colors">{t.title}</span>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
              <Link href="/dashboard/tasks" className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1 mt-3">
                View all tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Customers view */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recently Added Customers</h4>
              <Link href="/dashboard/customers" className="text-[10px] text-sky-600 hover:text-sky-500 font-bold flex items-center gap-1">
                View Directory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {customersLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted">No customer records found.</div>
              ) : (
                customers.map((c: any) => (
                  <div key={c._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground hover:underline cursor-pointer">
                        <Link href={`/dashboard/customers?id=${c._id}`}>{c.name}</Link>
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">{c.company || 'Private Customer'}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-background border border-border text-muted font-medium capitalize">
                        {c.status}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick actions */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-sky-600" /> Quick Actions
          </h3>

          {/* Quick Lead Form */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1">
              Add New Lead
            </h4>
            
            {quickError && <div className="text-[10px] text-red-500 mb-3 font-semibold">{quickError}</div>}

            <form onSubmit={handleQuickCreateSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Lead name"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Company name (optional)"
                  value={quickCustomerCompany}
                  onChange={(e) => setQuickCustomerCompany(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={quickCreateMutation.isPending || !quickCustomerName}
                className="w-full h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-md shadow-sky-600/10 cursor-pointer"
              >
                {quickCreateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    Create Customer <Plus className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Guidelines widget */}
          <div className="p-5 rounded-xl border border-border bg-card text-xs leading-relaxed text-muted shadow-sm">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Workspace Guidelines</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li>Keep Pipeline stages up to date. Drag cards on the Kanban board.</li>
              <li>Toggle task boxes to complete tasks.</li>
              <li>Coordinate with teammates inside client chat channels.</li>
              <li>Attach PDFs or invoices directly to customer profiles.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
