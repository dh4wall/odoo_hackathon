"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function About() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-[#f3f7fb] min-h-screen text-[#2a2f32] antialiased overflow-x-hidden font-sans">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
        <nav className="flex justify-between items-center px-8 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight font-heading">
            Aura Hack
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              className="text-slate-600 hover:text-[#4a40e0] tracking-tight transition-all font-heading"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-[#4a40e0] font-semibold border-b-2 border-[#4a40e0] tracking-tight transition-all py-1 font-heading"
              href="/about"
            >
              About
            </Link>
            {!isAuthenticated && (
              <Link
                className="text-slate-600 hover:text-[#4a40e0] tracking-tight transition-all font-heading"
                href="/login"
              >
                Login
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="bg-[#4a40e0] hover:bg-[#3d30d4] text-[#f4f1ff] px-6 py-2 rounded-lg font-bold tracking-tight transition-all active:scale-95 duration-200"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="bg-[#4a40e0] hover:bg-[#3d30d4] text-[#f4f1ff] px-6 py-2 rounded-lg font-bold tracking-tight transition-all active:scale-95 duration-200"
              >
                Get Started
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-20">
        <section className="relative px-8 pt-20 pb-32 max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[600px] text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center z-10"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-slate-900 leading-[1.1] tracking-tight mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a40e0] to-[#fd8bca]">Aura Hack</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              Aura Hack is a modern web application designed to demonstrate the power of Next.js 15, Tailwind CSS, Express.js, and PostgreSQL working seamlessly together. Our mission is to provide developers with a robust, scalable, and beautifully designed template for their next big idea.
            </p>

            <div className="bg-white/60 backdrop-blur-md border border-slate-200 p-8 rounded-2xl shadow-xl text-left w-full mt-8">
              <h2 className="text-2xl font-bold font-heading text-slate-900 mb-4">Our Technology Stack</h2>
              <ul className="space-y-4 text-slate-600">
                <li className="flex items-start gap-3">
                  <div className="bg-[#4a40e0]/10 text-[#4a40e0] p-1 rounded">✅</div>
                  <div><strong>Frontend:</strong> Next.js 15 App Router, React, Tailwind CSS v4, Framer Motion, Lucide Icons.</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-[#4a40e0]/10 text-[#4a40e0] p-1 rounded">✅</div>
                  <div><strong>Backend:</strong> Express.js, Node.js, JSON Web Tokens (JWT) for secure authentication.</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-[#4a40e0]/10 text-[#4a40e0] p-1 rounded">✅</div>
                  <div><strong>Database:</strong> PostgreSQL, Neon.tech for modern serverless database capabilities.</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-[#4a40e0]/10 text-[#4a40e0] p-1 rounded">✅</div>
                  <div><strong>Design:</strong> Glassmorphism UI, custom CSS variables, responsive modern design.</div>
                </li>
              </ul>
            </div>
            
          </motion.div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4a40e0] rounded-lg"></div>
            <span className="text-white font-bold font-heading text-xl">Aura Hack</span>
          </div>
          <p>© {new Date().getFullYear()} Aura Hack Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
