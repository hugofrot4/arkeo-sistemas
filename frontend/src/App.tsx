import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="font-family-display flex-1 text-3xl font-bold text-blue-600">
        Arkeo Sistemas
      </div>
      <Footer />
    </div>
  );
}

export default App;
