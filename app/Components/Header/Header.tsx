"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavLink from "../NavLink/NavLink";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 px-3 sm:px-4 md:px-6 py-2 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Brand Identity */}
        <Link
          href="/"
          className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Logo of Elderly Care Dashboard"
            width={100}
            height={32}
            priority
            className="w-16 sm:w-20 md:w-24 h-auto"
          />
          <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight border-l pl-2 border-slate-200 flex flex-col md:block">
            <span className="bg-linear-30 from-teal-700 to-amber-600 bg-clip-text text-transparent">
              Elderly Care Dashboard
            </span>
          </h1>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex ml-auto gap-1 rounded-xl bg-slate-50 p-1 ">
          <div className="bg-slate-50 p-1 rounded-lg border border-slate-200  transition-colors shadow-sm">
            <NavLink href="/employees">Employees List</NavLink>
          </div>
          <div className="bg-slate-50 p-1 rounded-lg border border-slate-200  transition-colors shadow-sm hover:shadow-md hover:text-white">
            <NavLink href="/clients">Clients List</NavLink>
          </div>
          <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 transition-colors shadow-sm">
            <NavLink href="/BillingReports">Billing Report</NavLink>
          </div>
          <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 transition-colors shadow-sm">
            <NavLink href="/shifts">Shifts/Roaster</NavLink>
          </div>
        </nav>

        {/* Right Actions & Mobile Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-teal-700 hover:bg-slate-50 focus:outline-none border border-slate-200 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Dropdown */}
      {isMenuOpen && (
        <nav className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-lg p-3 flex flex-col gap-2 z-50">
          <div onClick={() => setIsMenuOpen(false)} className="bg-slate-50 p-1 rounded-lg border border-slate-200">
            <NavLink href="/employees">Employees</NavLink>
          </div>
          <div onClick={() => setIsMenuOpen(false)} className="bg-slate-50 p-1 rounded-lg border border-slate-200">
            <NavLink href="/clients">Clients</NavLink>
          </div>
          <div onClick={() => setIsMenuOpen(false)} className="bg-slate-50 p-1 rounded-lg border border-slate-200">
            <NavLink href="/BillingReports">Billing Reports</NavLink>
          </div>
          <div onClick={() => setIsMenuOpen(false)} className="bg-slate-50 p-1 rounded-lg border border-slate-200">
            <NavLink href="/shifts">Shifts/Roaster</NavLink>
          </div>
        </nav>
      )}
    </header>
  );
}