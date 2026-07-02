import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/auth/RequireAuth";
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
import Admin from "./pages/admin/Admin";
import Login from "./pages/Login";

function Home() {
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
