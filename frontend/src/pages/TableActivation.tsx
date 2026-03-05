import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TableActivation = () => {
  const { tableId } = useParams();         // this is the tableNumber in the URL
  const navigate = useNavigate();
  const { setSessionToken, getSessionToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [occupied, setOccupied] = useState(false);
  const activationStarted = useRef(false);

  useEffect(() => {
    if (!tableId || activationStarted.current) return;

    // Check if user already has an active session for this table in this browser tab
    if (getSessionToken(tableId)) {
      navigate(`/table/${tableId}/menu`, { replace: true });
      return;
    }

    activationStarted.current = true; // Lock immediately to prevent Strict Mode parallel fetching

    const activate = async () => {
      try {
        const res = await api.post(`/table/${tableId}/activate`);
        const token = res.data?.token || res.data?.sessionToken;
        if (token) {
          // Store token under per-table key so different tabs never conflict
          setSessionToken(token, tableId);
          setTimeout(() => navigate(`/table/${tableId}/menu`, { replace: true }), 600);
        }
      } catch (err) {
        const error = err as { response?: { status: number } };
        if (error.response?.status === 409 || error.response?.status === 400) {
          setOccupied(true);
        }
      } finally {
        setLoading(false);
      }
    };

    activate();
  }, [tableId, navigate, setSessionToken, getSessionToken]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-cinematic flex items-center justify-center">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground tracking-wider uppercase text-sm">
              Activating Table {tableId}...
            </p>
          </motion.div>
        )}

        <Dialog open={occupied} onOpenChange={() => { }}>
          <DialogContent className="glass border-primary/20 max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-glow-subtle">
                Table Occupied
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This table currently has an active session. Please ask staff for assistance.
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/30"
              variant="outline"
            >
              Go Back
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default TableActivation;
