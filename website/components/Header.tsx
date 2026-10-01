"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Menu, X, ArrowRight } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";
import { Button } from "./ui/Button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Overview", href: "/" },
    { label: "Architecture", href: "/solution" },
    { label: "System UI", href: "/post" },
    { label: "Monthly Plans", href: "/pricing" },
    { label: "Investors", href: "/investors" },
    { label: "Team", href: "/team" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070d1e]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo + Primary Nav */}
        <div className="flex items-center gap-8 lg:gap-10">
          <Link href="/" className="flex items-center gap-3 group select-none">
            <Logo size={32} />
            <Wordmark className="text-lg font-bold tracking-tight text-white" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-white/[0.1] font-semibold"
                      : "text-slate-200 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Direct Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            href="https://wa.me/2349113380364"
            icon={<MessageSquare size={13} />}
            className="text-xs text-white border-white/20 hover:bg-white/10"
          >
            Chat on WhatsApp
          </Button>

          <Button
            variant="primary"
            size="sm"
            href="/pricing"
            icon={<ArrowRight size={13} />}
            className="text-xs font-semibold shadow-xs"
          >
            Deploy Plans
          </Button>
        </div>

        {/* Mobile: Hamburger Toggle Button */}
        <div className="flex sm:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-slate-200 hover:text-white hover:bg-white/[0.08] rounded-lg focus:outline-none transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="border-b border-white/[0.08] bg-[#070d1e] px-6 py-5 sm:hidden space-y-4 shadow-2xl relative z-50 animate-in fade-in duration-150"
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-blue-600/25 border border-blue-500/30 font-semibold"
                      : "text-slate-200 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
            <Button
              variant="primary"
              size="md"
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              icon={<ArrowRight size={14} />}
              className="w-full justify-center py-2 text-xs font-semibold shadow-xs"
            >
              View Monthly Plans
            </Button>

            <Button
              variant="outline"
              size="md"
              href="https://wa.me/2349113380364"
              onClick={() => setMobileMenuOpen(false)}
              icon={<MessageSquare size={14} />}
              className="w-full justify-center py-2 text-xs text-white border-white/20 hover:bg-white/10"
            >
              Chat on WhatsApp (+2349113380364)
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
