'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Loader2,
  Calendar,
  AlertTriangle,
  Users,
  User,
  X,
  Trash2,
  Check
} from 'lucide-react';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('task');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [createError, setCreateError] = useState('');

  // 1. Fetch Tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeTab],
    queryFn: () => apiFetch(`/tasks${activeTab !== 'all' ? `?status=${activeTab}` : ''}`),
  });

  // 2. Fetch Team Members
  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => apiFetch('/org/members'),
  });

  // 3. Fetch Customers
  const { data: customersData } = useQuery({
    queryKey: ['customers', 'tasks-link'],
    queryFn: () => apiFetch('/customers?limit=100'),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newTask: any) => apiFetch('/tasks', { method: 'POST', bodyData: newTask }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create task');
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (task: { id: string; status: string }) =>
      apiFetch(`/tasks/${task.id}`, { method: 'PATCH', bodyData: { status: task.status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('task');
    setDueDate('');
    setPriority('medium');
    setAssignedMemberId(user?.id || '');
    setCustomerId('');
    setCreateError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!title || !dueDate || !assignedMemberId) {
      setCreateError('Please fill in title, due date, and assignee.');
      return;
    }

    createMutation.mutate({
      title,
      description: description || undefined,
      type,
      dueDate,
      priority,
      assignedMemberId,
      customerId: customerId || undefined,
    });
  };

  const handleToggleTask = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    toggleTaskMutation.mutate({ id, status: nextStatus });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const tasks = tasksData?.tasks || [];
  const members = membersData?.members || [];
  const customers = customersData?.customers || [];

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tasks Tracker</h2>
          <p className="text-xs text-muted mt-0.5">Manage follow-ups, client conferences, and general activities.</p>
        </div>

        {user?.role !== 'viewer' && (
          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        )}
      </div>

      {/* Tabs list with sliding indicator */}
      <div className="flex border-b border-border gap-6 text-sm font-semibold relative select-none">
        {['pending', 'completed', 'all'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 transition-colors relative capitalize ${
                isActive ? 'text-sky-600 font-bold' : 'text-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTaskTabIndicator"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {tab === 'pending' ? 'Pending Tasks' : tab}
            </button>
          );
        })}
      </div>

      {/* Tasks checklist panel */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-sm">
        {tasksLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-sky-500 animate-spin mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-muted text-xs">
            No tasks listed under this filter.
          </div>
        ) : (
          tasks.map((task: any) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending';

            return (
              <div
                key={task._id}
                className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status checkbox with bounce trigger */}
                  <motion.button
                    disabled={user?.role === 'viewer'}
                    onClick={() => handleToggleTask(task._id, task.status)}
                    whileTap={{ scale: 0.9 }}
                    className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-colors cursor-pointer ${
                      isCompleted 
                        ? 'bg-sky-600 border-sky-600 text-white' 
                        : isOverdue 
                        ? 'border-red-500 bg-red-500/5 text-red-500' 
                        : 'border-slate-300 bg-background hover:border-sky-500'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </motion.button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold leading-none ${isCompleted ? 'text-slate-400 line-through' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                      {/* Priority tag */}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        task.priority === 'high' 
                          ? 'bg-red-500/10 text-red-600' 
                          : task.priority === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {task.priority}
                      </span>
                      {/* Type tag */}
                      <span className="flex items-center gap-1 text-[9px] text-muted font-medium capitalize">
                        {task.type}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-muted mt-1.5 leading-relaxed max-w-xl">{task.description}</p>
                    )}

                    {/* Metadata indicators */}
                    <div className="flex items-center gap-4 text-[9px] text-muted mt-2.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted shrink-0" /> Due: {new Date(task.dueDate).toLocaleString()}
                        {isOverdue && <span className="text-red-500 font-bold ml-1 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> OVERDUE</span>}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted shrink-0" /> Assigned: {task.assignedMemberId?.name || 'Unassigned'}
                      </span>
                      {task.customerId && (
                        <span className="flex items-center gap-1">
                          Link: <span className="text-sky-600 underline font-semibold">{task.customerId.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {user?.role !== 'viewer' && (
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-white border border-transparent hover:border-red-100 text-red-500 shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-slate-900 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-card border border-border rounded-xl shadow-2xl p-6 z-50"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Create Action Task</h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-7 h-7 rounded-md hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && <div className="text-xs text-red-500 mb-3 font-semibold">{createError}</div>}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Task Title *</label>
                  <input
                    type="text"
                    placeholder="Follow up on pricing invoice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Description</label>
                  <textarea
                    placeholder="Provide meeting logs, follow up scripts or specific action steps..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-16 p-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none capitalize"
                    >
                      <option value="task">General Task</option>
                      <option value="followup">Follow-up Call</option>
                      <option value="meeting">Team Meeting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none capitalize"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Due Date *</label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Assignee *</label>
                    <select
                      value={assignedMemberId}
                      onChange={(e) => setAssignedMemberId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Member</option>
                      {members.map((m: any) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Link Customer (Optional)</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">Unlinked</option>
                    {customers.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.company || 'Private'})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="h-9 px-4 rounded-lg bg-transparent hover:bg-slate-50 text-muted text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
