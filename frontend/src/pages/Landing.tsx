import { motion } from "framer-motion";
import { QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import RestaurantInfo from "@/components/RestaurantInfo";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            className="w-full h-full object-cover scale-105"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/assets/dashboard-video.mp4" type="video/mp4" />
          </video>
          {/* Enhanced Overlay for readability */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        </div>

        {/* Cinematic Particles/Glow - Changed from red to soft neutral white glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-[120px] pointer-events-none z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />

        {/* Content Wrapper */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-5xl">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-4"
          >
            <h1 className="font-display text-8xl md:text-9xl font-black tracking-tighter text-glow-white text-white">
              OG
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-white/60 text-lg md:text-xl mb-2 tracking-[0.3em] uppercase font-light"
          >
            Fine Dining Experience
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="w-24 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-10"
          />

          {/* QR Instruction */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="flex flex-col items-center gap-2 mb-4"
          >
            <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <QrCode className="h-7 w-7 text-white" />
            </div>
            <p className="text-center text-white/50 text-xs max-w-xs leading-relaxed">
              Scan the <span className="text-white font-medium">QR code</span> at your table to begin.<br />
              Unique code for every table.
            </p>
          </motion.div>

          {/* Restaurant Info Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="w-full max-w-5xl mb-6"
          >
            <RestaurantInfo />
          </motion.div>

          {/* Admin Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="w-full max-w-xs mb-8"
          >
            <Button
              onClick={() => navigate("/admin-login")}
              className="w-full h-12 text-base font-semibold glass border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
              variant="outline"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 text-muted-foreground/50 text-xs tracking-widest uppercase z-20"
        >
          Scan QR at your table to begin
        </motion.p>
      </div>
    </PageTransition>
  );
};

export default Landing;
