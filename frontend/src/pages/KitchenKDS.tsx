import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io as socketIO } from "socket.io-client";
import { ChefHat, Clock, LogOut, Volume2, VolumeX, Maximize, Users, AlertTriangle, CheckCircle2, Utensils, Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://qr-restaurant-system-1.onrender.com/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://qr-restaurant-system-1.onrender.com";

interface OrderItem {
  name?: string;
  quantity: number;
  price?: number;
}

interface Order {
  _id: string;
  tableNumber: number;
  items: OrderItem[];
  status: string;
  specialNote?: string;
  priority?: number;
  kitchenAcceptedAt?: string;
  createdAt?: string;
  totalAmount?: number;
}

const COLUMNS = [
  { id: "pending", label: "NEW ORDERS", color: "border-red-500/40", bg: "from-red-950/20", headerColor: "text-red-400", icon: AlertTriangle, pulse: true },
  { id: "accepted", label: "ACCEPTED", color: "border-amber-500/40", bg: "from-amber-950/20", headerColor: "text-amber-400", icon: CheckCircle2, pulse: false },
  { id: "cooking", label: "COOKING", color: "border-blue-500/40", bg: "from-blue-950/20", headerColor: "text-blue-400", icon: Flame, pulse: true },
  { id: "ready", label: "READY TO SERVE", color: "border-emerald-500/40", bg: "from-emerald-950/20", headerColor: "text-emerald-400", icon: CheckCircle2, pulse: false },
];

const STATUS_FLOW: Record<string, string> = {
  pending: "accepted",
  accepted: "cooking",
  cooking: "ready",
};

function useOrderTimer(createdAt?: string) {
  const [minutes, setMinutes] = useState(0);
  
  useEffect(() => {
    if (!createdAt) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
      setMinutes(diff);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return minutes;
}

function TimerBadge({ createdAt }: { createdAt?: string }) {
  const minutes = useOrderTimer(createdAt);
  
  const colorClass = minutes >= 10
    ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
    : minutes >= 5
    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-black ${colorClass}`}>
      <Clock className="w-3 h-3" />
      {minutes}min
    </span>
  );
}

function OrderCard({ order, onAdvance, advancing }: {
  order: Order;
  onAdvance: (id: string, nextStatus: string) => void;
  advancing: boolean;
}) {
  const minutes = useOrderTimer(order.createdAt);
  const isUrgent = minutes >= 10;
  const isWarning = minutes >= 5 && minutes < 10;
  const nextStatus = STATUS_FLOW[order.status];

  const cardBorder = isUrgent
    ? "border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
    : isWarning
    ? "border-amber-500/40"
    : "border-white/10";

  const nextLabels: Record<string, string> = {
    accepted: "✓ Accept",
    cooking: "🍳 Start Cooking",
    ready: "✅ Mark Ready",
  };

  const nextColors: Record<string, string> = {
    accepted: "from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500",
    cooking: "from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500",
    ready: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`rounded-2xl border-2 bg-white/[0.03] backdrop-blur-sm p-5 relative overflow-hidden ${cardBorder} transition-colors duration-300`}
    >
      {/* Urgent flash overlay */}
      {isUrgent && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-2xl pointer-events-none" />
      )}

      {/* Top accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${
        isUrgent ? "bg-gradient-to-r from-transparent via-red-500 to-transparent"
        : isWarning ? "bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
        : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-4xl font-black text-white tracking-tight font-mono">
              {order.tableNumber}
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/40 block font-bold">TABLE</span>
              {order.priority && order.priority > 0 && (
                <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                  PRIORITY
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-white/30 font-medium">{order.items.length} items</span>
        </div>
        <TimerBadge createdAt={order.createdAt} />
      </div>

      {/* Items list */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-xl font-black text-white/80 font-mono w-8 shrink-0">
              {item.quantity}×
            </span>
            <span className="text-base font-bold text-white leading-tight">
              {item.name || "Unknown Item"}
            </span>
          </div>
        ))}
      </div>

      {/* Special note */}
      {order.specialNote && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block mb-1">⚠ Note</span>
          <span className="text-sm text-amber-200 font-medium">{order.specialNote}</span>
        </div>
      )}

      {/* Action button */}
      {nextStatus && (
        <button
          onClick={() => onAdvance(order._id, nextStatus)}
          disabled={advancing}
          className={`w-full py-3 rounded-xl text-white font-black text-sm tracking-wider bg-gradient-to-r transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 ${nextColors[nextStatus] || "from-gray-600 to-gray-700"}`}
        >
          {advancing ? "Updating..." : (nextLabels[nextStatus] || `→ ${nextStatus}`)}
        </button>
      )}

      {order.status === "ready" && (
        <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-sm text-center tracking-wider">
          ✅ Ready — Waiting for Waiter
        </div>
      )}
    </motion.div>
  );
}

export default function KitchenKDS() {
  const { staffToken, adminToken, staffName, staffLogout } = useAuth();
  const activeToken = staffToken || adminToken;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/kitchen`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch {
      // fallback to all orders endpoint with admin token
    }
  }, [activeToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!activeToken) return;
    const socket = socketIO(SOCKET_URL, { auth: { token: activeToken } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinKitchen");
    });

    socket.on("joinKitchenSuccess", () => {
      console.log("[KDS] Joined kitchen room");
    });

    socket.on("newKitchenOrder", (order: Order) => {
      setOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        if (exists) return prev;
        return [order, ...prev];
      });
      playBeep();
    });

    socket.on("kitchenStatusUpdate", (payload: { orderId: string; status: string }) => {
      setOrders(prev =>
        prev.map(o => o._id === payload.orderId ? { ...o, status: payload.status } : o)
      );
    });

    socket.on("orderCreated", (order: Order) => {
      setOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        if (exists) return prev;
        return [order, ...prev];
      });
      playBeep();
    });

    socket.on("disconnect", () => setConnected(false));

    return () => { socket.disconnect(); };
  }, [activeToken, playBeep]);

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    setAdvancing(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      // Optimistic update
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o)
      );
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setAdvancing(null);
    }
  };

  const handleLogout = () => {
    staffLogout();
    navigate("/staff-login");
  };

  const getColumnOrders = (status: string) =>
    orders.filter(o => o.status === status).sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

  const totalActive = orders.filter(o => ["pending", "accepted", "cooking"].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-[#060606] text-white overflow-x-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight">Kitchen Display</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                {staffName || "Kitchen Staff"} · Temptations
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
              connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {connected ? "Live" : "Offline"}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active orders count */}
            <div className="text-center">
              <span className="text-2xl font-black text-red-400 font-mono">{totalActive}</span>
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Active</p>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => document.documentElement.requestFullscreen?.()}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {COLUMNS.map((col) => {
            const columnOrders = getColumnOrders(col.id);
            const ColIcon = col.icon;

            return (
              <div key={col.id} className={`bg-gradient-to-b ${col.bg} to-transparent rounded-2xl border ${col.color} p-4`}>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ColIcon className={`w-4 h-4 ${col.headerColor}`} />
                    <h2 className={`text-[11px] font-black uppercase tracking-widest ${col.headerColor}`}>
                      {col.label}
                    </h2>
                    {col.pulse && columnOrders.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: "inherit" }} />
                    )}
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full bg-white/5 ${col.headerColor}`}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Order Cards */}
                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {columnOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-white/15">
                        <Utensils className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">No orders</span>
                      </div>
                    ) : (
                      columnOrders.map(order => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onAdvance={handleAdvance}
                          advancing={advancing === order._id}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
