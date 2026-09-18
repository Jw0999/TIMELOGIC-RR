"use client";

import React from "react";
import {
  ChevronRight,
  Star,
  Wifi,
  Smartphone,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";
import { Header } from "./Header";

interface HeroProps {
  onRegisterClick?: () => void;
  onCallClick?: () => void;
}

export function Hero({ onRegisterClick, onCallClick }: HeroProps) {
  return (
    <section className="relative w-full max-w-[1360px] mx-auto pt-2 pb-8 sm:pb-12">
      {/* ── Outer Card Frame (matching reference image mockup) ────────────────── */}
      <div className="relative w-full rounded-[32px] sm:rounded-[44px] overflow-hidden border border-white/10 bg-[#070b18] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.95)]">
        
        {/* ── Ambient Background Lighting Effects ── */}
        {/* Top-left warm peach / golden amber light */}
        <div className="pointer-events-none absolute -top-28 -left-24 h-[560px] w-[560px] rounded-full bg-gradient-to-br from-amber-300/30 via-orange-400/20 to-transparent blur-[110px] opacity-80" />
        
        {/* Central royal purple / electric blue nebula */}
        <div className="pointer-events-none absolute top-1/2 left-[62%] -translate-x-1/2 -translate-y-1/2 h-[720px] w-[720px] rounded-full bg-gradient-to-tr from-indigo-600/40 via-blue-600/30 to-purple-800/20 blur-[130px] opacity-85" />

        {/* Deep dark obsidian vignette overlay */}
        <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-black/20 to-black/60" />

        {/* ── Top Header Navigation inside the Card ── */}
        <Header onRegisterClick={onRegisterClick} onCallClick={onCallClick} />

        {/* ── Hero Main Content Grid ────────────────────────────────────────── */}
        <div className="relative z-10 px-6 sm:px-12 lg:px-16 pt-6 sm:pt-10 pb-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* ── Left Column: Headline, Subtitle, CTA Button ──────────────── */}
            <div className="lg:col-span-6 flex flex-col justify-center text-left">
              <h1 className="text-[36px] sm:text-[50px] lg:text-[56px] xl:text-[62px] font-bold text-white tracking-[-0.035em] leading-[1.12]">
                Unlock The Ultimate<br />
                Attendance System,<br />
                <span className="text-white/80 font-normal">
                  Now Just One<br />
                  Click Away!
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm sm:text-base text-slate-300/80 leading-relaxed font-normal">
                Verify workforce check-ins with tamper-proof Wi-Fi binding, biometric security, and live geolocation. Built for teams that value honesty.
              </p>

              {/* Action row with Register Button + Figma-style Cursor Tag */}
              <div className="mt-8 sm:mt-10 flex items-center gap-5 flex-wrap">
                <a
                  href="https://timelogic.pages.dev/register"
                  onClick={onRegisterClick}
                  className="relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0a0d18] hover:bg-[#12182c] text-white text-[14.5px] font-semibold border border-white/20 hover:border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group"
                >
                  <span>Register</span>
                  <ChevronRight
                    size={16}
                    className="text-white/70 group-hover:translate-x-1 transition-transform"
                  />
                </a>

                {/* Signature interactive cursor tag (David) from reference */}
                <div className="relative inline-flex items-center gap-1.5 transition-transform duration-300 hover:translate-x-1 hover:-translate-y-0.5 select-none">
                  <svg
                    className="w-4 h-4 text-violet-400 fill-violet-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] -rotate-12"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 2l16 11-7.5 1.5L8.5 22z" />
                  </svg>
                  <span className="px-3.5 py-1 rounded-full bg-violet-600/95 text-white text-[12px] font-semibold shadow-[0_4px_16px_rgba(124,58,237,0.5)] border border-violet-400/40 tracking-wide">
                    David
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right Column: Spiral / Orbital Connected Network ─────────── */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="relative w-full max-w-[500px] sm:max-w-[540px] aspect-square flex items-center justify-center">
                
                {/* ── SVG Orbital Concentric Circles & Spiral Connector ──────── */}
                <svg
                  viewBox="0 0 540 540"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  fill="none"
                >
                  {/* Orbit Ring 1 (Inner, r=85) */}
                  <circle
                    cx="270"
                    cy="270"
                    r="85"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                  />
                  {/* Orbit Ring 2 (Middle-inner, r=145) */}
                  <circle
                    cx="270"
                    cy="270"
                    r="145"
                    stroke="rgba(255, 255, 255, 0.14)"
                    strokeWidth="1"
                  />
                  {/* Orbit Ring 3 (Middle-outer, r=205) */}
                  <circle
                    cx="270"
                    cy="270"
                    r="205"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                  />
                  {/* Orbit Ring 4 (Outer, r=255) */}
                  <circle
                    cx="270"
                    cy="270"
                    r="255"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />

                  {/* Continuous connected spiral curve weaving through the nodes */}
                  <path
                    d="M 314 27 C 220 35 150 90 211 143 C 160 170 85 180 77 218 C 65 290 90 340 102 367 C 140 420 200 400 233 348 C 255 315 285 300 310 320 C 350 350 360 380 382 364 C 420 340 410 240 400 194 C 390 140 480 240 504 311"
                    stroke="rgba(167, 139, 250, 0.3)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />

                  {/* Subtle Node Dots along orbits */}
                  <circle cx="270" cy="125" r="2.5" fill="#60a5fa" className="animate-pulse" />
                  <circle cx="475" cy="270" r="2.5" fill="#f43f5e" className="animate-pulse" />
                  <circle cx="270" cy="475" r="2.5" fill="#a855f7" className="animate-pulse" />
                  <circle cx="65" cy="270" r="2.5" fill="#f59e0b" className="animate-pulse" />
                </svg>

                {/* ── Center Piece: 5-Star Rating (User explicitly requested) ── */}
                <div className="relative z-20 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
                  {/* Glowing 5-Star Row */}
                  <div className="flex items-center gap-1 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className="text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]"
                      />
                    ))}
                  </div>

                  {/* Big bold rating headline */}
                  <div className="text-[36px] sm:text-[44px] font-black text-white tracking-tight leading-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)]">
                    5.0
                  </div>

                  {/* Rating Subtitle */}
                  <div className="text-[12px] font-semibold text-slate-300/85 tracking-wider mt-1.5 uppercase">
                    Top Rated System
                  </div>
                </div>

                {/* ── Positioned Floating Elements on Orbits ────────────────── */}

                {/* 1. Avatar: Top Outer ring (~12:30 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "5%", left: "58%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-indigo-400 to-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.7)]">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                      alt="Verified Employee"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* 2. Squircle Card: Blue Glowing (Wi-Fi) - Ring 2 (~11 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "26%", left: "39%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#09122a] border border-blue-400/40 flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.85)]">
                    <Wifi size={20} className="text-blue-400 drop-shadow-[0_0_8px_#60a5fa]" />
                  </div>
                </div>

                {/* 3. Avatar: Ring 2 (~2 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "36%", left: "74%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 to-orange-500 shadow-[0_0_16px_rgba(245,158,11,0.7)]">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                      alt="Verified Employee"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* 4. Squircle Card: Pink Glowing (Smartphone Device) - Outer ring (~3:15 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "58%", left: "93%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#220914] border border-pink-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(236,72,153,0.85)]">
                    <Smartphone size={20} className="text-pink-400 drop-shadow-[0_0_8px_#f472b6]" />
                  </div>
                </div>

                {/* 5. Squircle Card: Violet Glowing (Security Shield) - Ring 2 (~4:15 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "67%", left: "71%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1b0d2d] border border-purple-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.85)]">
                    <ShieldCheck size={20} className="text-purple-400 drop-shadow-[0_0_8px_#c084fc]" />
                  </div>
                </div>

                {/* 6. Avatar: Ring 3 (~5:45 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "86%", left: "56%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 to-indigo-500 shadow-[0_0_16px_rgba(244,63,94,0.7)]">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces"
                      alt="Verified Employee"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* 7. Avatar: Inner ring (~7:15 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "65%", left: "43%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-[0_0_14px_rgba(16,185,129,0.7)]">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
                      alt="Verified Employee"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* 8. Squircle Card: Amber Glowing (Team / Users) - Ring 3 (~8 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "68%", left: "19%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#231507] border border-amber-500/40 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.85)]">
                    <Users size={20} className="text-amber-400 drop-shadow-[0_0_8px_#fbbf24]" />
                  </div>
                </div>

                {/* 9. Avatar: Ring 3 (~9:45 o'clock) */}
                <div
                  className="absolute z-20 transition-transform duration-300 hover:scale-110"
                  style={{ top: "40%", left: "14%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 to-indigo-500 shadow-[0_0_16px_rgba(96,165,250,0.7)]">
                    <img
                      src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces"
                      alt="Verified Employee"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom Partner / Client Proof Logos (matching reference image) ── */}
        <div className="relative z-10 w-full px-6 sm:px-12 py-7 border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="flex items-center justify-around sm:justify-between flex-wrap gap-6 text-slate-400/70 font-semibold tracking-wide">
            
            {/* Logo 1: Dreamure */}
            <div className="flex items-center gap-2 text-sm sm:text-base hover:text-white transition-colors duration-200 cursor-default">
              <svg className="w-4 h-4 fill-current text-indigo-400/80" viewBox="0 0 24 24">
                <polygon points="12,2 22,20 2,20" />
              </svg>
              <span className="font-bold tracking-tight text-slate-300">Dreamure</span>
            </div>

            {/* Logo 2: SWITCH.WIN */}
            <div className="flex items-center gap-2 text-sm sm:text-base hover:text-white transition-colors duration-200 cursor-default">
              <span className="font-extrabold tracking-widest uppercase text-slate-300">SWITCH.WIN</span>
            </div>

            {/* Logo 3: Glowsphere */}
            <div className="flex items-center gap-2 text-sm sm:text-base hover:text-white transition-colors duration-200 cursor-default">
              <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
              <span className="font-semibold lowercase text-slate-300">glowsphere</span>
            </div>

            {/* Logo 4: PinSpace */}
            <div className="flex items-center gap-2 text-sm sm:text-base hover:text-white transition-colors duration-200 cursor-default">
              <svg className="w-4 h-4 fill-current text-sky-400/80" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
                <path d="M12 2a10 10 0 0 0-10 10c0 7 10 12 10 12s10-5 10-12a10 10 0 0 0-10-10z" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="font-bold tracking-tight text-slate-300">PinSpace</span>
            </div>

            {/* Logo 5: Visionix */}
            <div className="flex items-center gap-2 text-sm sm:text-base hover:text-white transition-colors duration-200 cursor-default">
              <Sparkles size={16} className="text-purple-400/80" />
              <span className="font-bold tracking-tight text-slate-300">Visionix</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
