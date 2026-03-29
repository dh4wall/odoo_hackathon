"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-background min-h-screen text-on-surface antialiased overflow-x-hidden font-body">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] no-line bg-slate-50/50">
        <nav className="flex justify-between items-center px-8 h-16 w-full max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-slate-900 font-headline tracking-tight">
            Aura Hack
          </Link>
          <div className="hidden md:flex items-center gap-8 font-headline">
            <Link
              className="text-primary font-semibold border-b-2 border-primary tracking-tight transition-all py-1"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-slate-600 hover:text-primary tracking-tight transition-all font-medium"
              href="#"
            >
              About
            </Link>
            {!isAuthenticated && (
              <Link
                className="text-slate-600 hover:text-primary tracking-tight transition-all font-medium"
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
                className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-2 rounded-lg font-bold tracking-tight transition-all active:scale-95 duration-200"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="bg-primary hover:bg-primary-dim text-on-primary px-6 py-2 rounded-lg font-bold tracking-tight transition-all active:scale-95 duration-200"
              >
                Get Started
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="hero-mesh relative overflow-hidden min-h-[921px] flex items-center px-8">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">
                The Future of Digital Curation
              </div>
              <h1 className="text-6xl md:text-7xl font-headline font-extrabold text-on-surface tracking-tighter leading-[1.05]">
                Design with <span className="text-primary italic">Atmospheric</span> Depth.
              </h1>
              <p className="text-xl text-on-surface-variant max-w-xl leading-relaxed">
                Moving beyond rigid SaaS templates. Aura Hack delivers a high-end editorial experience that feels like a premium digital gallery.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="electric-indigo-gradient text-on-primary px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center"
                >
                  Start Building Now
                </Link>
                <button className="px-8 py-4 rounded-xl font-bold text-lg border border-outline-variant/20 hover:bg-surface-container-high transition-all text-on-surface">
                  View Showcase
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative z-10 glass-card p-4 rounded-[2rem] shadow-2xl">
                <motion.img 
                  initial={{ filter: "blur(10px)" }}
                  whileInView={{ filter: "blur(0px)" }}
                  transition={{ duration: 1 }}
                  alt="Abstract Glass Art" 
                  className="rounded-[1.5rem] w-full aspect-[4/5] object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoIXFcV0dBWJVNPQacrIzVPonMFju5MRS4VfU0l_9PWRQ2UJlLuNACf0QohDR-N-KedQY-fTLWB1spQcQVZG0_zfyvNI1OOVOjbF41rUTMH44HZamf7ubPPSsrMoOcTYgJi7QMH06UzCP0nmBFWRxErOGYpebon0GsWLxOwZnpXW88appRBEDwC_omNEFysOCKuX52PTjThFJsQZIS45WSNaRj6AciMZSV31OPnlCVVvdHXxq3tqS5C2PKAW6OSmYcWGxmPFvD104"
                />
                <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl max-w-[200px] shadow-xl">
                  <p className="text-sm font-bold text-primary mb-1">Curation Alpha</p>
                  <p className="text-xs text-on-surface-variant leading-tight">Optimized for high-luminance editorial displays.</p>
                </div>
              </div>
              {/* Decorative Orbs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] -z-10"></div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Info Section */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface mb-6">
                  Intentional Asymmetry.
                </h2>
                <p className="text-lg text-on-surface-variant">
                  We prioritize breathing room over density. Our system uses tonal shifts instead of structural lines to guide the eye naturally through information.
                </p>
              </div>
              <div className="hidden md:block">
                <span className="material-symbols-outlined text-6xl text-primary-fixed-dim" style={{ fontSize: '64px' }}>grid_view</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Item 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="md:col-span-2 bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all"
              >
                <div>
                  <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-on-secondary-container">layers</span>
                  </div>
                  <h3 className="text-2xl font-headline font-bold mb-4">The Layering Principle</h3>
                  <p className="text-on-surface-variant leading-relaxed max-w-md">
                    Avoid traditional shadows. We use a three-tier surface stack to create natural lift that feels organic and premium.
                  </p>
                </div>
                <div className="mt-12 overflow-hidden rounded-xl h-48">
                  <img 
                    alt="Layered UI Elements" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXTFY4eDvNdFCBcOlJctlKJ5W19nJhCugwfOw5UN2Bh96YxhKCOg8i1PUbIrl-6DWBUckWpvabxx8jr7oGZyaUY2bhSMpOa3E638NXLiYuAtC2wpsAoSk7t0P3Gk1bkKv90yFKeGMkiPlZO18jp5bOchn975DwoNc8_fjpc-rfywoL-txqNbHK3d2gE28xVR446B63qeXt8llG1-amIwTGUjCYv6hG5B9ZNMVag4HY594CRzRLvJSFmGpMOoAYVvaXzCgYltMXJ1A"
                  />
                </div>
              </motion.div>
              
              {/* Bento Item 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-primary p-8 rounded-[1.5rem] text-on-primary flex flex-col justify-between shadow-xl shadow-primary/20"
              >
                <h3 className="text-2xl font-headline font-bold mb-6 italic leading-snug">"The design is not just what it looks like, but how it feels to touch the light."</h3>
                <div>
                  <p className="font-bold font-headline">Editorial Vision</p>
                  <p className="text-primary-container text-sm">2026 Guidelines</p>
                </div>
              </motion.div>
              
              {/* Bento Item 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-tertiary-container rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-tertiary-container">auto_awesome</span>
                </div>
                <h3 className="text-xl font-headline font-bold mb-3">Electric Indigo</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Our signature gradients provide the "soul" of the brand, preventing minimalism from feeling cold.
                </p>
              </motion.div>
              
              {/* Bento Item 4 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 bg-surface-container-lowest p-8 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-headline font-bold mb-3">No-Line Philosophy</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Borders are prohibited for sectioning. We use background color shifts to define space, creating a "gallery" feel that flows without interruption.
                  </p>
                </div>
                <div className="w-full md:w-1/2 h-40 bg-background rounded-xl flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-mesh opacity-50"></div>
                  <div className="w-2/3 h-1/2 glass-card rounded-lg shadow-sm relative z-10"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Curator Praise Section */}
        <section className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-headline font-extrabold tracking-tight mb-4 uppercase tracking-[0.2em] text-primary">Curator Praise</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  role: "Design Lead, Flux Media",
                  text: '"The transition from standard SaaS layouts to Aura Glass was a revelation. Our conversion rate increased by 40% as users felt they were in a premium space."',
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVrWtW9In3IOwok2OR3yBDT00hyDT6eXgsxGpLu6uZiNaMwnq_G1Jlav60NU1bBKYSoXzCuT4uL7ipRZ3Q1rCm26DTVroiO9znRc9vpzAq3reG9dxtFjhBfFtkImMwBix7OfSmUeOx3GVVYm2HWpi5qhW6bak_sW8ApNvEE2N09E3Cqxa7o-woK3_r2P70U3PNTlh7DDJMZ8OWyTSawKr7xNkPWkpEyFxZ_fT5EkumEsNtzZgo8E8O2LDchaVYbR2AgAC-P-FXVg"
                },
                {
                  name: "Marcus Rivers",
                  role: "CEO, Aura Labs",
                  text: '"Atmospheric depth is the secret sauce. The \'No-Line\' rule makes everything look so much more expensive and polished. Highly recommended."',
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuKiF7SlQPq8DMSsdT0aBq9I7cDnm7jFDhJedyIOqYG2rWBNKx3RgZz5gjoPbg_4lBSvNiQ1SuyDUctnxIqR05GDwZPo0YPXquYZNHwaqYZzSy_QfKs8trfdYbNYnVO3fVtEwT_gmPnWS5trhA9afsMG6Jfey-E9EX4X4_YdpVVVlnI4P-fkapu45zXfecs5S8MZX9BQaNILoHAFMJzlL87NjdgPm4F3CidrDI8tjGzXUZh3DvJYmB7egtYViHotODsht2ZkyeqLY"
                },
                {
                  name: "Elena Rodriguez",
                  role: "Product Manager, Curate IT",
                  text: '"Finally a design system that understands whitespace. It\'s like walking through a high-end gallery but for my data. Simply beautiful."',
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUJUPAGP0GV74uRLwK6spfTY6rz3vpoQ2l1fPLlaPm8WbOlA42a3Bjwg9K7lvR7xvh03G5f-V7GXekgk6JdAKNCA7TGbcpPAlHbh-kw1luPu3lCylmydutwBX3GPXCMfCTxgGlX_JtGCa3eCMaXu1uAPHPav6MUyETYmPrwi3-W7AV4xn7Eicu2rig4Bi1hIYk6L0_I0B_--kMiAIAKuHa_3bvsPNPiqVUy3S-35SV5fIYPnM9WNtf-B5vc9hMcwg55hwK_XckJZs"
                }
              ].map((review, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="glass-card p-8 rounded-2xl"
                >
                  <div className="flex gap-1 text-primary mb-6">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <p className="text-on-surface font-medium leading-relaxed mb-8">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
                      <img alt="Profile" className="w-full h-full object-cover" src={review.img} />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-headline">{review.name}</p>
                      <p className="text-xs text-on-surface-variant font-medium">{review.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 electric-indigo-gradient -z-10"></div>
          <div className="max-w-4xl mx-auto px-8 text-center text-on-primary">
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight mb-6">Ready to Elevate Your Interface?</h2>
            <p className="text-lg text-primary-container mb-10 max-w-2xl mx-auto opacity-90 font-medium">
              Join over 12,000+ teams building the next generation of high-end digital experiences with Aura Hack.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:bg-slate-50 transition-all active:scale-95"
              >
                Get Started Free
              </Link>
              <button className="px-8 py-4 rounded-xl font-bold text-base border-2 border-white/30 hover:bg-white/10 transition-all">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 font-body text-[10px] uppercase tracking-widest bg-surface-container-low border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-slate-400">
            © {new Date().getFullYear()} Aura Hack. All rights reserved.
          </div>
          <div className="flex justify-center gap-8 text-slate-400">
            <Link className="hover:text-primary transition-colors opacity-80 hover:opacity-100 font-bold" href="#">Privacy</Link>
            <Link className="hover:text-primary transition-colors opacity-80 hover:opacity-100 font-bold" href="#">Terms</Link>
            <Link className="hover:text-primary transition-colors opacity-80 hover:opacity-100 font-bold" href="#">Contact</Link>
          </div>
          <div className="flex justify-end gap-6 text-slate-400">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">language</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
