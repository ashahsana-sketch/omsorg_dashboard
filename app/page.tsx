import EmployeeModal from "./employees/EmployerModal";
import ClientModal from "./clients/ClientModal";
import RosterView from "@/app/Components/Roster/RosterView"
export default function Home() {
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
          
          <RosterView />

      </main>


    </div>
  );
}