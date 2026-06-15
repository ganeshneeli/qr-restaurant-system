import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, UtensilsCrossed, Eye, EyeOff, ArrowLeft, Delete, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://qr-restaurant-system-1.onrender.com/api";

export default function StaffLogin() {
  const { setStaffToken, isKitchen, isWaiter, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"password" | "pin">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isKitchen) navigate("/kitchen");
    else if (isWaiter) navigate("/waiter");
  }, [isKitchen, isWaiter, navigate]);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = mode === "pin"
        ? { email, pin }
        : { email, password };

      const res = await axios.post(`${API_URL}/auth/staff-login`, payload);

      if (res.data.success) {
        setStaffToken(res.data.token);
        const role = res.data.role;
        if (role === "kitchen") navigate("/kitchen");
        else if (role === "waiter") navigate("/waiter");
        else navigate("/admin");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when PIN is 4 digits
  useEffect(() => {
    if (mode === "pin" && pin.length === 4 && email) {
      handleSubmit();
    }
  }, [pin, mode, email]);

  const pinPadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-950/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-950/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Back to home */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-white/30 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-orange-400" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Staff Login</h1>
          <p className="text-white/40 text-sm mt-1">Kitchen • Waiter Portal</p>
          <p className="text-xs text-orange-400/70 mt-1 font-medium">Temptations Restaurant</p>
        </div>

        {/* Portal Switch Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4 border border-white/10">
          <button
            type="button"
            onClick={() => navigate("/admin-login")}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white/40 hover:text-white transition-all duration-300"
          >
            Admin Portal
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all duration-300"
          >
            Staff Portal
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          {[
            { key: "password", label: "Password" },
            { key: "pin", label: "PIN" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setMode(key as "password" | "pin"); setError(""); setPin(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                mode === key
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {label} Login
            </button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          {/* Email (always shown) */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block mb-2">
              Staff Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {mode === "password" ? (
            <>
              <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all pr-12"
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleSubmit()}
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-sm tracking-wider hover:from-orange-500 hover:to-red-500 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </button>
            </>
          ) : (
            <>
              {/* PIN dots */}
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-black block mb-3">
                  4-Digit PIN
                </label>
                <div className="flex justify-center gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                        pin.length > i
                          ? "border-orange-500 bg-orange-500/20"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      {pin.length > i && (
                        <span className="w-3 h-3 rounded-full bg-orange-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PIN pad */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {pinPadKeys.map((key, idx) => {
                  if (key === "") return <div key={idx} />;
                  if (key === "del") return (
                    <button
                      key={idx}
                      onClick={handlePinDelete}
                      className="h-14 rounded-xl bg-white/5 border border-white/10 text-white/60 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  );
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePinDigit(key)}
                      disabled={pin.length >= 4}
                      className="h-14 rounded-xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-orange-500/10 hover:border-orange-500/30 active:scale-95 transition-all disabled:opacity-30"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

              {loading && (
                <div className="flex justify-center mt-3">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                </div>
              )}
            </>
          )}
        </div>


      </motion.div>
    </div>
  );
}
