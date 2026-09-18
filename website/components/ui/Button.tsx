import React from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  external?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium shadow-sm border border-blue-500/50 hover:border-blue-400/80 transition-colors",
  secondary:
    "bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.04] text-slate-100 font-medium border border-white/10 hover:border-white/20 transition-colors",
  outline:
    "bg-transparent hover:bg-white/[0.05] active:bg-white/[0.08] text-slate-200 font-medium border border-white/20 hover:border-white/40 transition-colors",
  ghost:
    "bg-transparent hover:bg-white/[0.06] active:bg-white/[0.09] text-slate-300 hover:text-white font-medium transition-colors",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-md gap-1.5",
  md: "text-sm px-4 py-2 rounded-lg gap-2",
  lg: "text-sm sm:text-base px-5 py-2.5 rounded-lg gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  external = false,
  icon,
  iconPosition = "left",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const combinedClasses = `inline-flex items-center justify-center font-sans select-none disabled:opacity-50 disabled:pointer-events-none duration-150 cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const content = (
    <>
      {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
    </>
  );

  if (href) {
    if (external || href.startsWith("tel:") || href.startsWith("mailto:")) {
      return (
        <a
          href={href}
          className={combinedClasses}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...rest}>
      {content}
    </button>
  );
}
