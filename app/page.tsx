import Header from "./Components/Header/Header";
import Footer from "./Components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-amber-50/30">
      <Header />
      <div className="flex-1">
        {/* Main page content goes here */}
      </div>
      <Footer />
    </main>
  );
}