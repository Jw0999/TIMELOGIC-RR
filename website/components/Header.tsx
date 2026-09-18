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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08090d]/90 backdrop-blur-md">
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
                      ? "text-white bg-white/[0.06]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
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

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.08] bg-[#08090d] px-6 py-5 sm:hidden space-y-4 animate-in fade-in slide-in-from-top-1">
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "text-white bg-white/[0.08]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-3">
            <div className="text-xs text-slate-400">Direct Deployment Line:</div>
            <Button
              variant="primary"
              size="md"
              href="tel:09036627043"
              onClick={onCallClick}
              icon={<PhoneCall size={14} />}
              className="w-full"
            >
              Call 09036627043
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
