import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setAdminToken } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <div className="min-h-screen bg-cinematic-radial flex items-center justify-center px-4">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Card className="glass border-white/10 p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4"
              >
                <Lock className="h-7 w-7 text-primary" />
              </motion.div>
              <h1 className="font-display text-2xl font-bold text-glow-subtle">Admin Portal</h1>
              <p className="text-muted-foreground text-sm mt-1">Sign in to manage OG</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass border-white/10 focus:border-primary/50 focus:neon-glow transition-all"
                  placeholder="admin@og.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Password</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass border-white/10 focus:border-primary/50 pr-10 focus:neon-glow transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/80 text-primary-foreground font-semibold transition-all duration-300 hover:neon-glow"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6"
          >
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              ← Back to Home
            </button>
          </motion.p>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AdminLogin;
