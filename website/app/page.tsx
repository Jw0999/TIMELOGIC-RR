"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InteractiveFeatures } from "@/components/InteractiveFeatures";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#07090E] text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-white">
      {/* ── 1. HEADER / NAVBAR: Floating glass pill navigation bar ── */}
      <Header />

      <main id="main" className="w-full flex-1">
        {/* ── 2. HERO SECTION: Dark Cinematic Canvas & Animated Workflow Circuit Flow ── */}
        <Hero />

        {/* ── 3. INTERACTIVE FEATURES: High-Clarity Crisp White Canvas with Synchronized Preview Panel ── */}
        <InteractiveFeatures />

        {/* ── 4. METRICS & PERFORMANCE CHART: Dark Dashboard Canvas with Interactive Area Curve ── */}
        <MetricsDashboard />

        {/* ── 5. TESTIMONIALS CAROUSEL: Verified Reviews Carousel with Arrow Controls ── */}
        <TestimonialsCarousel />

        {/* ── 6. FINAL HIGH-CONVERSION CTA: 24h Deployment Guarantee & Direct Onboarding ── */}
        <CtaBanner />
      </main>

      {/* ── 7. FOOTER: Multi-Column Directory & Back-to-Top Button ── */}
      <Footer />
    </div>
  );
}
