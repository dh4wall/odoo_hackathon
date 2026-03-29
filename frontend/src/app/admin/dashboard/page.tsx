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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Admin User Management State
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
    { id: "projects", icon: "folder_open", label: "Projects" },
    { id: "team", icon: "groups", label: "Team" },
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all group ${
                activeTab === tab.id 
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
                <p className="text-slate-500 font-medium">Loading users...</p>
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
                                onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                                className="bg-white border border-outline-variant/30 rounded px-2 py-1 text-xs"
                              >
                                <option value="EMPLOYEE">EMPLOYEE</option>
                                <option value="MANAGER">MANAGER</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                                u.role === "ADMIN" ? "bg-primary/10 text-primary" : 
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
                                onChange={(e) => setEditFormData({...editFormData, designation: e.target.value})}
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
                                onChange={(e) => setEditFormData({...editFormData, manager_id: e.target.value})}
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
                      )})}
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
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Email Address *</label>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="jane@company.com" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Role *</label>
                          <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none">
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Designation</label>
                          <input type="text" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="e.g. Finance Head" />
                        </div>
                      </div>

                      {formData.role === "EMPLOYEE" && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Assign Manager</label>
                          <select value={formData.manager_id} onChange={(e) => setFormData({...formData, manager_id: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none">
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
                <p className="text-slate-500 font-medium">Loading applications...</p>
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
                          <td className="py-4 px-4 font-bold text-slate-600">
                            {Number(e.amount).toLocaleString()} {e.currency}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium">{e.submitted_by_name}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                              e.status === "APPROVED" ? "bg-primary/10 text-primary" : 
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
                                        [newRoute[idx-1], newRoute[idx]] = [newRoute[idx], newRoute[idx-1]];
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
                                        [newRoute[idx+1], newRoute[idx]] = [newRoute[idx], newRoute[idx+1]];
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
                  onChange={(e) => setOversightFilters({...oversightFilters, search: e.target.value})}
                  className="w-full bg-surface-container-low text-on-surface px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium text-sm" 
                />
              </div>
              <div className="w-48">
                <select 
                  value={oversightFilters.status}
                  onChange={(e) => setOversightFilters({...oversightFilters, status: e.target.value})}
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
                  onChange={(e) => setOversightFilters({...oversightFilters, category: e.target.value})}
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
                            {e.status === 'PENDING' ? e.approval_steps?.find((s:any) => s.status === 'PENDING')?.approver_name || "—" : "—"}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                              e.status === "APPROVED" ? "bg-primary/10 text-primary" : 
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
                            <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center ${
                              log.action === 'APPROVED' ? 'bg-primary' :
                              log.action === 'REJECTED' ? 'bg-error' :
                              'bg-tertiary'
                            }`}></div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-base font-bold ${
                                  log.action === 'APPROVED' ? 'text-primary' :
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
        ) : (
          <>
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Workspace Overview</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  Good Morning, {user?.name?.split(' ')[0] || "Alex"}.
                </h2>
                <p className="text-on-surface-variant font-medium max-w-md">Your hackathon dashboard is synced and ready. You have 3 pending reviews today.</p>
              </motion.div>
              
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-bold shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-all flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  Schedule
                </button>
                <button className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  New Project
                </button>
              </div>
            </header>

            {/* Bento Grid Visualization */}
            <section className="grid grid-cols-12 gap-6 mb-12">
              {/* Main Stats Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-12 lg:col-span-8 p-8 rounded-2xl bg-surface-container-lowest glass-card shadow-sm relative overflow-hidden group border-white"
              >
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-headline font-bold text-on-surface">Hackathon Velocity</h3>
                      <p className="text-on-surface-variant text-sm font-medium">Average commit frequency & sprint speed</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                      Live Updates
                    </div>
                  </div>
                  
                  {/* Chart Placeholder */}
                  <div className="flex-1 flex items-end gap-3 min-h-[200px] py-4">
                    {[40, 65, 85, 45, 70, 90, 55].map((h, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-t-lg transition-all duration-500 delay-${i * 50} ${
                          i === 5 ? "bg-primary shadow-[0_0_20px_rgba(74,64,224,0.3)]" : "bg-surface-container-low group-hover:bg-primary/20"
                        }`}
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>Mon, 22 Mar</span>
                    <span className="text-primary font-extrabold">+24.5% improvement</span>
                    <span>Sun, 28 Mar</span>
                  </div>
                </div>
              </motion.div>

              {/* Side Card: Quick Action */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="col-span-12 lg:col-span-4 p-8 rounded-2xl bg-primary text-on-primary flex flex-col justify-between shadow-xl shadow-primary/10 overflow-hidden relative"
              >
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-4xl mb-4">bolt</span>
                  <h3 className="text-2xl font-headline font-bold leading-tight mb-2">Deploy Aura Glass Components</h3>
                  <p className="text-on-primary/70 text-sm font-medium">Push your latest UI library directly to the main repository.</p>
                </div>
                <button className="relative z-10 mt-8 w-full py-4 bg-white text-primary font-bold rounded-xl hover:bg-on-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm">
                  Start Deployment
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </motion.div>
            </section>

            {/* Secondary Section: Hackathon Projects */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Hackathon Projects</h3>
              <button className="text-primary font-bold text-sm hover:underline underline-offset-4 uppercase tracking-widest">View All</button>
            </div>
            
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
              {/* Project Card 1 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col bg-surface-container-low rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-on-surface/5 transition-all duration-500 border border-white"
              >
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    alt="Cyberpunk workspace" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbQIqwnYnODvr9wQGRae7_RAAIe_YlPJzvcGmBa0KqrSFSN53--KCpRLq_G0TKeeSVe1oWYIsq2LY3UjtI6MAeYzY46-gfNtDjkUF4yVRlYS5NV-xmEmH5aVDl9scWDsGqVRZC_iqhFM3RPGtrGk_YE5haCpugDjn1lRVcuFLerqyNAySDSzzgW4hG6-cBDeuH_6o5HxjTsdnUFnEyuiFIxixhzuvVtPhean6W0PXvrF0aamkPdiP0pefSmPH7yRUUg2rvD3sowSw" 
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-on-surface font-headline">Neon Cryptography</h4>
                    <span className="px-3 py-1 bg-tertiary-container/20 text-tertiary text-[10px] font-bold uppercase tracking-wider rounded-full">In Progress</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-medium">Advanced end-to-end encryption module for distributed ledger systems using quantum-safe algorithms.</p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2].map((i) => (
                        <img key={i} alt="Avatar" className="w-7 h-7 rounded-full border-2 border-surface-container-low" src={`https://i.pravatar.cc/100?img=${i+40}`} />
                      ))}
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase">+3 contributors</span>
                  </div>
                </div>
              </motion.div>

              {/* Project Card 2 */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col bg-surface-container-low rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-on-surface/5 transition-all duration-500 border border-white"
              >
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    alt="Satellite data" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbdEMCarm3UIhnHBlQ00OS_oYm-wNBCtdNHIQg00flGtG6VPrrVgUPIDeXfWMm1nYk-Eu9yDXuBPJaOZ4LiIQ0Shia2X-LPrxr9o77ORo9R3RIO1qAs15sduiiaUN_wKto66yHwQoUsZu6RgzizIW8BuykFuUo-JMYylPhuKXta2cUHIHcR0x7yGDG3QAbJmZt5YhcUyRKas6gWeyxfVgINKzzqrrAAVlUVK_guDvWawZrBMOsxkl1MaDjI6VdmIU4Pap_njLMFdc" 
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-on-surface font-headline">Atmospheric Sync</h4>
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full">Completed</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-medium">Real-time weather data visualization for global shipping routes using IoT satellite sensors.</p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <img alt="Avatar" className="w-7 h-7 rounded-full border-2 border-surface-container-low" src={`https://i.pravatar.cc/100?img=43`} />
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-bold uppercase">+1 contributor</span>
                  </div>
                </div>
              </motion.div>

              {/* Project Card 3 (Empty State) */}
              <button className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-[2rem] group hover:border-primary transition-all hover:bg-white/50">
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                </div>
                <h4 className="font-extrabold text-on-surface font-headline uppercase tracking-tight">Pitch a Project</h4>
                <p className="text-on-surface-variant text-sm text-center mt-2 font-medium">Have a revolutionary idea? Submit it to the jury now.</p>
              </button>
            </section>
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
