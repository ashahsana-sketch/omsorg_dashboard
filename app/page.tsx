import EmployeeModal from "./employees/EmployerModal";
import ClientModal from "./clients/ClientModal";
import RosterView from "./Components/Roster/RosterView";
export default function Home() {
  return (
    <div className="w-full bg-slate-50">

      <div className="px-4 sm:px-6 py-4 space-y-6">

        {/* Page Header */}
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

      </div>

    </div>
  );
}