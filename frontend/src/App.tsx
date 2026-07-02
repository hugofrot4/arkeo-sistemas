import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import AuthorityBar from "./components/sections/AuthorityBar";
import Contact from "./components/sections/Contact";
import Faq from "./components/sections/Faq";
import Hero from "./components/sections/Hero";
import Portfolio from "./components/sections/Portfolio";
import Process from "./components/sections/Process";
import Services from "./components/sections/Services";
import WhyArkeo from "./components/sections/WhyArkeo";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AuthorityBar />
        <Services />
        <Process />
        <WhyArkeo />
        <Portfolio />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
