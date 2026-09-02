import Header from "./Components/Header/Header";
import Footer from "./Components/footer/Footer";
import EmployeeModal from "./employees/EmployerModal";
import EmployeeManagerForm from "./employees/EmployeeManagerForm";
import CustomerManagerForm from "./Components/CustomerManagerForm";
import CustomerModal from "./Components/CustomerModal";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-amber-50/30">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 my-12 space-y-8 text-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">
            Care Dashboard Records
          </h2>
          <p className="text-xs text-stone-500">
            Manage your employee directory, client care profiles, and shift matrix in one place.
          </p>
        </div>

        {/* Modal Action Triggers */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <EmployeeModal />
          <CustomerModal />
        </div>
      </main>

      <Footer />
    </div>
  );
}