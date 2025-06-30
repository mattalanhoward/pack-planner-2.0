import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <header className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white flex flex-col items-center justify-center p-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
          Organize your gear, never forget a strap again
        </h1>
        <p className="max-w-xl text-center mb-8">
          PackPlanner helps you build, share, and check off gear lists— whether
          you’re headed to the backcountry or just the backyard.
        </p>
        <div className="space-x-4">
          <Link
            to="/register"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded shadow hover:bg-gray-100"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border-2 border-white text-white font-semibold rounded hover:bg-white hover:text-blue-600 transition"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Drag & Drop",
              desc: "Easily reorder categories and items with intuitive drag-and-drop.",
              img: "https://via.placeholder.com/300x200",
            },
            {
              title: "Collaborative Checklists",
              desc: "Turn any list into a shareable, persistent checklist for your team.",
              img: "https://via.placeholder.com/300x200",
            },
            {
              title: "Print-Friendly Mode",
              desc: "Generate a clean, printer-ready version of your gear list in one click.",
              img: "https://via.placeholder.com/300x200",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-lg shadow p-6 flex flex-col"
            >
              <img
                src={f.img}
                alt={f.title}
                className="w-full h-40 object-cover rounded mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 flex-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center px-4 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} PackPlanner</p>
          <div className="space-x-4">
            <a href="/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white">
              Terms
            </a>
            <a href="/contact" className="hover:text-white">
              Contact
            </a>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
