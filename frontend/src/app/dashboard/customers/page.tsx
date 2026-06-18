'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, API_URL } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  FileText,
  Paperclip,
  Trash2,
  Tag,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileDown
} from 'lucide-react';

const STATUS_OPTIONS = [
  'lead',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'won',
  'lost'
];

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [status, setStatus] = useState('lead');
  const [createError, setCreateError] = useState('');

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Auto-select query ID if present in URL
  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setSelectedCustomerId(urlId);
    }
    const createAction = searchParams.get('action');
    if (createAction === 'create') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // 1. Fetch Customers
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['customers', page, search, statusFilter, assignedFilter, tagFilter],
    queryFn: () => 
      apiFetch(
        `/customers?page=${page}&limit=10&search=${search}&status=${statusFilter}&assignedMemberId=${assignedFilter}&tag=${tagFilter}`
      ),
  });

  // 2. Fetch Team Members
  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => apiFetch('/org/members'),
  });

  // 3. Fetch Single Customer Detail
  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['customer-detail', selectedCustomerId],
    queryFn: () => apiFetch(`/customers/${selectedCustomerId}`),
    enabled: !!selectedCustomerId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newCust: any) => apiFetch('/customers', { method: 'POST', bodyData: newCust }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create customer');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: any }) =>
      apiFetch(`/customers/${args.id}`, { method: 'PATCH', bodyData: args.payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomerId(null);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: (args: { id: string; formData: FormData }) =>
      apiFetch(`/customers/${args.id}/files`, {
        method: 'POST',
        bodyData: args.formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      setUploading(false);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'File upload failed.');
      setUploading(false);
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (args: { custId: string; fileId: string }) =>
      apiFetch(`/customers/${args.custId}/files/${args.fileId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
    }
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAddress('');
    setNotes('');
    setTagsInput('');
    setAssignedMemberId('');
    setStatus('lead');
    setCreateError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!name) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    createMutation.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      address: address || undefined,
      notes: notes || undefined,
      tags,
      assignedMemberId: assignedMemberId || undefined,
      status
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomerId) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    uploadMutation.mutate({ id: selectedCustomerId, formData });
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this customer? This will also remove all uploaded files.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedCustomerId) return;
    updateMutation.mutate({ id: selectedCustomerId, payload: { status } });
  };

  const handleUpdateAssignment = (assignedMemberId: string) => {
    if (!selectedCustomerId) return;
    updateMutation.mutate({
      id: selectedCustomerId,
      payload: { assignedMemberId: assignedMemberId || null }
    });
  };

  const customers = listData?.customers || [];
  const pagination = listData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  const members = membersData?.members || [];
  const customerDetail = detailsData?.customer || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Customers Directory</h2>
          <p className="text-xs text-muted mt-0.5">Maintain and manage contact listings for all company accounts.</p>
        </div>

        {user?.role !== 'viewer' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        )}
      </div>

      {/* Directory Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search name, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="capitalize">{opt.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <select
            value={assignedFilter}
            onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m: any) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="relative">
          <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Grid: Listings Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-background/50 text-muted font-bold">
                <th className="p-4">Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Assigned Member</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tags</th>
                <th className="p-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-6 h-6 text-sky-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted">
                    No customers found matching the parameters.
                  </td>
                </tr>
              ) : (
                customers.map((cust: any) => (
                  <tr
                    key={cust._id}
                    onClick={() => setSelectedCustomerId(cust._id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-foreground">{cust.name}</td>
                    <td className="p-4 text-slate-600">{cust.company || '—'}</td>
                    <td className="p-4 text-muted">
                      {cust.assignedMemberId ? (
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted" /> {cust.assignedMemberId.name}</span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                        cust.status === 'won'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                          : cust.status === 'lost'
                          ? 'bg-red-500/10 border-red-500/20 text-red-600'
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-600'
                      }`}>
                        {cust.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {cust.tags.length > 0 ? (
                          cust.tags.map((tag: string) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded bg-background border border-border text-[9px] text-muted">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right text-muted font-mono">
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="h-12 border-t border-border px-6 flex items-center justify-between text-xs text-muted select-none">
            <span>
              Showing Page <b>{pagination.page}</b> of <b>{pagination.pages}</b> (Total {pagination.total})
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded bg-background hover:bg-slate-50 border border-border flex items-center justify-center disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="w-7 h-7 rounded bg-background hover:bg-slate-50 border border-border flex items-center justify-center disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer details */}
      <AnimatePresence>
        {selectedCustomerId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomerId(null)}
              className="fixed inset-0 bg-slate-900 z-30"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[450px] bg-card border-l border-border z-40 p-6 overflow-y-auto no-scrollbar flex flex-col justify-between shadow-2xl"
            >
              {detailsLoading || !customerDetail ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                  <span className="text-xs text-muted">Loading details...</span>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  {/* Title info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-foreground">{customerDetail.name}</h3>
                      <p className="text-xs text-muted">{customerDetail.company || 'Private Customer'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomerId(null)}
                      className="w-7 h-7 rounded-md hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stage/assignee select */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-background/50">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Pipeline Stage</label>
                      <select
                        value={customerDetail.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={user?.role === 'viewer'}
                        className="w-full h-8 px-2 rounded border border-border bg-card text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all capitalize"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Assigned Member</label>
                      <select
                        value={customerDetail.assignedMemberId?._id || ''}
                        onChange={(e) => handleUpdateAssignment(e.target.value)}
                        disabled={user?.role === 'viewer'}
                        className="w-full h-8 px-2 rounded border border-border bg-card text-foreground text-xs focus:border-sky-500 focus:outline-none transition-all"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m: any) => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Profile parameters */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted border-b border-border pb-2">Profile Details</h4>
                    <div className="space-y-3 text-xs">
                      {customerDetail.email && (
                        <div className="flex items-center gap-3 text-slate-700">
                          <Mail className="w-4 h-4 text-muted shrink-0" />
                          <span>{customerDetail.email}</span>
                        </div>
                      )}
                      {customerDetail.phone && (
                        <div className="flex items-center gap-3 text-slate-700">
                          <Phone className="w-4 h-4 text-muted shrink-0" />
                          <span>{customerDetail.phone}</span>
                        </div>
                      )}
                      {customerDetail.address && (
                        <div className="flex items-center gap-3 text-slate-700">
                          <MapPin className="w-4 h-4 text-muted shrink-0" />
                          <span>{customerDetail.address}</span>
                        </div>
                      )}
                      {customerDetail.notes && (
                        <div className="mt-3 p-3 rounded-lg border border-border bg-background/30 text-muted leading-relaxed">
                          <div className="text-[10px] font-bold uppercase text-muted mb-1">Internal Notes</div>
                          {customerDetail.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents attachments */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted border-b border-border pb-2">File Attachments</h4>
                    
                    {user?.role !== 'viewer' && (
                      <div className="flex items-center gap-3">
                        <label className="h-8 px-3 rounded border border-border bg-background hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 text-xs text-slate-600 transition-colors font-semibold shadow-sm">
                          <Paperclip className="w-3.5 h-3.5" /> Attach Document
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                        </label>
                        {uploading && <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />}
                      </div>
                    )}
                    {uploadError && <div className="text-[10px] text-red-500 font-semibold">{uploadError}</div>}

                    {/* Files listing logs */}
                    <div className="space-y-2">
                      {customerDetail.files.length === 0 ? (
                        <div className="text-xs text-gray-400 italic py-2">No documents attached</div>
                      ) : (
                        customerDetail.files.map((file: any) => (
                          <div key={file._id} className="p-2.5 rounded-lg border border-border bg-background/40 flex items-center justify-between group">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-muted shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[11px] text-foreground truncate font-semibold">{file.name}</div>
                                <div className="text-[9px] text-muted mt-0.5">{(file.size / 1024).toFixed(0)} KB • {file.uploadedBy?.name || 'Rep'}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={`${API_URL}/files/download/${file.path.split(/[\\/]/).pop()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-muted hover:text-foreground border border-transparent"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </a>
                              {user?.role !== 'viewer' && (
                                <button
                                  onClick={() => deleteFileMutation.mutate({ custId: customerDetail._id, fileId: file._id })}
                                  className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center text-red-500 border border-transparent"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Purging */}
                  {(user?.role === 'leader' || user?.role === 'manager') && (
                    <div className="pt-4 border-t border-border flex justify-end">
                      <button
                        onClick={() => handleDeleteCustomer(customerDetail._id)}
                        className="h-8 px-3 rounded hover:bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Purge Customer Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl p-6 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Create Customer Profile</h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-7 h-7 rounded-md hover:bg-slate-50 border border-border flex items-center justify-center text-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && <div className="text-xs text-red-500 mb-3 font-semibold">{createError}</div>}

              <form onSubmit={handleCreateSubmit} className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-grow">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Delta Solutions"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="jane@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="123 Corporate Blvd, Suite 100"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Notes</label>
                  <textarea
                    placeholder="Add background context, negotiation progress, or client interest details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-20 p-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Assignment</label>
                    <select
                      value={assignedMemberId}
                      onChange={(e) => setAssignedMemberId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m: any) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none capitalize"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Enterprise, Tech, Hot Lead"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3 shrink-0">
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
                    {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Profile'}
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
