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
      <div className="min-h-screen bg-cinematic-radial flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-4"
        >
          <h1 className="font-display text-8xl md:text-9xl font-black tracking-tighter text-glow text-primary-foreground">
            OG
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-muted-foreground text-lg md:text-xl mb-2 tracking-[0.3em] uppercase font-light"
        >
          Fine Dining Experience
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-24 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent mb-10"
        />

        {/* QR Instruction */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="flex flex-col items-center gap-2 mb-4"
        >
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center neon-glow">
            <QrCode className="h-7 w-7 text-primary" />
          </div>
          <p className="text-center text-muted-foreground text-xs max-w-xs leading-relaxed">
            Scan the <span className="text-foreground font-medium">QR code</span> at your table to begin.<br />
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

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 text-muted-foreground/50 text-xs tracking-widest uppercase"
        >
          Scan QR at your table to begin
        </motion.p>
      </div>
    </PageTransition>
  );
};

export default Landing;
