"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Removing dummy data - now we fetch from DB
function EmployeeDashboardContent() {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Reimbursement State
  const [isReimbModalOpen, setIsReimbModalOpen] = useState(false);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [isLoadingReimb, setIsLoadingReimb] = useState(false);
  const [reimbForm, setReimbForm] = useState({
    description: "",
    date: "",
    category: "",
    paidBy: "Personal Card",
    amount: "",
    currency: "$",
    remarks: "",
    receiptFile: null as File | null,
  });

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  const fetchReimbursements = async () => {
    try {
      setIsLoadingReimb(true);
      const res = await axios.get("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReimbursements(res.data);
    } catch (error) {
      console.error("Failed to fetch reimbursements", error);
      toast.error("Failed to fetch reimbursements");
    } finally {
      setIsLoadingReimb(false);
    }
  };

  useEffect(() => {
    if (activeTab === "track_issues" && token) {
      fetchReimbursements();
    }
  }, [activeTab, token]);

  const navTabs = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "reimbursement", icon: "add_circle", label: "Apply Reimbursement" },
    { id: "track_issues", icon: "receipt_long", label: "Track Issues" },
    { id: "settings", icon: "settings", label: "Settings" }
  ];

  const handleReimbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reimbForm.receiptFile) {
      toast.error("Please attach a receipt (PDF).");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("description", reimbForm.description);
      formData.append("date", reimbForm.date);
      formData.append("category", reimbForm.category);
      formData.append("paidBy", reimbForm.paidBy);
      formData.append("amount", reimbForm.amount);
      formData.append("currency", reimbForm.currency);
      formData.append("remarks", reimbForm.remarks);
      formData.append("receiptFile", reimbForm.receiptFile);

      await axios.post("http://localhost:5000/api/expenses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success("Reimbursement application submitted successfully!");
      setIsReimbModalOpen(false);
      fetchReimbursements();
      
      // Reset Form
      setReimbForm({
        description: "",
        date: "",
        category: "",
        paidBy: "Personal Card",
        amount: "",
        currency: "$",
        remarks: "",
        receiptFile: null,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit reimbursement");
    }
  };

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
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (error: any) {
      console.error("Failed to change password", error);
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

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
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.role || "Employee"}</span>
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
        {activeTab === "dashboard" ? (
          <>
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Employee Dashboard</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  Good Morning, {user?.name?.split(' ')[0] || "Employee"}.
                </h2>
                <p className="text-on-surface-variant font-medium max-w-md">Your workspace is ready. You have 2 new task assignments.</p>
              </motion.div>
              
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-bold shadow-sm border border-outline-variant/10 hover:bg-surface-container-low transition-all flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  Schedule
                </button>
                <button className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[20px]">add_task</span>
                  Log Hours
                </button>
              </div>
            </header>

            {/* Content Widgets */}
            <section className="grid grid-cols-12 gap-6 mb-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-12 lg:col-span-8 p-8 rounded-2xl bg-surface-container-lowest glass-card shadow-sm border border-white"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-headline font-bold text-on-surface">Weekly Progress</h3>
                    <p className="text-on-surface-variant text-sm font-medium">Your activity over the last 7 days</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                    On Track
                  </div>
                </div>
                
                <div className="flex-1 flex items-end gap-3 min-h-[150px] py-4">
                  {[30, 50, 40, 70, 85, 45, 60].map((h, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-t-lg transition-all duration-500 delay-${i * 50} ${
                        i === 4 ? "bg-primary shadow-[0_0_20px_rgba(74,64,224,0.3)]" : "bg-surface-container-low hover:bg-primary/20"
                      }`}
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Mon, 22 Mar</span>
                  <span className="text-primary font-extrabold">+12.5% productivity</span>
                  <span>Sun, 28 Mar</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="col-span-12 lg:col-span-4 p-8 rounded-2xl bg-primary text-on-primary flex flex-col justify-between shadow-xl shadow-primary/10 overflow-hidden relative"
              >
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-4xl mb-4">notifications_active</span>
                  <h3 className="text-2xl font-headline font-bold leading-tight mb-2">Upcoming Deadline</h3>
                  <p className="text-on-primary/70 text-sm font-medium">The 'Aura Glass Components' review is due in 3 hours.</p>
                </div>
                <button className="relative z-10 mt-8 w-full py-4 bg-white text-primary font-bold rounded-xl hover:bg-on-primary transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm">
                  View Details
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </motion.div>
            </section>
          </>
        ) : activeTab === "reimbursement" || activeTab === "track_issues" ? (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Finance & Expenses</p>
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  {activeTab === "reimbursement" ? "Reimbursements" : "Track Issues"}
                </h2>
              </motion.div>
              
              {activeTab === "reimbursement" && (
                <button 
                  onClick={() => setIsReimbModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Apply for Reimbursement
                </button>
              )}
            </header>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-slate-400 font-bold tracking-widest uppercase text-[10px]">
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Category</th>
                      <th className="pb-3 px-4">Paid By</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4">Approver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingReimb ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Loading reimbursements...</td>
                      </tr>
                    ) : reimbursements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">No applications found.</td>
                      </tr>
                    ) : (
                      reimbursements.map((r, idx) => (
                        <tr key={r.id || idx} className="border-b border-outline-variant/10 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">{r.description}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                {new Date(r.date || r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-headline font-extrabold text-primary">
                            {r.amount} <span className="text-xs text-on-surface-variant font-bold">{r.currency}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-medium">{r.category}</td>
                          <td className="py-4 px-4 text-slate-600 font-medium">Card</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                              (r.status || "DRAFT") === "APPROVED" ? "bg-green-100 text-green-700" : 
                              (r.status || "DRAFT") === "DRAFT" ? "bg-surface-container-high text-on-surface-variant" : 
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {r.status || "DRAFT"}
                            </span>
                          </td>
                          <td className="py-4 pl-4 text-slate-600 font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">Admin</span>
                              <span className="text-[9px] text-slate-400 tracking-wider truncate max-w-[100px]">—</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <AnimatePresence>
              {isReimbModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsReimbModalOpen(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-surface-container-lowest p-8 rounded-3xl w-full max-w-2xl shadow-2xl border border-white max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/10">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold font-headline text-on-surface">Apply for Reimbursement</h3>
                      </div>
                      <button onClick={() => setIsReimbModalOpen(false)} className="text-slate-400 hover:text-error material-symbols-outlined transition-colors">close</button>
                    </div>
                    
                    <form onSubmit={handleReimbursementSubmit} className="space-y-6">
                      
                      {/* Attach Receipt Section */}
                      <div className="bg-surface-container-low p-4 rounded-xl border border-dashed border-outline-variant/30 flex items-center justify-center relative hover:bg-primary/5 transition-colors group">
                        <label className="flex flex-col items-center justify-center w-full cursor-pointer py-2">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
                          </div>
                          <span className="text-sm font-bold text-on-surface">Attach Receipt (PDF)</span>
                          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mt-1">Required for verification</span>
                          <input 
                            required
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setReimbForm({ ...reimbForm, receiptFile: e.target.files[0] });
                                toast.info(`Attached: ${e.target.files[0].name}`);
                              }
                            }}
                          />
                        </label>
                        {reimbForm.receiptFile && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold shadow-sm flex items-center gap-1 group">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            {reimbForm.receiptFile.name}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {/* Description */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Description *</label>
                            <input required type="text" value={reimbForm.description} onChange={(e) => setReimbForm({...reimbForm, description: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="E.g., Client dinner" />
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Category *</label>
                            <input required type="text" value={reimbForm.category} onChange={(e) => setReimbForm({...reimbForm, category: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" placeholder="E.g., Travel, Meals" />
                          </div>
                          
                          {/* Amount and Currency Selection */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Amount & Currency *</label>
                            <div className="flex font-medium">
                              <select 
                                value={reimbForm.currency} 
                                onChange={(e) => setReimbForm({...reimbForm, currency: e.target.value})} 
                                className="bg-surface-container-low border-r border-outline-variant/10 text-on-surface px-4 py-3 rounded-l-xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                              >
                                <option value="$">US Dollar ($)</option>
                                <option value="Rs">Indian Rupee (Rs)</option>
                                <option value="€">Euro (€)</option>
                                <option value="£">British Pound (£)</option>
                              </select>
                              <input 
                                required 
                                type="number" 
                                step="0.01"
                                value={reimbForm.amount} 
                                onChange={(e) => setReimbForm({...reimbForm, amount: e.target.value})} 
                                className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-r-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400" 
                                placeholder="0.00" 
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1 italic tracking-wide">Submit expense in any currency. Will auto-convert in manager's view.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Expense Date */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Expense Date *</label>
                            <input required type="date" value={reimbForm.date} onChange={(e) => setReimbForm({...reimbForm, date: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" />
                          </div>

                          {/* Paid By */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Paid By *</label>
                            <select value={reimbForm.paidBy} onChange={(e) => setReimbForm({...reimbForm, paidBy: e.target.value})} className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-r-8 border-transparent focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none">
                              <option value="Personal Card">Personal Card</option>
                              <option value="Corporate Card">Corporate Card</option>
                              <option value="Cash">Cash</option>
                            </select>
                          </div>

                          {/* Remarks */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Remarks</label>
                            <textarea 
                              rows={2}
                              value={reimbForm.remarks} 
                              onChange={(e) => setReimbForm({...reimbForm, remarks: e.target.value})} 
                              className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium resize-none" 
                              placeholder="Any additional notes..." 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsReimbModalOpen(false)} className="px-6 py-4 font-bold tracking-wide rounded-xl hover:bg-surface-container-high transition-all text-on-surface">
                          Cancel
                        </button>
                        <button type="submit" className="px-8 py-4 bg-primary text-on-primary font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                          Submit Application
                        </button>
                      </div>
                    </form>
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
                <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">
                  Settings
                </h2>
                <p className="max-w-md text-on-surface-variant font-medium mt-2">
                  Manage your personal account settings and security credentials.
                </p>
              </motion.div>
            </header>

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
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" 
                    placeholder="Enter your current password" 
                  />
                </div>
                
                <div className="pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">New Password <span className="text-[9px] text-slate-400 font-normal lowercase tracking-normal">(min. 6 characters)</span></label>
                  <input 
                    required 
                    type="password"
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
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
                    onChange={(e) => setPasswordForm({...passwordForm, confirmNewPassword: e.target.value})}
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 font-medium" 
                    placeholder="Re-enter your new password" 
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="px-8 py-4 bg-primary text-on-primary font-bold tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </section>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 font-medium">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">construction</span>
              <h3 className="text-xl font-headline font-bold text-on-surface">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h3>
              <p>This section is currently under development.</p>
            </div>
          </div>
        )}

        {/* Footer Section */}
        <footer className="mt-auto pt-12 pb-6 border-t border-slate-100 flex flex-col items-center gap-6">
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Link className="hover:text-primary transition-colors" href="#">Privacy</Link>
            <Link className="hover:text-primary transition-colors" href="#">Terms</Link>
            <Link className="hover:text-primary transition-colors" href="#">Contact</Link>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© {new Date().getFullYear()} Zync.</p>
        </footer>
      </main>
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
      <EmployeeDashboardContent />
    </ProtectedRoute>
  );
}
