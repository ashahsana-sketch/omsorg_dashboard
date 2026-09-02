import Header from "./Components/Header/Header";
import Footer from "./Components/footer/Footer";
import EmployeeModal from "./EmployerModal";
import EmployeeManagerForm from "./Components/EmployeeManagerForm";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-amber-50/30">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 my-12 space-y-8 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">
            Elderly Care Dashboard
          </h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Manage your caregiver roster and employee records seamlessly.
          </p>
        </div>

        {/* Triggers form popup on click */}
        <EmployeeModal />
      </main>

      <Footer />
    </div>
  );
}