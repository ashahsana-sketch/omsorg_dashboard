import Image from 'next/image';
import NavLink from '../NavLink/NavLink';

export default function Header() {
  return (
    <header className="bg-white border-b border-amber-100 px-6 py-3 flex items-center justify-between shadow-sm">
  {/* Left: Brand Identity */}
  <div className="flex items-center gap-4">
    <Image src="/logo.png" alt="Logo" width={120} height={40} priority />
    <h1 className="text-lg font-extrabold uppercase tracking-wider leading-tight bg-linear-to-tr from-teal-600 to-amber-400 bg-clip-text text-transparent border-l pl-4 border-stone-200">Elderly Care <br /> DashBoard </h1>
  </div>

  {/* Center: Main Navigation */}
  <nav className="hidden md:flex items-center gap-1 bg-amber-50/50 p-1 rounded-xl border border-amber-100">
    <NavLink href="/roster" >Roster</NavLink>
    <NavLink href="/employees">Employees</NavLink>
    <NavLink href="/clients">Clients</NavLink>
    <NavLink href="/locations">Locations</NavLink>
  </nav>

  {/* Right: Primary Action */}
<div className="flex items-center gap-3">
  <button className="bg-amber-100 hover:bg-amber-200 text-stone-900 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">
    + Assign Task
  </button>
</div>
</header>
  );
}