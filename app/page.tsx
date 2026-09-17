import Image from "next/image";
import EmployeeModal from "./employees/EmployerModal";
import ClientModal from "./clients/ClientModal";
import NavLink from "./Components/NavLink/NavLink";
import ClientReviews from "./Components/ClientReviews/ClientReviews";
import reviewsData from "@/data/ClientReviews.json";

const imageList = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  src: `/webImages/${i + 1}.jpg`,
  alt: `Care Facility Image ${i + 1}`,
}));

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Header Section */}
        <div className="w-full text-center sm:text-left space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-teal-700 tracking-tight">
            Elderly Care Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
            Manage your employee directory, client care profiles, and shift matrix in one place.
          </p>
        </div>

        {/* Employee & Client Modals Grid */}
        <div className="grid grid-cols-1 gap-4">
          <EmployeeModal />
          <ClientModal />
        </div>

        {/* Hero / Welcome Banner */}
        <div className="bg-linear-to-r from-teal-600 to-teal-700 text-white p-5 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold">Care Management Hub</h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl leading-relaxed">
              Streamlining elderly care operations, staff rostering, and client feedback in Stockholm.
            </p>
          </div>
          <div className="w-full md:w-auto flex justify-start md:justify-end">
            <div className="inline-block bg-teal-50 hover:bg-teal-100 transition text-black text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs">
              <NavLink href="/Roster">Open Care Roster View →</NavLink>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <section className="bg-teal-50/60 p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-md font-bold text-teal-800">Facility & Care Moments Gallery</h2>
            <span className="text-xs text-stone-500 font-semibold">10 Photos</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {imageList.map((img) => (
              <div
                key={img.id}
                className="relative h-32 sm:h-36 rounded-xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100 group"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  priority={img.id <= 2}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 bg-stone-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  #{img.id}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Client Reviews Section */}
        <section className="bg-teal-50/60 p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
          <ClientReviews reviews={reviewsData} />
        </section>

      </main>
    </div>
  );
}