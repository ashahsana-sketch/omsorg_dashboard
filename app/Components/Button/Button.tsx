"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  // Base styling for all buttons
  const baseStyles =
    "font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 inline-flex items-center justify-center";

  // Color variants matching your Elderly Care Hub palette
  const variants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white",
    secondary: "bg-teal-600 hover:bg-teal-700 text-white",
    outline: "border border-slate-200 hover:bg-slate-50 text-slate-800",
  };

  // Size variations
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}