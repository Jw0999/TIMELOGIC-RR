import Image from "next/image";
import type { CSSProperties } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  theme?: "dark" | "light";
}

/**
 * Brand mark: Authentic TimeLogic clock logo with transparent background.
 * Renders crisp electric-cyan mark on dark backgrounds and deep navy on light surfaces.
 */
export function Logo({ size = 36, className, theme = "dark" }: LogoProps) {
  const iconSrc = theme === "light" ? "/logo-mark-transparent.png" : "/logo-mark-cyan.png";

  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={iconSrc}
        alt="TimeLogic Mark"
        width={size}
        height={size}
        className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all duration-200"
      />
    </span>
  );
}

export function Wordmark({
  className,
  style,
  theme = "dark",
}: {
  className?: string;
  style?: CSSProperties;
  theme?: "dark" | "light";
}) {
  return (
    <span className={`tracking-tight font-bold select-none ${className ?? ""}`} style={style}>
      <span className={theme === "light" ? "text-slate-900" : "text-white"}>Time</span>
      <span className="text-sky-400">Logic</span>
    </span>
  );
}

export function BrandLockup({
  size = 34,
  className,
  theme = "dark",
}: {
  size?: number;
  className?: string;
  theme?: "dark" | "light";
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <Logo size={size} theme={theme} />
      <Wordmark theme={theme} className="text-lg font-bold" />
    </span>
  );
}
