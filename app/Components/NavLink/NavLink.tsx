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

  // Checks exact match OR sub-route match (e.g. /clients/123)
  const isActive =
    active ?? (pathname === href || (href !== "/" && pathname.startsWith(href)));

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 ${
        isActive
          ? "bg-teal-600 text-white border border-teal-700"
          : "text-teal-700 hover:text-teal-700 hover:bg-white hover:border-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}