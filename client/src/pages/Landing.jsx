import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import heroTent from "../assets/images/hero-tent.jpeg";
import heroOsprey from "../assets/images/hero-hiker-blue-osprey.jpg";
import heroHiking from "../assets/images/hero-hiker-ridgeline.jpg";
import heroHMG from "../assets/images/hero-hmg-mountains.jpg";
import mobileScreenshot from "../assets/images/mobile-screenshot.png";
import desktopScreenshot from "../assets/images/desktop-screenshot.png";
import AuthModal from "../components/AuthModal"; // new

export default function Landing() {
  // Hero image carousel
  const heroImages = [
    heroOsprey, // osprey in the mountains
    heroHiking,
    heroHMG,
    heroTent, // tent in the mountains
  ];
  const [current, setCurrent] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const auth = location.state?.auth; // "login" | "register"
    const reason = location.state?.reason; // "protected" | "expired" | undefined
    const shouldOpen =
      (auth === "login" || auth === "register") &&
      (reason === "protected" || reason === "expired");

    if (shouldOpen) {
      setAuthMode(auth);
      setAuthOpen(true);
      // clear state so refresh/back doesn’t re-open
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-white text-gray-800">
      <nav className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30">
        <div className="text-2xl font-semibold">TrekList.co</div>
        <div className="space-x-6 hidden md:flex">
          <a href="#features" className="hover:underline">
            Features
          </a>
          <a href="#mission" className="hover:underline">
            Mission
          </a>
          <a href="#community" className="hover:underline">
            Community
          </a>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => openAuth("login")}
            className="text-sm font-medium hover:underline"
          >
            Log In
          </button>
          <button
            onClick={() => openAuth("register")}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:opacity-90 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Carousel */}
      <header
        className="h-screen flex flex-col items-center justify-center bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url('${heroImages[current]}')` }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Pack Smart. Travel Light.
          </h1>
          <p className="max-w-2xl text-white mb-8">
            Build, share, and check off your gear lists—designed for
            long-distance hikers, bikepackers, and hostel-hopping travelers
            exploring Europe and beyond.
          </p>
          <button
            onClick={() => openAuth("register")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:opacity-90 transition"
          >
            Start Your List
          </button>
        </div>
        {/* Dots */}
        <div className="absolute bottom-10 flex space-x-2 z-20">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-3 h-3 rounded-full transition-opacity duration-300 ${
                idx === current ? "bg-white opacity-100" : "bg-white opacity-50"
              }`}
            />
          ))}
        </div>
      </header>
      {/* Brand Partners
      <section className="py-12 px-6 flex flex-wrap justify-center items-center gap-8 bg-gray-50">
        {[
          "https://cdn.shopify.com/s/files/1/0173/1185/files/hyperlite-logo.svg",
          "https://www.zpacks.com/cdn/shop/files/zpacks_logo_black.svg",
          "https://www.osprey.com/media/wysiwyg/Footer/osprey-logo.svg",
          // "https://assets.bever.nl/logos/bever_logo.svg",
        ].map((src) => (
          <img
            key={src}
            src={src}
            alt="Partner logo"
            className="h-12 grayscale hover:grayscale-0 transition"
          />
        ))}
      </section> */}

      {/* Screenshot + Features */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* App Screenshot Placeholder */}
          <div className="flex-1">
            <img
              src={mobileScreenshot}
              alt="App in use on mobile device"
              className="rounded-2xl shadow-lg w-full max-w-sm mx-auto"
            />
          </div>
          {/* Feature List */}
          <div className="flex-1 space-y-8">
            {[
              {
                title: "Mobile‑First UI",
                desc: "Touch‑friendly design to build & edit on the go.",
              },
              {
                title: "Custom Gear Library",
                desc: "Import from our database or add your own kit.",
              },
              {
                title: "Checklist & PDF Export",
                desc: "Interactive browser checklist + printer‑friendly PDF.",
              },
            ].map((f) => (
              <div key={f.title}>
                <h3 className="text-2xl font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Recommended Gear List Section */}
      <section id="mission" className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-4">Recommended Gear List</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          Here is a list of European hiking gear that we recommend for your next
          adventure. These lists are designed to be lightweight, versatile, and
          suitable for a variety of conditions.
        </p>
        <Link
          to="/about"
          className="px-5 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-full hover:bg-blue-600 hover:text-white transition"
        >
          Learn More
        </Link>
      </section>
      {/* Mission / Social Good */}
      <section id="mission" className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-4">Built for Adventurers</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          We give 5% of revenue back to trail conservation and local guide
          programs.
        </p>
        <Link
          to="/about"
          className="px-5 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-full hover:bg-blue-600 hover:text-white transition"
        >
          Learn More
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} TrekList.co</p>
          <div className="flex space-x-6">
            <a href="/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white">
              Terms
            </a>
            <a href="/contact" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
      <AuthModal
        isOpen={authOpen}
        defaultMode={authMode}
        onClose={closeAuth}
        onAuthed={() => {
          closeAuth();
          navigate("/dashboard", { replace: true });
        }}
      />
    </div>
  );
}
