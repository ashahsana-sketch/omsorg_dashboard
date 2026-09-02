"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  active?: boolean;
}

export default function NavLink({ href, children, active }: NavLinkProps) {
  const pathname = usePathname();
  // Automatically detects if the current page matches the link destination
  const isActive = active ?? pathname === href;

  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        isActive
          ? "bg-amber-200 text-stone-900 shadow-sm"
          : "text-stone-600 hover:text-stone-900 hover:bg-amber-200"
      }`}
    >
      {children}
    </Link>
  );
}