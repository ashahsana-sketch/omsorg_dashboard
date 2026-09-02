import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-amber-100 px-6 py-8 mt-auto text-stone-700">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Column 1: Brand & Emergency Contact */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold uppercase tracking-wider bg-linear-to-tr from-teal-600 to-amber-400 bg-clip-text text-transparent border-b border-amber-500 pb-1">
            Elderly Care Dashboard
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Providing compassionate, reliable, and scheduled care management for seniors.
          </p>
          
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 border-b border-amber-500 pb-1">
            Quick Navigation
          </h3>
          <ul className="space-y-2 text-xs font-medium">
            <li><Link href="/roster" className="hover:text-amber-600 transition-colors">Roster Matrix</Link></li>
            <li><Link href="/employees" className="hover:text-amber-600 transition-colors">Staff Directory</Link></li>
            <li><Link href="/customers" className="hover:text-amber-600 transition-colors">Care Recipients</Link></li>
            <li><Link href="/locations" className="hover:text-amber-600 transition-colors">Service Locations</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact & Office Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 border-b border-amber-500 pb-1">
            Contact Details
          </h3>
          <ul className="space-y-2 text-xs text-stone-600">
            <li><span className="font-semibold text-stone-800">Email:</span> support@elderlycare.se</li>
            <li><span className="font-semibold text-stone-800">Office:</span> +46 (0)8 000 00 00</li>
            <li><span className="font-semibold text-stone-800">Address:</span> Omsorgsvägen 000, Stockholm</li>
            <li><span className="font-semibold text-stone-800">Hours:</span> Mon–Fri: 07:00 – 19:00</li>
          </ul>
        </div>

        {/* Column 4: Service Areas */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 border-b border-amber-500 pb-1">
            Active Regions
          </h3>
          <div className="flex flex-wrap gap-1.75 pt-1 text-3xl ">
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Stockholm</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Södertälje</span>
            </div>
            <div>
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Kista</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Täby</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Solna</span>
          </div>
          <div>
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Bandhagan</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded text-[11px] font-medium">Hanninge</span>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-2">
        <div>
          Elderly Care Dashboard © {new Date().getFullYear()} — All rights reserved.
        </div>
        <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">
              24/7 Care Support Hotline
            </span>
            <a href="tel:+468000000" className="text-sm font-bold text-stone-800 hover:text-teal-600">
              +46 (0)8 000 00 00
            </a>
          </div>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Care</a>
        </div>
      </div>
    </footer>
  );
}