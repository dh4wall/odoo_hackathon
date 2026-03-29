"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string | null;
  manager_id: string | null;
  manager_name?: string | null;
  created_at: string;
}

function DashboardContent() {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New passwords do not match!"); return;
    }
    try {
      setIsChangingPassword(true);
      const res = await axios.put("http://localhost:5000/api/auth/change-password",
        { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally { setIsChangingPassword(false); }
  };

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await axios.get("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE",
    designation: "",
    manager_id: "",
  });

  // Inline Editing State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    role: "EMPLOYEE",
    designation: "",
    manager_id: "",
  });

  // Applications State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [routeApprovers, setRouteApprovers] = useState<string[]>([]);
  const [priorityApprovers, setPriorityApprovers] = useState<string[]>([]);

  // Oversight State
  const [isOversightModalOpen, setIsOversightModalOpen] = useState(false);
  const [selectedOversightExp, setSelectedOversightExp] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [oversightFilters, setOversightFilters] = useState({ status: "", category: "", search: "" });

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoadingExpenses(true);
      const res = await axios.get("http://localhost:5000/api/expenses/all", { withCredentials: true });
      setExpenses(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch applications");
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      if (activeTab === "users") fetchUsers();
      if (activeTab === "applications" || activeTab === "oversight") {
        fetchExpenses();
        if (users.length === 0) fetchUsers();
      }
    }
  }, [user?.role, activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        manager_id: formData.manager_id || undefined,
        designation: formData.designation || undefined,
      };
      await axios.post("http://localhost:5000/api/users", payload);
      toast.success("User created successfully");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", role: "EMPLOYEE", designation: "", manager_id: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleSendCredentials = async (userId: string) => {
    try {
      toast.loading("Sending new credentials...", { id: `send-cred-${userId}` });
      await axios.post(`http://localhost:5000/api/users/${userId}/send-credentials`);
      toast.success("New credentials emailed successfully!", { id: `send-cred-${userId}` });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send credentials", { id: `send-cred-${userId}` });
    }
  };

  const startEditing = (u: UserData) => {
    setEditingUserId(u.id);
    setEditFormData({
      role: u.role,
      designation: u.designation || "",
      manager_id: u.manager_id || "",
    });
  };

  const saveEdit = async (id: string) => {
    try {
      if (editFormData.role === "MANAGER") editFormData.manager_id = "";
      await axios.put(`http://localhost:5000/api/users/${id}`, editFormData);
      toast.success("User updated successfully");
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update user");
    }
  };

  const openRouteModal = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setRouteApprovers([]);
    setIsRouteModalOpen(true);
  };

  const handleAssignRoute = async () => {
    if (!selectedExpenseId) return;
    try {
      await axios.post(`http://localhost:5000/api/expenses/${selectedExpenseId}/assign-approvers`, {
        approverIds: routeApprovers,
        priorityApproverIds: priorityApprovers
      }, { withCredentials: true });
      toast.success("Approval route assigned successfully!");
      setIsRouteModalOpen(false);
      setRouteApprovers([]);
      setPriorityApprovers([]);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to assign route");
    }
  };

  const openOversightModal = async (exp: any) => {
    setSelectedOversightExp(exp);
    setIsOversightModalOpen(true);
    try {
      setIsLogsLoading(true);
      const res = await axios.get(`http://localhost:5000/api/expenses/${exp.id}/audit-logs`, { withCredentials: true });
      setAuditLogs(res.data);
    } catch (err) {
      toast.error("Failed to load audit trail");
    } finally {
      setIsLogsLoading(false);
    }
  };

  const filteredOversight = expenses.filter(e => {
    if (oversightFilters.status && e.status !== oversightFilters.status) return false;
    if (oversightFilters.category && e.category !== oversightFilters.category) return false;
    if (oversightFilters.search && !e.submitted_by_name?.toLowerCase().includes(oversightFilters.search.toLowerCase())) return false;
    return true;
  });

  const managers = users.filter((u) => u.role === "MANAGER");

  const navTabs = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "settings", icon: "settings", label: "Settings" }
  ];

  if (user?.role === "ADMIN") {
    navTabs.push({ id: "users", icon: "manage_accounts", label: "User Management" });
    navTabs.push({ id: "applications", icon: "assignment", label: "Applications" });
    navTabs.push({ id: "oversight", icon: "visibility", label: "Oversight History" });
  }

  return (
    <div className="bg-background font-body text-on-surface antialiased flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-transparent flex flex-col py-6 gap-4 font-body text-sm z-40">
        <div className="px-6 mb-8">
          <Link href="/" className="text-lg font-bold text-primary tracking-tight font-headline">Zync</Link>
        </div>

        {/* User Profile Anchor */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm border border-white">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-primary/10">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe-rpX2Vn6cejqzTAM7KAV8BDLKFNLv3rYxDa_Tex412nHCBy05aMUPSxr9v99at7ukf6cXU8nib34pWvTtfv2q0Zo03LZBhAWW1Yc1FiQj30vyl-J0mx0CpkID7gdkO51BqhMDIyL6TopvVOyogjCSAcLUu6s0fjkFqZpIBqI7CH7LvdqJy0NXZgklWqpRCRWyGH04TVjCV1mfZSohu3rY3S_c1E80ALKRmy3D-GeTPp6lGvQh0xg04-Fuz6zu9yQBc22cbdz11M"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-on-surface truncate">{user?.name || "Alex Rivers"}</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.role || "Hacker Elite"}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-2 space-y-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all group ${activeTab === tab.id
                  ? "bg-white text-primary shadow-sm font-bold"
                  : "text-slate-500 hover:bg-white/50 hover:translate-x-1"
                }`}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Tab */}
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

      {/* Main Content Canvas */}
      <main className="ml-64 flex-1 p-8 lg:p-12 overflow-y-auto">
        {activeTab === "users" && user?.role === "ADMIN" ? (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Admin Settings</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  User Management
                </h2>
              </motion.div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Add User
              </button>
            </header>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-white shadow-sm">
              {isLoadingUsers ? (
                <div className="space-y-3 py-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded-full w-1/4" />
                      <div className="h-4 bg-slate-100 rounded-full w-16" />
                      <div className="h-4 bg-slate-100 rounded-full w-24" />
                      <div className="h-4 bg-slate-100 rounded-full w-20" />
                      <div className="h-4 bg-slate-100 rounded-full w-20" />
                      <div className="ml-auto h-7 bg-slate-100 rounded-lg w-24" />
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="text-slate-500 font-medium">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-slate-400 font-bold tracking-widest uppercase text-[10px]">
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 px-4">Role</th>
                        <th className="pb-3 px-4">Designation</th>
                        <th className="pb-3 px-4">Manager</th>
                        <th className="pb-3 px-4">Added On</th>
                        <th className="pb-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isEditing = editingUserId === u.id;
                        return (
                          <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">{u.name}</span>
                                <span className="text-xs text-slate-400">{u.email}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {isEditing ? (
                                <select
                                  value={editFormData.role}
                                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                  className="bg-white border border-outline-variant/30 rounded px-2 py-1 text-xs"
                                >
                                  <option value="EMPLOYEE">EMPLOYEE</option>
                                  <option value="MANAGER">MANAGER</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${u.role === "ADMIN" ? "bg-primary/10 text-primary" :
                                    u.role === "MANAGER" ? "bg-tertiary/10 text-tertiary" :
                                      "bg-surface-container-high text-on-surface-variant"
                                  }`}>
                                  {u.role}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-600 font-medium">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editFormData.designation}
                                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                                  className="bg-white border border-outline-variant/30 rounded px-2 py-1 text-xs w-24"
                                  placeholder="..."
                                />
                              ) : (
                                u.designation || "—"
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-600 font-medium">
                              {isEditing && editFormData.role === "EMPLOYEE" ? (
                                <select
                                  value={editFormData.manager_id}
                                  onChange={(e) => setEditFormData({ ...editFormData, manager_id: e.target.value })}
                                  className="bg-white border border-outline-variant/30 rounded px-2 py-1 text-xs w-28"
                                >
                                  <option value="">None</option>
                                  {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                              ) : isEditing ? (
                                <span className="text-xs text-slate-400">—</span>
                              ) : (
                                u.manager_name || "—"
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-500 text-xs">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 pl-4 text-right">
                              {u.role !== "ADMIN" && (
                                <div className="flex items-center justify-end gap-2">
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => saveEdit(u.id)} className="p-1.5 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-[16px]">check</span></button>
                                      <button onClick={() => setEditingUserId(null)} className="p-1.5 bg-error/10 text-error rounded hover:bg-error hover:text-white transition-colors"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => startEditing(u)} className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Edit User">
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                      </button>
                                      <button onClick={() => handleSendCredentials(u.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-primary hover:text-white text-primary text-xs font-bold rounded-lg transition-colors group" title="Reset & Email New Password">
                                        <span className="material-symbols-outlined text-[16px]">mail</span>
                                        Send Invite
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <AnimatePresence>
              {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-surface-container-lowest p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold font-headline text-on-surface">Add New User</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-error material-symbols-outlined transition-colors">close</button>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Full Name *</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Email Address *</label>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="jane@company.com" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Role *</label>
                          <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none">
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Designation</label>
                          <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="e.g. Finance Head" />
                        </div>
                      </div>

                      {formData.role === "EMPLOYEE" && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Assign Manager</label>
                          <select value={formData.manager_id} onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none">
                            <option value="">No Manager</option>
                            {managers.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.designation || 'Manager'})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="pt-4">
                        <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                          Create User
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        ) : activeTab === "applications" && user?.role === "ADMIN" ? (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Admin Settings</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  Applications & Routing
                </h2>
              </motion.div>
            </header>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-white shadow-sm">
              {isLoadingExpenses ? (
                <div className="space-y-3 py-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                      <div className="h-4 bg-slate-100 rounded-full w-16" />
                      <div className="h-4 bg-slate-100 rounded-full w-24" />
                      <div className="h-5 bg-slate-100 rounded w-16" />
                      <div className="ml-auto h-7 bg-slate-100 rounded-lg w-24" />
                    </div>
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <p className="text-slate-500 font-medium">No expense applications found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-outline-variant/20">
                        <th className="py-4 pr-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Application</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Amount</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Submitter</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Status</th>
                        <th className="py-4 pl-4 font-bold text-slate-400 text-xs tracking-wider uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id} className="border-b border-outline-variant/10 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">{e.description}</span>
                              <span className="text-xs text-slate-400">{e.category} • {new Date(e.date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-600">
                                {Number(e.amount_in_base || e.amount).toLocaleString()} {e.base_currency || e.currency}
                              </span>
                              {(e.currency && e.base_currency && e.currency !== e.base_currency) && (
                                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  Original: {Number(e.amount).toLocaleString()} {e.currency}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium">{e.submitted_by_name}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${e.status === "APPROVED" ? "bg-primary/10 text-primary" :
                                e.status === "REJECTED" ? "bg-error/10 text-error" :
                                  e.status === "PENDING" ? "bg-tertiary/10 text-tertiary" :
                                    "bg-surface-container-high text-on-surface-variant"
                              }`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-right">
                            {e.status === "DRAFT" ? (
                              <button
                                onClick={() => openRouteModal(e.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-primary hover:text-white text-primary text-xs font-bold rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">route</span>
                                Assign Route
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-outline-variant/20 inline-flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Routed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Route Builder Modal */}
            <AnimatePresence>
              {isRouteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsRouteModalOpen(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-surface-container-lowest p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-white"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold font-headline text-on-surface">Build Approval Route</h3>
                      <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-error material-symbols-outlined transition-colors">close</button>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Route Sequence</label>
                        {routeApprovers.length === 0 ? (
                          <p className="text-sm text-slate-400">No approvers added yet. Add a manager below to start the sequence.</p>
                        ) : (
                          <div className="space-y-2">
                            {routeApprovers.map((mgrId, idx) => {
                              const mgr = managers.find(m => m.id === mgrId);
                              return (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-outline-variant/20 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">
                                      {mgr?.name} <span className="ml-1 text-xs font-medium text-slate-400">({mgr?.designation || 'Manager'})</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => {
                                        const newRoute = [...routeApprovers];
                                        [newRoute[idx - 1], newRoute[idx]] = [newRoute[idx], newRoute[idx - 1]];
                                        setRouteApprovers(newRoute);
                                      }}
                                      className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                    </button>
                                    <button
                                      disabled={idx === routeApprovers.length - 1}
                                      onClick={() => {
                                        const newRoute = [...routeApprovers];
                                        [newRoute[idx + 1], newRoute[idx]] = [newRoute[idx], newRoute[idx + 1]];
                                        setRouteApprovers(newRoute);
                                      }}
                                      className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRouteApprovers(routeApprovers.filter((_, i) => i !== idx));
                                      }}
                                      className="p-1 hover:text-error transition-colors ml-2"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Add Manager to Route</label>
                          <select
                            id="addManagerSelect"
                            className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Select a Manager...</option>
                            {managers.filter(m => !routeApprovers.includes(m.id)).map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.designation || 'Manager'})</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            const sel = document.getElementById("addManagerSelect") as HTMLSelectElement;
                            if (sel && sel.value) {
                              setRouteApprovers([...routeApprovers, sel.value]);
                              sel.value = "";
                            }
                          }}
                          className="px-6 py-3 bg-surface-container-high hover:bg-primary hover:text-white rounded-xl font-bold transition-all"
                        >
                          Add
                        </button>
                      </div>

                      {routeApprovers.length > 0 && (
                        <div className="pt-4 mt-2 border-t border-outline-variant/10">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Configure Priority Overrides</label>
                          <div className="space-y-2">
                            {routeApprovers.map(approverId => {
                              const mgr = managers.find(m => m.id === approverId);
                              if (!mgr) return null;
                              return (
                                <label key={mgr.id} className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                                    checked={priorityApprovers.includes(mgr.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setPriorityApprovers([...priorityApprovers, mgr.id]);
                                      else setPriorityApprovers(priorityApprovers.filter(id => id !== mgr.id));
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm text-on-surface">{mgr.name}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{mgr.designation || 'Manager'}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-[10px] mt-3 text-slate-400 font-medium">
                            If any checked manager takes action, their decision instantly finalizes the entire chain. If unchecked managers act, normal 60% mathematical polling rules apply.
                          </p>
                        </div>
                      )}

                      <div className="pt-4">
                        <button
                          onClick={handleAssignRoute}
                          disabled={routeApprovers.length === 0}
                          className="w-full py-4 bg-primary text-on-primary font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all"
                        >
                          Finalize Sequence
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        ) : activeTab === "oversight" && user?.role === "ADMIN" ? (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Company Treasury</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  Oversight History
                </h2>
              </motion.div>
            </header>

            {/* Filters */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 border border-white shadow-sm mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by Employee..."
                  value={oversightFilters.search}
                  onChange={(e) => setOversightFilters({ ...oversightFilters, search: e.target.value })}
                  className="w-full bg-surface-container-low text-on-surface px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium text-sm"
                />
              </div>
              <div className="w-48">
                <select
                  value={oversightFilters.status}
                  onChange={(e) => setOversightFilters({ ...oversightFilters, status: e.target.value })}
                  className="w-full bg-surface-container-low text-on-surface px-4 py-2.5 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div className="w-48">
                <select
                  value={oversightFilters.category}
                  onChange={(e) => setOversightFilters({ ...oversightFilters, category: e.target.value })}
                  className="w-full bg-surface-container-low text-on-surface px-4 py-2.5 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none text-sm"
                >
                  <option value="">All Categories</option>
                  {Array.from(new Set(expenses.map(e => e.category))).map(c => (
                    <option key={String(c)} value={String(c)}>{String(c)}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-white shadow-sm">
              {isLoadingExpenses ? (
                <p className="text-slate-500 font-medium">Loading dataset...</p>
              ) : filteredOversight.length === 0 ? (
                <p className="text-slate-500 font-medium">No records match the current filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-outline-variant/20">
                        <th className="py-4 pr-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Application</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Employee</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Base Amount</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Pending With</th>
                        <th className="py-4 px-4 font-bold text-slate-400 text-xs tracking-wider uppercase">Status</th>
                        <th className="py-4 pl-4 font-bold text-slate-400 text-xs tracking-wider uppercase text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOversight.map((e) => (
                        <tr key={e.id} className="border-b border-outline-variant/10 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface truncate max-w-[200px]">{e.description}</span>
                              <span className="text-xs text-slate-400">{e.category} • {new Date(e.date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {e.submitted_by_name}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-600">
                            {Number(e.amount_in_base).toLocaleString()} {e.base_currency}
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700 text-sm">
                            {e.status === 'PENDING' ? e.approval_steps?.find((s: any) => s.status === 'PENDING')?.approver_name || "—" : "—"}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${e.status === "APPROVED" ? "bg-primary/10 text-primary" :
                                e.status === "REJECTED" ? "bg-error/10 text-error" :
                                  e.status === "PENDING" ? "bg-tertiary/10 text-tertiary" :
                                    "bg-surface-container-high text-on-surface-variant"
                              }`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <button
                              onClick={() => openOversightModal(e)}
                              className="p-1.5 text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-1" title="View Audit Trail"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Audit Trail Modal */}
            <AnimatePresence>
              {isOversightModalOpen && selectedOversightExp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOversightModalOpen(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-surface-container-lowest p-8 rounded-3xl w-full max-w-2xl shadow-2xl border border-white max-h-[90vh] flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6 shrink-0">
                      <div>
                        <h3 className="text-2xl font-bold font-headline text-on-surface">Audit Trail</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">{selectedOversightExp.description}</p>
                      </div>
                      <button onClick={() => setIsOversightModalOpen(false)} className="text-slate-400 hover:text-error material-symbols-outlined transition-colors">close</button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                      {/* Initial Submission Block */}
                      <div className="relative pl-6 border-l-2 border-outline-variant/30 pb-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-outline-variant border-2 border-white"></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {new Date(selectedOversightExp.created_at).toLocaleString()}
                          </span>
                          <span className="text-base font-bold text-slate-700">Cost Submitted</span>
                          <span className="text-sm text-slate-500 mt-1">
                            {selectedOversightExp.submitted_by_name} submitted expense for {Number(selectedOversightExp.amount).toLocaleString()} {selectedOversightExp.currency} (Base: {Number(selectedOversightExp.amount_in_base).toLocaleString()} {selectedOversightExp.base_currency})
                          </span>
                        </div>
                      </div>

                      {isLogsLoading ? (
                        <p className="pl-6 text-slate-400 font-medium text-sm animate-pulse">Fetching cryptographic logs...</p>
                      ) : auditLogs.length === 0 ? (
                        <p className="pl-6 text-slate-400 font-medium text-sm">No actions recorded yet.</p>
                      ) : (
                        auditLogs.map((log, idx) => (
                          <div key={log.id} className={`relative pl-6 border-l-2 pb-6 ${idx === auditLogs.length - 1 ? 'border-transparent' : 'border-outline-variant/30'}`}>
                            <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${log.action === 'APPROVED' ? 'bg-primary' :
                                log.action === 'REJECTED' ? 'bg-error' :
                                  'bg-tertiary'
                              }`}></div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-base font-bold ${log.action === 'APPROVED' ? 'text-primary' :
                                    log.action === 'REJECTED' ? 'text-error' :
                                      'text-tertiary'
                                  }`}>{log.action}</span>
                                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase px-2 bg-slate-100 rounded-md">
                                  {log.actor_name}
                                </span>
                              </div>
                              {log.comment && (
                                <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-outline-variant/20 italic">
                                  "{log.comment}"
                                </p>
                              )}
                              {log.metadata && (
                                <pre className="mt-2 text-[10px] text-slate-500 bg-slate-900/5 p-2 rounded-lg break-words whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        ) : activeTab === "settings" ? (
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
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-primary/10">
                  <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe-rpX2Vn6cejqzTAM7KAV8BDLKFNLv3rYxDa_Tex412nHCBy05aMUPSxr9v99at7ukf6cXU8nib34pWvTtfv2q0Zo03LZBhAWW1Yc1FiQj30vyl-J0mx0CpkID7gdkO51BqhMDIyL6TopvVOyogjCSAcLUu6s0fjkFqZpIBqI7CH7LvdqJy0NXZgklWqpRCRWyGH04TVjCV1mfZSohu3rY3S_c1E80ALKRmy3D-GeTPp6lGvQh0xg04-Fuz6zu9yQBc22cbdz11M" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">{user?.name ?? "—"}</p>
                  <p className="text-sm text-on-surface-variant">{user?.email ?? "—"}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-0.5">{user?.role ?? "Admin"}</p>
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
                  <input required type="password" value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Enter your current password" />
                </div>
                <div className="pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    New Password <span className="text-[9px] text-slate-400 font-normal lowercase tracking-normal">(min. 6 characters)</span>
                  </label>
                  <input required type="password" minLength={6} value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Enter your new password" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Confirm New Password</label>
                  <input required type="password" minLength={6} value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Re-enter your new password" />
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isChangingPassword}
                    className="px-8 py-4 bg-primary text-on-primary font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100">
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </section>
          </>
        ) : (
          <>
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Workspace Overview</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  Good Morning, {user?.name?.split(' ')[0] || "Admin"}.
                </h2>
                <p className="text-on-surface-variant font-medium max-w-md">
                  {isLoadingStats ? "Syncing analytics..." : stats ? <>Company has <span className="font-bold text-primary">{stats.expenses.pending} pending</span> reimbursements today.</> : "Your admin workspace is ready."}
                </p>
              </motion.div>
              <button
                onClick={fetchStats}
                className="px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-bold shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                Refresh Stats
              </button>
            </header>

            {/* Stat Cards */}
            {isLoadingStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: "Pending", value: stats.expenses.pending, icon: "inbox", color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Approved", value: stats.expenses.approved, icon: "check_circle", color: "text-green-600", bg: "bg-green-50" },
                  { label: "Rejected", value: stats.expenses.rejected, icon: "cancel", color: "text-red-500", bg: "bg-red-50" },
                  { label: "Total Users", value: stats.users.total, icon: "group", color: "text-primary", bg: "bg-primary/5" },
                  { label: "Employees", value: stats.users.employees, icon: "person", color: "text-tertiary", bg: "bg-tertiary/5" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-white shadow-sm flex flex-col gap-3">
                    <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center ${s.color}`}>
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-3xl font-headline font-extrabold text-on-surface">{s.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </section>
            ) : (
              <div className="mb-8 p-6 bg-surface-container-lowest rounded-2xl border border-white text-center">
                <button onClick={fetchStats} className="text-primary font-bold text-sm hover:underline">Load Analytics</button>
              </div>
            )}

            {/* Charts Row */}
            {stats && (
              <section className="grid grid-cols-12 gap-6 mb-8">
                {/* Monthly Volume Bar Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="col-span-12 lg:col-span-8 p-8 rounded-2xl bg-surface-container-lowest glass-card shadow-sm border border-white">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-headline font-bold text-on-surface">Monthly Submissions</h3>
                      <p className="text-on-surface-variant text-sm font-medium">Reimbursement volume over the past 6 months</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Live
                    </div>
                  </div>
                  {stats.monthlyVolume.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 font-medium text-sm">No data yet</div>
                  ) : (
                    <>
                      <div className="flex items-end gap-3 min-h-[140px] py-4">
                        {(() => {
                          const max = Math.max(...stats.monthlyVolume.map((m: any) => m.count), 1);
                          return stats.monthlyVolume.map((m: any, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                              <span className="text-[10px] font-bold text-primary">{m.count}</span>
                              <div
                                className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-all"
                                style={{ height: `${Math.max((m.count / max) * 120, 8)}px` }}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{m.month}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Approval Rate Ring */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="col-span-12 lg:col-span-4 p-8 rounded-2xl bg-primary text-on-primary flex flex-col justify-between shadow-xl shadow-primary/10 overflow-hidden relative">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary/70 mb-1">Approval Rate</p>
                    <p className="text-5xl font-headline font-extrabold mb-1">
                      {stats.expenses.total > 0
                        ? Math.round((stats.expenses.approved / stats.expenses.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-on-primary/70 text-sm font-medium">of all submitted requests approved</p>
                  </div>
                  <div className="relative z-10 space-y-2 mt-6">
                    {[
                      { label: "Approved Value", value: `$${Number(stats.expenses.totalApprovedAmount).toLocaleString()}`, pill: "bg-white/20" },
                      { label: "Pending Value", value: `$${Number(stats.expenses.totalPendingAmount).toLocaleString()}`, pill: "bg-white/10" },
                    ].map((item) => (
                      <div key={item.label} className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${item.pill}`}>
                        <span className="text-xs font-bold text-on-primary/80">{item.label}</span>
                        <span className="text-sm font-extrabold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* Category Breakdown */}
            {stats && stats.categoryBreakdown.length > 0 && (
              <section className="bg-surface-container-lowest rounded-2xl p-8 border border-white shadow-sm mb-8">
                <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Expense by Category</h3>
                <div className="space-y-4">
                  {(() => {
                    const max = Math.max(...stats.categoryBreakdown.map((c: any) => c.count), 1);
                    return stats.categoryBreakdown.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        <p className="w-32 text-sm font-bold text-on-surface truncate shrink-0">{c.category}</p>
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${(c.count / max) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-on-surface w-8 text-right">{c.count}</span>
                        <span className="text-xs text-slate-400 font-medium w-24 text-right">${Number(c.totalAmount).toLocaleString()}</span>
                      </div>
                    ));
                  })()}
                </div>
              </section>
            )}
          </>
        )}

        {/* Footer Section */}
        <footer className="mt-20 py-12 border-t border-slate-100 flex flex-col items-center gap-6">
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Link className="hover:text-primary transition-colors" href="#">Privacy</Link>
            <Link className="hover:text-primary transition-colors" href="#">Terms</Link>
            <Link className="hover:text-primary transition-colors" href="#">Contact</Link>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span className="material-symbols-outlined text-[18px]">language</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">English (US)</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© {new Date().getFullYear()} Zync.</p>
        </footer>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
