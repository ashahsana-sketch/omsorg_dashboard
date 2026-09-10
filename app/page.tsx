import Header from "./Components/Header/Header";
import Footer from "./Components/Footer/footer";
import EmployeeModal from "./employees/EmployerModal";
import EmployeeManagerForm from "./employees/EmployeeManagerForm";
import ClientManagerForm from "./clients/ClientManagerForm";
import ClientModal from "./clients/ClientModal";
import RosterView from "./Components/Roster/RosterView";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-amber-50/30">
      {/* Main Content Area: Responsive Padding & Margins */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 md:py-12 space-y-6 sm:space-y-8 text-center">
        
        {/* Header Text Section */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
            Care Dashboard Records
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Manage your employee directory, client care profiles, and shift matrix in one place.
          </p>
        </div>

        {/* Modal Action Triggers: Mobile par Full Width / Column View */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
          <div className="w-full sm:w-auto">
            <EmployeeModal />
          </div>
          <div className="w-full sm:w-auto">
            <ClientModal />
          </div>
        </div>
      <div className="min-h-screen bg-stone-50 py-8">
      <RosterView />
    </div>
      </main>

      <Footer />
    </div>
  );
}