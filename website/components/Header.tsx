"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall, Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo + Primary Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 group select-none">
            <Logo size={32} />
            <Wordmark className="text-lg font-bold tracking-tight text-slate-950" />
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
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Direct Action Button */}
        <div className="hidden sm:flex items-center gap-4">
          <Button
            variant="primary"
            size="sm"
            href="tel:09036627043"
            onClick={onCallClick}
            icon={<PhoneCall size={13} />}
          >
            Call 09036627043
          </Button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors"
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
          className="border-b border-slate-200 bg-white px-6 py-5 sm:hidden space-y-4 shadow-xl relative z-50 animate-in fade-in duration-150"
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
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Direct Deployment Line:
            </div>
            <Button
              variant="primary"
              size="md"
              href="tel:09036627043"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onCallClick) onCallClick();
              }}
              icon={<PhoneCall size={15} />}
              className="w-full justify-center py-3 text-base shadow-sm"
            >
              Call 09036627043
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
