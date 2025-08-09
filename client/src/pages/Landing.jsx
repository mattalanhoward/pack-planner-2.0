import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import mobileSidebarScreenshot from "../assets/images/treklist-mobile-sidebar.png";
import mobileColumnScreenshot from "../assets/images/treklist-column-mobile.png";
import desktopColumnScreenshot from "../assets/images/treklist-column-desktop-1.png";
import AuthModal from "../components/AuthModal"; // new

// Cloudinary responsive hero image URLs
const heroOspreySources = {
  768: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_768/v1754767083/gear-list-hero-images/hero-hiker-blue-osprey_nm7lte.jpg",
  1280: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1280/v1754767083/gear-list-hero-images/hero-hiker-blue-osprey_nm7lte.jpg",
  1920: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1920/v1754767083/gear-list-hero-images/hero-hiker-blue-osprey_nm7lte.jpg",
};

const heroHikingSources = {
  768: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_768/v1754767189/gear-list-hero-images/hero-hiker-ridgeline_v7twmc.jpg",
  1280: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1280/v1754767189/gear-list-hero-images/hero-hiker-ridgeline_v7twmc.jpg",
  1920: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1920/v1754767189/gear-list-hero-images/hero-hiker-ridgeline_v7twmc.jpg",
};

const heroHMGSources = {
  768: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_768/v1754767189/gear-list-hero-images/hero-hmg-mountains_xn6aso.jpg",
  1280: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1280/v1754767189/gear-list-hero-images/hero-hmg-mountains_xn6aso.jpg",
  1920: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1920/v1754767189/gear-list-hero-images/hero-hmg-mountains_xn6aso.jpg",
};

const heroTentSources = {
  768: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_768/v1754767080/gear-list-hero-images/hero-tent_ijvmku.jpg",
  1280: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1280/v1754767080/gear-list-hero-images/hero-tent_ijvmku.jpg",
  1920: "https://res.cloudinary.com/packplanner/image/upload/c_fill,g_auto,f_auto,q_auto:eco,dpr_auto,w_1920/v1754767080/gear-list-hero-images/hero-tent_ijvmku.jpg",
};

const Dot = ({ className = "" }) => (
  <span
    className={`inline-block h-3 w-3 rounded-full ${className}`}
    aria-hidden="true"
  />
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

// Minimal, realistic iPhone frame
const IPhoneFrame = ({ src, alt = "", className = "" }) => (
  <figure className={`relative aspect-[9/19] ${className}`}>
    <div className="absolute inset-0 rounded-[2rem] bg-[#0B1220] shadow-[0_18px_44px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-white/10" />
      <div className="absolute inset-[12px] sm:inset-[13px] md:inset-[14px] rounded-[1.5rem] overflow-hidden bg-black outline outline-1 outline-black">
        <img
          src={src}
          alt={alt}
          className="block h-full w-full object-cover object-top"
          loading="lazy"
        />
      </div>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[8px] sm:top-[9px] md:top-[10px] h-3.5 sm:h-4 md:h-4.5 w-[34%] md:w-[32%] rounded-b-2xl bg-[#0B1220]" />
    </div>
  </figure>
);

// BrowserMock with MacBook Air-ish proportions
const BrowserMock = ({ src, alt = "", className = "" }) => (
  <div
    className={`relative mx-auto rounded-xl bg-slate-900 shadow-2xl ring-1 ring-black/10 overflow-hidden ${className}`}
  >
    {/* top bar */}
    <div className="flex items-center space-x-1 px-3 py-2 bg-slate-800">
      <span className="w-3 h-3 rounded-full bg-red-500" />
      <span className="w-3 h-3 rounded-full bg-yellow-500" />
      <span className="w-3 h-3 rounded-full bg-green-500" />
    </div>

    {/* screenshot area — MacBook aspect */}
    <div className="aspect-[16/10] w-full bg-black">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  </div>
);

// --- Feature bullet item ---
const Bullet = ({ title, text, color = "text-blue-600" }) => (
  <li className="flex gap-3">
    <CheckIcon className={`mt-1 h-5 w-5 flex-none ${color}`} />
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-slate-600">{text}</p>
    </div>
  </li>
);

export default function Landing() {
  // Hero image carousel
  const heroImages = [
    { alt: "Hiker with blue Osprey pack", sources: heroOspreySources },
    { alt: "Hiker on alpine ridgeline", sources: heroHikingSources },
    { alt: "HMG pack in the mountains", sources: heroHMGSources },
    { alt: "Tent in the mountains", sources: heroTentSources },
  ];

  useEffect(() => {
    const preload = (url) => {
      const img = new Image();
      img.src = url;
    };
    preload(heroImages[0].sources[1920]); // first slide

    setTimeout(() => {
      heroImages.slice(1).forEach((img) => preload(img.sources[1280]));
    }, 1500);
  }, []);

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
      <nav className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30 bg-white/10 backdrop-blur-md">
        <div className="text-2xl font-semibold">TrekList.co</div>
        <div className="space-x-6 hidden md:flex">
          <a href="#features" className="hover:underline">
            Features
          </a>
          <a href="#sampleGearList" className="hover:underline">
            Sample Gear List
          </a>
          <a href="#mission" className="hover:underline">
            Mission
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
      <header className="relative h-screen flex flex-col items-center justify-center">
        {/* Background image + overlay */}
        <picture>
          <source
            srcSet={`
      ${heroImages[current].sources[768]} 768w,
      ${heroImages[current].sources[1280]} 1280w,
      ${heroImages[current].sources[1920]} 1920w
    `}
            sizes="100vw"
            type="image/jpeg"
          />
          <img
            src={heroImages[current].sources[1920]} // fallback
            alt={heroImages[current].alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Foreground content */}
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
      {/* ===== Section A: Image (phones) -> Text ===== */}

      <section
        id="features"
        aria-labelledby="features-mobile"
        className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20 pb-24 md:pb-28 lg:pb-32" // extra bottom space
      >
        <h2 className="text-center text-3xl font-bold mb-4">Features</h2>
        <div
          className="
      grid items-center gap-10 md:gap-16
      md:[grid-template-columns:420px_minmax(0,1fr)]
      lg:[grid-template-columns:520px_minmax(0,1fr)]
    "
        >
          {/* Phones (single phone on mobile, overlap on md+) */}
          <div
            className="
    relative mx-auto md:mx-0 w-full max-w-[520px]
    h-auto md:h-[440px] lg:h-[520px]
  "
          >
            <div className="flex justify-center md:block">
              {/* back/left phone — hidden on small screens */}
              <div className="hidden md:block md:absolute md:left-0 md:top-0 z-10">
                <IPhoneFrame
                  src={mobileSidebarScreenshot}
                  alt="TrekList mobile view showing gear lists and My Gear search"
                  className="mx-0 w-[200px] sm:w-[220px] md:w-[240px] lg:w-[280px]"
                />
              </div>

              {/* front/right phone — always visible */}
              <div className="relative md:absolute md:top-8 md:left-16 lg:left-[14rem] z-20">
                <IPhoneFrame
                  src={mobileColumnScreenshot}
                  alt="TrekList mobile category columns"
                  className="mx-0 w-[200px] sm:w-[220px] md:w-[240px] lg:w-[280px]"
                />
              </div>
            </div>
          </div>

          {/* Text bullets */}
          <div className="relative z-10">
            <h2
              id="features-mobile"
              className="text-center md:text-left text-3xl font-bold text-slate-900"
            >
              Built for the Trail
            </h2>
            <p className="text-center md:text-left mt-3 text-slate-600">
              Mobile first UX — add, edit, and reorder without friction.
            </p>
            <ul className="mt-8 space-y-6">
              <Bullet
                title="Mobile-first design"
                text="Create and edit gear lists on the go."
              />
              <Bullet
                title="Smart weight totals"
                text="Base, worn, consumables in real time."
              />
              <Bullet
                title="Quick add & search"
                text="Find gear fast, edit from anywhere."
              />
              <Bullet
                title="Pack checklist"
                text="One-tap packing, clean PDF export."
              />
            </ul>
          </div>
        </div>
      </section>

      {/* ===== Section B: Text -> Image (desktop) ===== */}
      <section
        aria-labelledby="features-desktop"
        className="mx-auto max-w-7xl px-6 py-12 lg:px-8"
      >
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text bullets (left on desktop) */}
          <div className="order-2 md:order-1">
            <h2
              id="features-desktop"
              className="text-3xl font-bold text-slate-900"
            >
              Desktop View
            </h2>
            <p className="mt-3 text-slate-600">
              Plan, budget, and fine-tune your kit.
            </p>
            <ul className="mt-8 space-y-6">
              <Bullet
                title="Drag between categories"
                text="Kanban-style columns or Traditional List View for planning."
                color="text-emerald-600"
              />
              <Bullet
                title="Price & currency"
                text="Track costs alongside weights."
                color="text-emerald-600"
              />
              <Bullet
                title="Public share links"
                text="Read-only pages for forums/blogs."
                color="text-emerald-600"
              />
              <Bullet
                title="Embeds"
                text="Drop your list into posts."
                color="text-emerald-600"
              />
            </ul>
          </div>

          {/* Desktop browser mock (right on desktop) */}
          <div className="order-1 md:order-2">
            <BrowserMock
              src={desktopColumnScreenshot}
              alt="TrekList desktop view with multiple gear categories in columns"
            />
          </div>
        </div>
      </section>

      {/* Sample Gear List Section */}
      <section id="sampleGearList" className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-4">Recommended Gear List</h2>
        <p className="max-w-2xl mx-auto text-gray-700 mb-6">
          Here is a list of European hiking gear that we recommend for your next
          adventure. These lists are designed to be lightweight, versatile, and
          suitable for a variety of conditions. View or customize the list.
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
