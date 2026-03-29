"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

function DashboardContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="bg-background font-body text-on-surface antialiased flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-transparent flex flex-col py-6 gap-4 font-body text-sm z-40">
        <div className="px-6 mb-8">
          <Link href="/" className="text-lg font-bold text-primary tracking-tight font-headline">Aura Hack</Link>
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
          {[
            { id: "dashboard", icon: "dashboard", label: "Dashboard" },
            { id: "projects", icon: "folder_open", label: "Projects" },
            { id: "team", icon: "groups", label: "Team" },
            { id: "settings", icon: "settings", label: "Settings" }
          ].map((tab) => (
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
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© {new Date().getFullYear()} Aura Glass Hackathon.</p>
        </footer>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
