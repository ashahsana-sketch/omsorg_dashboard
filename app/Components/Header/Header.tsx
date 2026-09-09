"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavLink from "../NavLink/NavLink";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-amber-100 px-3 sm:px-4 md:px-6 py-2 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Brand Identity */}
        <Link
          href="/"
          className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={32}
            priority
            className="w-16 sm:w-20 md:w-24 h-auto"
          />
          <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight bg-linear-to-tr from-teal-800 to-amber-00 bg-clip-text text-transparent border-l pl-2 border-stone-200 flex flex-col md:block">
            <span>Elderly Care Dashboard
            </span>
          </h1>
        </Link>

        {/* Center: Separate Navigation Buttons (No Shared Card) */}
        <nav className="hidden lg:flex items-center gap-2">
          <div className="bg-teal-500 border border-teal-900 rounded-lg p-0.5 hover:border-teal-400 transition-colors shadow-2">
            <NavLink href="/employees">Employees List</NavLink>
          </div>
          <div className="bg-teal-500
           border border-teal-900 rounded-lg p-0.5 hover:border-teal-400 transition-colors shadow-2xs text-white">
            <NavLink href="/clients">Clients List</NavLink>
          </div>
          <div className="bg-teal-500
           border border-teal-900 rounded-lg p-0.5 hover:border-teal-400 transition-colors shadow-2xs text-white">
            <NavLink href="/reports">Salary Report</NavLink>
          </div>
          <div className="bg-teal-500
           border border-teal-900  rounded-lg p-0.5 hover:border-teal-400 transition-colors shadow-2xs text-white">
            <NavLink href="/shifts">Shifts</NavLink>
          </div>
        </nav>

        {/* Right Actions & Mobile/Tablet Controls */}
        <div className="flex items-center gap-2 shrink-0">
          

          {/* Hamburger Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-stone-700 hover:bg-amber-50 focus:outline-none border border-stone-200"
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
        <nav className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-amber-100 shadow-lg p-3 flex flex-col gap-2 z-50">
          <div onClick={() => setIsMenuOpen(false)} className="bg-teal-50/60 p-1 rounded-lg border border-amber-100">
            <NavLink href="/employees">Employees</NavLink>
          </div>
          <div onClick={() => setIsMenuOpen(false)} className="bg-teal-50/60 p-1 rounded-lg border border-amber-100">
            <NavLink href="/clients">Clients</NavLink>
          </div>
          <div onClick={() => setIsMenuOpen(false)} className="bg-teal-50/60 p-1 rounded-lg border border-amber-100">
            <NavLink href="/reports">Reports</NavLink>
          </div>
          <div onClick={() => setIsMenuOpen(false)} className="bg-teal-50/60 p-1 rounded-lg border border-amber-100">
            <NavLink href="/locations">Locations</NavLink>
          </div>
        </nav>
      )}
    </header>
  );
}