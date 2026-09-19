"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall, Menu, X, Building2 } from "lucide-react";
import { Logo, Wordmark } from "./ui/Logo";
import { Button } from "./ui/Button";

interface HeaderProps {
  onCallClick?: () => void;
}

export function Header({ onCallClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Solution", href: "/solution" },
    { label: "Pricing", href: "/pricing" },
    { label: "Post", href: "/post" },
    { label: "Investors", href: "/investors" },
    { label: "Team", href: "/team" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070e24]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo + Primary Nav */}
        <div className="flex items-center gap-10">
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
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-white/[0.1] font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
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
            href="tel:09036627043"
            onClick={onCallClick}
            icon={<PhoneCall size={13} />}
            className="text-xs text-white border-white/20 hover:bg-white/10"
          >
            Call 09036627043
          </Button>

          <Button
            variant="primary"
            size="sm"
            href="/register"
            icon={<Building2 size={13} />}
            className="text-xs font-bold shadow-md hover:shadow-lg"
          >
            Register Organisation
          </Button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-lg focus:outline-none transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="border-b border-white/[0.1] bg-[#070e24] px-6 py-5 sm:hidden space-y-4 shadow-2xl relative z-50 animate-in fade-in duration-150"
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "text-white bg-blue-600/30 border border-blue-500/40 font-semibold"
                      : "text-slate-200 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/[0.1] flex flex-col gap-2.5">
            <Button
              variant="primary"
              size="md"
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              icon={<Building2 size={15} />}
              className="w-full justify-center py-2.5 text-sm font-bold shadow-md"
            >
              Register Organisation
            </Button>

            <Button
              variant="outline"
              size="md"
              href="tel:09036627043"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onCallClick) onCallClick();
              }}
              icon={<PhoneCall size={15} />}
              className="w-full justify-center py-2.5 text-sm text-white border-white/20 hover:bg-white/10"
            >
              Call 09036627043
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
