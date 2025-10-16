import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [trailname, setTrailname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getNext = () => {
    const params = new URLSearchParams(location.search);
    const n = params.get("next");
    return n && n.startsWith("/") ? n : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const next = params.get("next"); // e.g. "/share/<token>?copy=1"
      await api.post("/auth/register", { email, trailname, password, next });
      toast.success("Registered! Check your email to verify.");
      navigate(next ? `/login?next=${encodeURIComponent(next)}` : "/login", {
        replace: true,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded shadow"
      >
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        <label className="block mb-3">
          <span className="text-gray-700">Trail Name</span>
          <input
            type="text"
            value={trailname}
            onChange={(e) => setTrailname(e.target.value)}
            required
            className="mt-1 block w-full border p-2 rounded"
            disabled={loading}
          />
        </label>

        <label className="block mb-3">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border p-2 rounded"
            disabled={loading}
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border p-2 rounded"
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Registering…" : "Register"}
        </button>
      </form>
    </div>
  );
}
