import EmployeeModal from "./employees/EmployerModal";
import ClientModal from "./clients/ClientModal";
import NavLink from "./Components/NavLink/NavLink";
import RosterView from "@/app/Components/Roster/RosterView"
import ClientReviews from "./Components/ClientReviews/ClientReviews";
import reviewsData from "@/data/ClientReviews.json"
export default function Home() {
  const imageList = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    src: `/webImages/${i + 1}.jpg`,
    alt: `Care Facility Image ${i + 1}`,
  }));
  return (
    
    <div className="w-full bg-slate-50">

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="w-full text-center space-y-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-700 tracking-tight">
            Care Dashboard Records
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Manage your employee directory, client care profiles, and shift matrix in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <EmployeeModal />
          <ClientModal />
        </div>
        {/* 1. Hero / Welcome Banner */}
        <div className="bg-linear-to-r from-teal-700 to-teal-800 text-white p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold"> Care Management Hub</h1>
            <p className="text-xs text-teal-100 mt-1">Streamlining elderly care operations, staff rostering, and client feedback in Stockholm. </p>
          </div>
           <div className="inline bg-amber-50 pb-2 rounded-2xl text-2xl text-teal-50 font-bold ">
          <NavLink href="/Roster">Open Care Roster View →</NavLink></div>
             
        </div>


        <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-teal-800">Facility & Care Moments Gallery</h3>
            <span className="text-xs text-stone-500 font-semibold">10 Photos</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {imageList.map((img) => (
              <div 
                key={img.id} 
                className="relative h-36 rounded-xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100 group"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute bottom-1 right-1 bg-stone-900/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  #{img.id}
                </div>
              </div>
            ))}
          </div>
        </section>
       

        

        

        {/* 3. Client Reviews Section */}
        <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <ClientReviews reviews={reviewsData} />
        </section>


          <section>
          <ClientReviews reviews={reviewsData} />
        </section>

      </main>


    </div>
  );
}