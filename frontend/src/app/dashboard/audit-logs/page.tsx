'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Info,
  UserCheck
} from 'lucide-react';

const ACTIONS_OPTIONS = [
  { value: '', label: 'All Operations' },
  { value: 'login', label: 'Log In' },
  { value: 'logout', label: 'Log Out' },
  { value: 'create_customer', label: 'Customer Creation' },
  { value: 'update_customer', label: 'Customer Updates' },
  { value: 'delete_customer', label: 'Customer Deletions' },
  { value: 'change_role', label: 'Role Changes' },
  { value: 'remove_member', label: 'Member Purges' }
];

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.03
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 }
  }
} as const;

export default function AuditLogsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [mounted, setMounted] = useState(false);

  // 1. Guard check: Only leader and manager roles can view
  useEffect(() => {
    setMounted(true);
    if (user && user.role !== 'leader' && user.role !== 'manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // 2. Fetch Audit Logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter],
    queryFn: () =>
      apiFetch(
        `/audit-logs?page=${page}&limit=20&search=${search}&action=${actionFilter}`
      ),
    enabled: mounted,
  });

  if (!mounted) return null;

  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination || { total: 0, page: 1, limit: 20, pages: 1 };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-left select-none"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <History className="w-5 h-5 text-sky-600" /> Security Audit Logs
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Chronological record of system security, profile modifications, and data actions.
        </p>
      </motion.div>

      {/* Filter Toolbar */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-card shadow-sm"
      >
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search details or operators..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Action filter */}
        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all"
          >
            {ACTIONS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 text-slate-500 font-bold">
                <th className="p-4 w-28">Action</th>
                <th className="p-4 w-44">Operator</th>
                <th className="p-4">Details</th>
                <th className="p-4 text-right w-48">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {logs.map((log: any, index: number) => {
                    const isCritical = ['delete_customer', 'remove_member', 'data_deletion'].includes(
                      log.action
                    );

                    return (
                      <motion.tr
                        key={log._id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.3) }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                              isCritical
                                ? 'bg-red-50 text-red-700 border border-red-200/50'
                                : log.action.includes('login')
                                ? 'bg-sky-50 text-sky-700 border border-sky-200/50'
                                : 'bg-slate-100 text-slate-600 border border-slate-200/40'
                            }`}
                          >
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center font-bold text-[8px] uppercase shrink-0">
                            {log.userName ? log.userName[0] : 'U'}
                          </div>
                          <span className="truncate">{log.userName}</span>
                        </td>
                        <td
                          className={`p-4 text-slate-600 font-medium ${
                            isCritical ? 'text-red-700' : ''
                          }`}
                        >
                          {log.details}
                        </td>
                        <td className="p-4 text-right text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="h-12 border-t border-border px-6 flex items-center justify-between text-xs text-slate-500 select-none">
            <span>
              Showing Page <b>{pagination.page}</b> of <b>{pagination.pages}</b> (Total{' '}
              {pagination.total})
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded bg-card hover:bg-slate-50 border border-border flex items-center justify-center disabled:opacity-30 disabled:hover:bg-card text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="w-7 h-7 rounded bg-card hover:bg-slate-50 border border-border flex items-center justify-center disabled:opacity-30 disabled:hover:bg-card text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

