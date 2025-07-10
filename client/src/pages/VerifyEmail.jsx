import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { toast } from "react-hot-toast";

export default function VerifyEmail() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const handledRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    if (handledRef.current) return; // ← skip if already ran
    handledRef.current = true;
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (!token) {
      setMessage("No token provided.");
      setLoading(false);
      return;
    }

    verifyEmail(token)
      .then((data) => {
        toast.success(data.message); // “Email verified—thank you!”
        navigate("/dashboard"); // or “/dashboard”
      })
      .catch((err) => {
        // show the error *once*
        toast.error(err.message || "Verification failed");
        setMessage(err.message || "Verification failed");
        setLoading(false);
      });
  }, [location.search, navigate, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {loading ? (
        <p>Verifying…</p>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-red-600">{message}</p>
          {/* Offer a path back to login (or resend) */}
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}
