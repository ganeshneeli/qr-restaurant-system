import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Utensils, 
  Clock, 
  MapPin, 
  Cake, 
  IceCream, 
  Camera, 
  Coins, 
  Truck 
} from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import VideoBackground from "@/components/VideoBackground";
import { Badge } from "@/components/ui/badge";

const SIGNATURE_DISHES = [
  { 
    name: "Hyderabadi Chicken Biryani", 
    url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80", 
    category: "Biryanis & Curries",
    description: "Fragrant basmati rice & tender slow-cooked marinated chicken."
  },
  { 
    name: "Fresh Strawberry Celebration Cake", 
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", 
    category: "Bakery Special",
    description: "Layers of moist vanilla cake, fresh strawberries & whipped cream."
  },
  { 
    name: "Gourmet Double Cheese Burger", 
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", 
    category: "Cafe Classics",
    description: "Double flame-grilled patties, double cheddar & fresh greens."
  },
  { 
    name: "Thick Belgian Chocolate Milkshake", 
    url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", 
    category: "Dessert Parlor",
    description: "Rich blended chocolate ice cream topped with shavings."
  },
];

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setAdminToken } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDish, setActiveDish] = useState(0);

  // Auto-slide signature dishes
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDish((prev) => (prev + 1) % SIGNATURE_DISHES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.token || res.data?.adminToken;
      if (token) {
        setAdminToken(token);
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || "Invalid credentials.";
      toast({ title: "Login Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative flex flex-col justify-center h-screen max-h-screen">
        
        {/* === PAGE-WIDE UNIFIED VIDEO BACKGROUND === */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <VideoBackground className="scale-105 opacity-40 lg:opacity-50" />
          <div className="absolute inset-0 bg-black/85 lg:bg-black/75 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]" />
          {/* Ambient Glowing red spots */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-red-800/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-red-950/10 blur-[130px] pointer-events-none" />
          {/* Shared geometric background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        </div>

        {/* Main Grid Wrapper - strict h-screen and overflow-hidden on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-screen w-full relative z-10 overflow-y-auto lg:overflow-hidden">
          
          {/* === LEFT COLUMN: CINEMATIC SHOWCASE (6 COLS) === */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 xl:p-12 overflow-hidden h-full min-h-[50vh] lg:min-h-screen lg:max-h-screen">
            
            {/* Top Brand Logo */}
            <div className="flex items-center justify-between shrink-0">
              <div 
                onClick={() => navigate("/")} 
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500 group-hover:text-black transition-colors duration-500">
                  <Utensils className="h-4.5 w-4.5 text-red-500 group-hover:text-black" />
                </div>
                <div>
                  <span className="font-display text-base font-black tracking-widest text-white group-hover:text-red-400 transition-colors">Temptations</span>
                  <span className="text-[9px] block text-white/40 tracking-[0.2em] uppercase leading-none mt-0.5">New Iceberg</span>
                </div>
              </div>
              <Badge className="bg-red-950/40 hover:bg-red-950/40 text-red-400 border border-red-900/50 uppercase tracking-[0.2em] px-2 py-0.5 text-[8px]">
                Brand Portal
              </Badge>
            </div>

            {/* Middle Main Content Showcase - compacted layout to fit without scrolling */}
            <div className="my-auto py-6 space-y-6 flex-grow flex flex-col justify-center overflow-hidden">
              <div className="space-y-2 shrink-0">
                <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] block">Welcome to Temptations</span>
                <h2 className="font-display text-3xl xl:text-4xl font-black tracking-tight leading-none text-glow-white">
                  Chirala's Ultimate <br className="hidden xl:inline" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500 text-glow">Culinary Destination</span>
                </h2>
                <p className="text-white/60 text-xs max-w-xl leading-relaxed">
                  Experience a premium blend of multi-cuisine delicacies, artisan cakes, customized pastries, and thick Belgian milkshakes, all set in a pleasant, photo-friendly atmosphere.
                </p>
              </div>

              {/* Signature Dishes Slider - slightly smaller height */}
              <div className="space-y-3 shrink-0">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Popular Signature Offerings
                </span>
                
                <div className="relative h-32 w-full max-w-xl glass border-white/10 rounded-2xl overflow-hidden flex gap-4 p-2.5 items-center hover:border-red-500/20 hover:shadow-[0_12px_25px_rgba(239,68,68,0.1)] transition-all duration-500">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                  
                  {/* Sliding image */}
                  <div className="w-1/4 h-full rounded-xl overflow-hidden relative shrink-0">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={activeDish}
                        src={SIGNATURE_DISHES[activeDish].url} 
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full object-cover" 
                        alt={SIGNATURE_DISHES[activeDish].name} 
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/5" />
                  </div>
                  
                  {/* Sliding details */}
                  <div className="flex-grow space-y-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeDish}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-0.5"
                      >
                        <span className="text-[8px] uppercase tracking-widest text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded-full inline-block">
                          {SIGNATURE_DISHES[activeDish].category}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-wide truncate">
                          {SIGNATURE_DISHES[activeDish].name}
                        </h4>
                        <p className="text-[11px] text-white/50 leading-normal line-clamp-2 pr-2">
                          {SIGNATURE_DISHES[activeDish].description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Dots indicator */}
                    <div className="flex gap-1 pt-0.5">
                      {SIGNATURE_DISHES.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveDish(idx)}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            activeDish === idx ? "w-4 bg-red-500" : "w-1 bg-white/20 hover:bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Highlights Grid - compacted */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl shrink-0">
                {[
                  { icon: Utensils, label: "Menu Highlights", desc: "Biryanis & North Indian curries" },
                  { icon: Cake, label: "Bakery & Cafe", desc: "Pastries, burgers & custom cakes" },
                  { icon: IceCream, label: "Dessert Parlor", desc: "Thick milkshakes & premium scoops" },
                  { icon: Camera, label: "Ambiance & Events", desc: "Cozy spaces, birthday gathering zones" }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="glass border-white/10 p-3 rounded-xl flex items-start gap-3 hover:border-red-500/15 hover:bg-white/[0.02] transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-950/20 border border-red-900/40 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-white tracking-wide">{item.label}</h5>
                      <p className="text-[10px] text-white/40 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Metadata details - shrink-0 */}
            <div className="border-t border-white/5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] shrink-0">
              <div>
                <span className="text-[8px] block text-white/30 uppercase tracking-widest font-semibold mb-0.5">Location</span>
                <p className="font-semibold text-white/80 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                  Opp. Sri Chaitanya School
                </p>
              </div>
              <div>
                <span className="text-[8px] block text-white/30 uppercase tracking-widest font-semibold mb-0.5">Hours</span>
                <p className="font-semibold text-white/80 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-500 shrink-0" />
                  11am - 11pm Daily
                </p>
              </div>
              <div>
                <span className="text-[8px] block text-white/30 uppercase tracking-widest font-semibold mb-0.5">Average Price</span>
                <p className="font-semibold text-white/80 flex items-center gap-1 font-display">
                  <Coins className="h-3 w-3 text-red-500 shrink-0" />
                  ₹200 - ₹400 / Person
                </p>
              </div>
              <div>
                <span className="text-[8px] block text-white/30 uppercase tracking-widest font-semibold mb-0.5">Services</span>
                <p className="font-semibold text-white/80 flex items-center gap-1">
                  <Truck className="h-3 w-3 text-red-500 shrink-0" />
                  Dine-In • Delivery
                </p>
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN: LOGIN FULL SCREEN PANEL (6 COLS) - MADE LARGE AND STUNNING === */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 border-t lg:border-t-0 lg:border-l border-white/10 glass bg-white/[0.01] backdrop-blur-2xl min-h-[50vh] lg:min-h-screen lg:max-h-screen relative overflow-hidden">
            
            {/* Glowing vertical connector */}
            <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-red-500/20 via-red-500/5 to-transparent hidden lg:block" />
            
            {/* Big cinematic radial red light behind form */}
            <div className="absolute w-[450px] h-[450px] bg-red-950/20 blur-[130px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full max-w-md space-y-10 relative z-10"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, stiffness: 100 }}
                  className="relative w-20 h-20 rounded-full bg-red-950/20 border border-red-500/35 flex items-center justify-center mx-auto group shadow-[0_0_35px_rgba(239,68,68,0.3)]"
                >
                  {/* Glowing pulse rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping pointer-events-none opacity-50" />
                  <div className="absolute -inset-2 rounded-full border border-red-500/10 animate-pulse-slow pointer-events-none" />
                  <Lock className="h-8 w-8 text-red-500" />
                </motion.div>
                
                <div className="space-y-1.5">
                  <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Admin Portal
                  </h1>
                  <p className="text-white/40 text-xs sm:text-sm uppercase tracking-widest font-bold">
                    Sign in to manage temptations
                  </p>
                </div>
              </div>

              {/* Large styled login form */}
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-white/45 text-xs uppercase tracking-widest font-extrabold">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass border-white/10 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all duration-300 rounded-2xl h-14 text-base text-white placeholder:text-white/25 bg-black/30 px-5"
                    placeholder="admin@temptations.com"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-white/45 text-xs uppercase tracking-widest font-extrabold">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="glass border-white/10 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all duration-300 rounded-2xl h-14 pr-12 text-base text-white placeholder:text-white/25 bg-black/30 px-5"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-red-600 via-red-700 to-red-900 text-white font-extrabold text-base tracking-widest rounded-2xl hover:from-red-500 hover:via-red-600 hover:to-red-800 hover:shadow-[0_0_35px_rgba(239,68,68,0.5)] transition-all duration-500"
                >
                  {loading ? "VERIFYING SECURITY CREDENTIALS..." : "SIGN IN TO PORTAL"}
                </Button>
              </form>

              {/* Bottom Secure Certification */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/35 uppercase tracking-widest font-bold">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                SECURE ACCESS SESSION (CGI)
              </div>

              <div className="text-center">
                <button
                  onClick={() => navigate("/")}
                  className="text-white/40 text-xs uppercase tracking-widest hover:text-white hover:tracking-wider transition-all duration-300"
                >
                  ← Return to Restaurant Homepage
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default AdminLogin;
