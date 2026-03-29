"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";

const API = "http://localhost:5000/api/manager";

// Validate ISO 4217 currency code — fall back to USD if the stored value is a symbol
const VALID_CURRENCIES = new Set(Intl.supportedValuesOf("currency"));
const safeCurrency = (code: string) => (VALID_CURRENCIES.has(code) ? code : "USD");

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "PENDING" | "APPROVED" | "REJECTED" | "DRAFT" | "LOCKED";

interface ExpenseRequest {
  id: string;
  employee_name: string;
  employee_designation: string | null;
  expense_date: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  receipt_url: string | null;
  status: Status;
  created_at: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    PENDING:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    DRAFT:    "bg-slate-100 text-slate-500",
    LOCKED:   "bg-indigo-100 text-indigo-700 font-medium",
  };
  return (
    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── Action Modal ─────────────────────────────────────────────────────────────
interface ActionModalProps {
  request: ExpenseRequest;
  onClose: () => void;
  onAction: (id: string, action: "APPROVED" | "REJECTED", note: string) => Promise<void>;
}

function ActionModal({ request, onClose, onAction }: ActionModalProps) {
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [loading, setLoading] = useState(false);
  const isPending = request.status === "PENDING";

  const handleSubmit = async () => {
    if (!pendingAction) return;
    if (pendingAction === "REJECTED" && !note.trim()) {
      toast.error("A reason is required when rejecting.");
      return;
    }
    setLoading(true);
    await onAction(request.id, pendingAction, note);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-lowest p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-white overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold font-headline text-on-surface">
              {isPending ? "Review Request" : "Expense Details"}
            </h3>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Submitted by <span className="font-bold text-on-surface">{request.employee_name}</span>
              {request.employee_designation && (
                <span className="text-on-surface-variant"> · {request.employee_designation}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-error transition-colors material-symbols-outlined">close</button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 p-5 bg-surface-container-low rounded-2xl mb-5 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date of Expense</p>
            <p className="font-semibold text-on-surface">
              {new Date(request.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Amount</p>
            <p className="font-extrabold text-on-surface text-xl font-headline">
              {Number(request.amount).toLocaleString("en-US", { style: "currency", currency: safeCurrency(request.currency) })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Category</p>
            <p className="font-semibold text-on-surface">{request.category}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
            <StatusBadge status={request.status} />
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Description</p>
            <p className="font-medium text-on-surface-variant">{request.description}</p>
          </div>
        </div>

        {/* Receipt */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Receipt / Attachment</p>
          {request.receipt_url ? (
            <div className="relative rounded-2xl overflow-hidden border border-outline-variant/10 h-48">
              {request.receipt_url.startsWith("data:application/pdf") ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-3">
                  <span className="material-symbols-outlined text-5xl text-red-400">picture_as_pdf</span>
                  <a
                    href={request.receipt_url} target="_blank" rel="noopener noreferrer"
                    className="text-primary text-xs font-bold underline underline-offset-2"
                  >
                    Open PDF Receipt
                  </a>
                </div>
              ) : (
                <>
                  <img src={request.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
                  <a
                    href={request.receipt_url} target="_blank" rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-white transition flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span> Open
                  </a>
                </>
              )}
            </div>
          ) : (
            <div className="h-28 rounded-2xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="material-symbols-outlined">image_not_supported</span>
              <p className="text-xs font-medium">No receipt attached</p>
            </div>
          )}
        </div>

        {/* Actions — PENDING only */}
        {isPending && (
          <>
            {!pendingAction ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPendingAction("REJECTED")}
                  className="flex-1 py-3.5 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => setPendingAction("APPROVED")}
                  className="flex-1 py-3.5 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Approve
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${pendingAction === "APPROVED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {pendingAction === "APPROVED" ? "check_circle" : "cancel"}
                  </span>
                  {pendingAction === "APPROVED" ? "Approving this request" : "Rejecting this request"}
                  <button onClick={() => setPendingAction(null)} className="ml-auto text-[10px] underline font-medium opacity-70 hover:opacity-100">Change</button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {pendingAction === "APPROVED" ? "Note (Optional)" : "Reason for Rejection"}
                    {pendingAction === "REJECTED" && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={pendingAction === "APPROVED" ? "Add an optional comment..." : "Explain why this request is rejected..."}
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium min-h-[90px] resize-none"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-4 font-bold tracking-wide rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 ${
                    pendingAction === "APPROVED"
                      ? "bg-primary text-on-primary shadow-primary/20"
                      : "bg-red-600 text-white shadow-red-200"
                  }`}
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : `Confirm ${pendingAction === "APPROVED" ? "Approval" : "Rejection"}`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Analytics / Dashboard Tab ────────────────────────────────────────────────
function DashboardTab({ requests, user, loading }: { requests: ExpenseRequest[]; user: any; loading: boolean }) {
  const total    = requests.length;
  const pending  = requests.filter(r => r.status === "PENDING").length;
  const approved = requests.filter(r => r.status === "APPROVED").length;
  const rejected = requests.filter(r => r.status === "REJECTED").length;
  const totalAmount    = requests.reduce((s, r) => s + Number(r.amount), 0);
  const approvedAmount = requests.filter(r => r.status === "APPROVED").reduce((s, r) => s + Number(r.amount), 0);

  const stats = [
    { label: "Pending Review", value: pending,  icon: "inbox",        color: "text-amber-600", bg: "bg-amber-50"  },
    { label: "Approved",       value: approved, icon: "check_circle", color: "text-green-600", bg: "bg-green-50"  },
    { label: "Rejected",       value: rejected, icon: "cancel",       color: "text-red-500",   bg: "bg-red-50"    },
    { label: "Total Requests", value: total,    icon: "list_alt",     color: "text-primary",   bg: "bg-primary/5" },
  ];

  const weeklyBars = [45, 62, 38, 80, 55, 90, 70];
  const weekDays   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Manager Workspace</p>
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
            Good Morning, {user?.name?.split(" ")[0] || "Manager"}.
          </h2>
          <p className="text-on-surface-variant font-medium max-w-md">
            {loading ? "Syncing queue..." : <>You have <span className="font-bold text-primary">{pending} pending</span> requests today.</>}
          </p>
        </motion.div>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-bold shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-all flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filter
          </button>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-surface-container-lowest rounded-2xl p-6 border border-white shadow-sm flex flex-col gap-4 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
              <span className={`material-symbols-outlined text-[22px] ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <p className="text-3xl font-headline font-extrabold text-on-surface tracking-tighter">
                {loading ? "—" : s.value}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Bento: Chart + Summary */}
      <section className="grid grid-cols-12 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="col-span-12 lg:col-span-8 p-8 rounded-2xl bg-surface-container-lowest glass-card shadow-sm relative overflow-hidden group border-white"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-headline font-bold text-on-surface">Weekly Approval Volume</h3>
              <p className="text-on-surface-variant text-sm font-medium">Requests processed per day — current week</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              This Week
            </div>
          </div>
          <div className="flex items-end gap-3 min-h-[180px] pb-2">
            {weeklyBars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${i === 5 ? "bg-primary shadow-[0_0_20px_rgba(74,64,224,0.3)]" : "bg-surface-container-low group-hover:bg-primary/20"}`}
                  style={{ height: `${h}%` }}
                />
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{weekDays[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-t border-outline-variant/10 pt-4">
            <span>Mar 23 — Mar 29, 2026</span>
            <span className="text-primary font-extrabold">+18.4% vs last week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-4 p-8 rounded-2xl bg-primary text-on-primary flex flex-col justify-between shadow-xl shadow-primary/10 overflow-hidden relative"
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-6">
            <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary/60 mb-1">Total Approved Value</p>
              <p className="text-3xl font-headline font-extrabold tracking-tight">
                {loading ? "—" : approvedAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary/60 mb-1">Total Pipeline</p>
              <p className="text-xl font-headline font-bold">
                {loading ? "—" : totalAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </p>
            </div>
          </div>
          <div className="relative z-10 mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-primary/60">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Approval rate: {total > 0 ? Math.round((approved / total) * 100) : 0}%
          </div>
        </motion.div>
      </section>

      {/* Recent Activity */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Recent Activity</h3>
      </div>
      <section className="bg-surface-container-lowest rounded-2xl border border-white shadow-sm overflow-hidden mb-12">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-bold text-on-surface">No requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/5">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shrink-0">
                    {req.employee_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{req.employee_name}</p>
                    <p className="text-xs text-on-surface-variant font-medium">{req.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</p>
                    <p className="font-bold text-sm text-on-surface">
                      {Number(req.amount).toLocaleString("en-US", { style: "currency", currency: safeCurrency(req.currency) })}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ─── Requests Table ───────────────────────────────────────────────────────────
function RequestsTab({
  requests, filterStatus, onSelect, loading,
}: {
  requests: ExpenseRequest[];
  filterStatus?: "PENDING";
  onSelect: (r: ExpenseRequest) => void;
  loading: boolean;
}) {
  const displayed = filterStatus ? requests.filter(r => r.status === filterStatus) : requests;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <p className="text-primary font-bold tracking-widest text-[10px] uppercase">
            {filterStatus ? "Action Required" : "All Records"}
          </p>
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
            {filterStatus ? "Pending Approvals" : "All Requests"}
          </h2>
          <p className="text-on-surface-variant font-medium">
            {loading ? "Syncing..." : `${displayed.length} request${displayed.length !== 1 ? "s" : ""}`}
          </p>
        </motion.div>
      </header>

      <section className="bg-surface-container-lowest rounded-2xl border border-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>Employee</span>
          <span>Date of Expense</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-400 text-3xl">done_all</span>
            </div>
            <p className="font-bold text-on-surface text-lg font-headline">All caught up!</p>
            <p className="text-sm text-on-surface-variant mt-1">No requests to show here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayed.map((req, idx) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {req.employee_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{req.employee_name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{req.category}</p>
                  </div>
                </div>

                <p className="text-sm font-medium text-on-surface-variant">
                  {new Date(req.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>

                <p className="font-bold text-sm text-on-surface">
                  {Number(req.amount).toLocaleString("en-US", { style: "currency", currency: safeCurrency(req.currency) })}
                </p>

                <StatusBadge status={req.status} />

                <button
                  onClick={() => onSelect(req)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors active:scale-95 whitespace-nowrap ${
                    req.status === "PENDING"
                      ? "bg-primary text-on-primary hover:bg-primary-dim"
                      : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {req.status === "PENDING" ? "Review" : "View"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ user, token }: { user: any; token: string | null }) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    try {
      setIsChangingPassword(true);
      const res = await axios.put(
        "http://localhost:5000/api/auth/change-password",
        { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Account Controls</p>
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">Settings</h2>
          <p className="max-w-md text-on-surface-variant font-medium mt-2">Manage your personal account settings and security credentials.</p>
        </motion.div>
      </header>

      {/* Profile Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 border border-white shadow-sm max-w-2xl mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Profile</p>
        <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg">
            {user?.name?.charAt(0) ?? "M"}
          </div>
          <div>
            <p className="font-bold text-on-surface">{user?.name ?? "—"}</p>
            <p className="text-sm text-on-surface-variant">{user?.email ?? "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-0.5">{user?.designation ?? "Manager"}</p>
          </div>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-surface-container-lowest rounded-2xl p-8 border border-white shadow-sm max-w-2xl">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-outline-variant/10">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">lock_reset</span>
          </div>
          <div>
            <h3 className="text-xl font-headline font-bold text-on-surface">Change Password</h3>
            <p className="text-sm font-medium text-slate-500">Ensure your account is using a long, random password to stay secure.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current Password</label>
            <input
              required
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="Enter your current password"
            />
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              New Password <span className="text-[9px] text-slate-400 font-normal lowercase tracking-normal">(min. 6 characters)</span>
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="Enter your new password"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Confirm New Password</label>
            <input
              required
              type="password"
              minLength={6}
              value={passwordForm.confirmNewPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
              className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="Re-enter your new password"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-8 py-4 bg-primary text-on-primary font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ManagerDashboardContent() {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [allRequests, setAllRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExpenseRequest | null>(null);

  // Fetch all expenses once (used for dashboard analytics + "all" tab)
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/all`);
      setAllRequests(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pendingCount = allRequests.filter(r => r.status === "PENDING").length;

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED", note: string) => {
    try {
      await axios.post(`${API}/action/${id}`, { action, note });
      toast.success(`Request ${action.toLowerCase()} successfully.`);
      setSelected(null);
      fetchAll(); // refresh state from server
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const navTabs = [
    { id: "dashboard", icon: "dashboard",  label: "Dashboard"    },
    { id: "pending",   icon: "inbox",      label: "Pending",     badge: pendingCount },
    { id: "all",       icon: "list_alt",   label: "All Requests" },
    { id: "settings",  icon: "settings",   label: "Settings"     },
  ];

  return (
    <div className="bg-background font-body text-on-surface antialiased flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-transparent flex flex-col py-6 gap-4 font-body text-sm z-40">
        <div className="px-6 mb-8">
          <Link href="/" className="text-lg font-bold text-primary tracking-tight font-headline">Aura Hack</Link>
        </div>

        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm border border-white">
            <div className="w-10 h-10 rounded-full bg-primary/10 ring-2 ring-primary/10 flex items-center justify-center text-primary font-extrabold">
              {user?.name?.charAt(0) ?? "M"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-on-surface truncate">{user?.name ?? "Manager"}</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.designation ?? "Manager"}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all group ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm font-bold"
                  : "text-slate-500 hover:bg-white/50 hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="font-medium flex-1 text-left">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-primary text-white"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-error mx-2 rounded-lg transition-all group"
          >
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
            <span className="font-bold uppercase tracking-widest text-[10px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-64 flex-1 p-8 lg:p-12 overflow-y-auto">
        {activeTab === "dashboard" && <DashboardTab requests={allRequests} user={user} loading={loading} />}
        {activeTab === "pending"   && <RequestsTab requests={allRequests} filterStatus="PENDING" onSelect={setSelected} loading={loading} />}
        {activeTab === "all"       && <RequestsTab requests={allRequests} onSelect={setSelected} loading={loading} />}
        {activeTab === "settings"  && <SettingsTab user={user} token={token} />}

        <footer className="mt-20 py-12 border-t border-slate-100 flex flex-col items-center gap-6">
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Link className="hover:text-primary transition-colors" href="#">Privacy</Link>
            <Link className="hover:text-primary transition-colors" href="#">Terms</Link>
            <Link className="hover:text-primary transition-colors" href="#">Contact</Link>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© {new Date().getFullYear()} Aura Hack.</p>
        </footer>
      </main>

      <AnimatePresence>
        {selected && (
          <ActionModal
            request={selected}
            onClose={() => setSelected(null)}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <ProtectedRoute>
      <ManagerDashboardContent />
    </ProtectedRoute>
  );
}
