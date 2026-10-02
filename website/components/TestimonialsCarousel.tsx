"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Quote,
} from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  industry: string;
  headcount: string;
  initials: string;
  accent: string;
}

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials: Testimonial[] = [
    {
      quote:
        "TimeLogic completely eliminated clock-in disputes across our three hospital shifts. The facial anti-spoofing is bulletproof—staff can no longer cover for absent or late colleagues.",
      author: "Dr. Farouk Al-Mansoor",
      role: "Chief Medical Director",
      company: "Apex Specialist Hospitals",
      industry: "Healthcare & Clinical Care",
      headcount: "140 Medical Staff",
      initials: "FA",
      accent: "from-blue-600 to-cyan-500",
    },
    {
      quote:
        "Our warehouse staff previously bypassed mobile GPS apps using mock-location tools. TimeLogic's hardware-bound kiosk terminal stopped fake check-ins overnight. Payroll reconciliation dropped from 4 days to 10 minutes.",
      author: "Engr. Chioma Okonkwo",
      role: "VP of Operations",
      company: "Crestline Logistics & Freight",
      industry: "Supply Chain & Warehousing",
      headcount: "280 Workers",
      initials: "CO",
      accent: "from-cyan-500 to-teal-500",
    },
    {
      quote:
        "The 1-click Excel payroll export gave us mathematical certainty on overtime and break deductions. We recovered over ₦1.8M in leaked payroll within the first 60 days of deploying on-premise kiosks.",
      author: "Tunde Adebayo, FCA",
      role: "Chief Financial Officer",
      company: "Horizon Capital Partners",
      industry: "Financial Services",
      headcount: "85 Professionals",
      initials: "TA",
      accent: "from-indigo-600 to-blue-500",
    },
    {
      quote:
        "Managing our faculty shifts and student cohorts was an administrative nightmare. TimeLogic's kiosk check-in and automated fraud ledger brought total transparency across all our campus gates.",
      author: "Hajia Amina Bello",
      role: "Registrar",
      company: "Premier Academy & Polytechnic",
      industry: "Higher Education",
      headcount: "420 Staff & Students",
      initials: "AB",
      accent: "from-sky-500 to-blue-600",
    },
    {
      quote:
        "Shift workers taking unmonitored prayer and lunch breaks was our single largest productivity leak. The automatic overstay alerts created immediate accountability without supervisors having to intervene.",
      author: "Olumide Williams",
      role: "Plant Director",
      company: "Atlantic Food Processing Ltd",
      industry: "Manufacturing & FMCG",
      headcount: "195 Factory Workers",
      initials: "OW",
      accent: "from-teal-500 to-emerald-500",
    },
  ];

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  return (
    <section className="py-20 sm:py-28 bg-[#090D1A] text-white relative overflow-hidden border-t border-white/[0.08]">
      {/* Subtle radial lighting */}
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10 space-y-12 sm:space-y-16">
        
        {/* Header & Navigation Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/50 border border-blue-400/30 text-xs font-mono font-medium text-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Testimonials & Case Studies</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.18]">
              Trusted By{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-500">
                Leading Organizations
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Read how managing executives, medical directors, and operations heads rely on TimeLogic to maintain tamper-proof workforce attendance.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="w-11 h-11 rounded-full border border-white/[0.12] bg-[#0E1529] hover:bg-white/[0.08] hover:border-cyan-400/40 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-11 h-11 rounded-full border border-white/[0.12] bg-[#0E1529] hover:bg-white/[0.08] hover:border-cyan-400/40 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ── Carousel Slider ── */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative"
        >
          {/* Main Active Testimonial Card */}
          <div className="rounded-3xl border border-white/[0.12] bg-[#0c1224]/90 backdrop-blur-xl p-7 sm:p-12 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Ambient subtle glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-[300px] h-[300px] bg-cyan-500/10 blur-[90px] rounded-full" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Quote & Stars */}
              <div className="lg:col-span-8 space-y-6">
                {/* 5-Star Rating */}
                <div className="flex items-center gap-1.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" stroke="none" />
                  ))}
                  <span className="ml-2 text-xs font-mono font-semibold text-slate-300">
                    5.0 Verified Deployment
                  </span>
                </div>

                {/* Big Quote */}
                <div className="relative">
                  <Quote size={40} className="text-cyan-400/20 absolute -top-5 -left-4 pointer-events-none" />
                  <p className="text-lg sm:text-2xl text-slate-100 font-medium leading-relaxed tracking-tight relative z-10">
                    "{testimonials[current].quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base bg-gradient-to-br ${testimonials[current].accent} shadow-md flex-shrink-0`}
                  >
                    {testimonials[current].initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {testimonials[current].author}
                      </h4>
                      <ShieldCheck size={16} className="text-cyan-400" />
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">
                      {testimonials[current].role} · <span className="text-slate-300 font-medium">{testimonials[current].company}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Organization Metadata Box */}
              <div className="lg:col-span-4 bg-[#070b16] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  <Building2 size={14} />
                  <span>Deployment Profile</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">Industry</div>
                    <div className="font-semibold text-white mt-0.5">{testimonials[current].industry}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">Verified Headcount</div>
                    <div className="font-semibold text-cyan-300 mt-0.5">{testimonials[current].headcount}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">Infrastructure</div>
                    <div className="text-slate-300 mt-0.5">TimeLogic On-Premise Biometric Kiosks</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Verified Enterprise Customer</span>
                </div>
              </div>

            </div>
          </div>

          {/* Indicator Dot Pills */}
          <div className="mt-8 flex items-center justify-center gap-2.5">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  current === idx
                    ? "w-8 bg-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.6)]"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
