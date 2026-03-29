"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      toast.success("Welcome back!");
      login(response.data.token, response.data.user);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "An error occurred during login";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-mesh font-body text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-secondary/10 blur-[120px]"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side: Editorial Intent & Visual */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col gap-6 pr-8"
        >
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-primary-container rounded-lg flex items-center justify-center shadow-md shadow-primary/10 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tighter text-on-surface">Aura Hack</span>
          </Link>
          
          <div className="space-y-3">
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
              Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim italic">digital sanctuary</span>
            </h1>
            <p className="text-base text-on-surface-variant max-w-sm leading-relaxed font-medium">
              Continue your curation journey. Experience the same clarity and performance you've come to expect.
            </p>
          </div>
          
          <div className="relative group rounded-xl overflow-hidden aspect-[16/10] shadow-xl">
            <img 
              alt="Atmospheric UI Visual" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFDwmL--uLXPhncNxF_td3Rmxj6MAORvLNCXlxX7icRk9K-fXcunBIvc8W5Qoec1Gru-079aAHy55Tw4VWhQTZBhudGvTOzA16jdenxypyLT9V0hwneCkzjFytBpbC4PsCx3dp7kPhIC-Op0hLjTPPqhed51f_HA3HyW0W26QOK38K0kdIXfHHn9eyVw49sEV8MLFvMbwgAeSsycvSsGJl0mpifdwXZFOx81o58bBH-LHcfFtE9Ix8Z2z0tb-FQugJp5j9AHR2aio"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 p-3 glass-panel rounded-lg">
               <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Focus Environment</p>
              <p className="text-xs font-medium text-on-surface italic">"The clarity of the interface directly correlates to the clarity of the code."</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: The Login Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center lg:justify-end"
        >
          <div className="glass-panel w-full max-w-[400px] p-6 md:p-10 rounded-[1.5rem] shadow-lg shadow-on-surface/5">
            {/* Form Header */}
            <div className="mb-8 space-y-1.5">
              <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Welcome Back</h2>
              <p className="text-sm text-on-surface-variant font-medium">
                Don't have an account? <Link className="text-primary font-bold hover:underline" href="/signup">Sign up</Link>
              </p>
            </div>

            {/* Main Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-0.5" htmlFor="email">Email address</label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline/30 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-200 outline-none font-medium" 
                    id="email" 
                    placeholder="alex@aura.io" 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-outline/20 text-[20px]">mail</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="password">Password</label>
                  <a href="#" className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline/30 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-200 outline-none font-medium" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3.5 top-2.5 text-outline/20 text-[20px]">lock</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-0.5 pt-1">
                <input 
                  className="w-3.5 h-3.5 rounded border-outline-variant/20 text-primary focus:ring-primary/20 focus:ring-offset-0 bg-surface-container-lowest" 
                  id="remember" 
                  type="checkbox" 
                />
                <label className="text-[11px] text-on-surface-variant font-medium" htmlFor="remember">
                  Remember me for 30 days
                </label>
              </div>
              <button 
                className={`w-full bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold py-3 rounded-lg shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group mt-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`} 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <span className="text-sm">Sign In</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Form Footer */}
            <div className="mt-8 pt-6 border-t border-outline-variant/5 text-center">
              <p className="text-[9px] text-outline uppercase tracking-[0.15em] leading-relaxed font-bold opacity-60">
                Protected by reCAPTCHA. Privacy Policy applies. <br />
                © {new Date().getFullYear()} Aura Hack.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Decoration */}
      <footer className="fixed bottom-6 left-6 hidden lg:block">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[4, 5, 6].map((i) => (
              <img 
                key={i}
                alt={`User ${i}`} 
                className="w-6 h-6 rounded-full border-2 border-surface-container-lowest object-cover" 
                src={`https://i.pravatar.cc/100?img=${i+30}`} 
              />
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-secondary-container flex items-center justify-center text-[8px] font-bold text-on-secondary-container">+12k</div>
          </div>
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">Join 12,000+ hackers curated for excellence.</p>
        </div>
      </footer>
    </div>
  );
}
