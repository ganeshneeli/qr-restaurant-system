import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io as socketIO } from "socket.io-client";
import { 
  ChefHat, 
  Clock, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Maximize, 
  AlertTriangle, 
  CheckCircle2, 
  Utensils, 
  Flame,
  Check
} from "lucide-react";
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
  { id: "pending", label: "NEW ORDERS", color: "border-red-500/40", bg: "from-red-950/10", headerColor: "text-red-400", icon: AlertTriangle, pulse: true },
  { id: "accepted", label: "ACCEPTED", color: "border-amber-500/40", bg: "from-amber-950/10", headerColor: "text-amber-400", icon: CheckCircle2, pulse: false },
  { id: "cooking", label: "COOKING", color: "border-blue-500/40", bg: "from-blue-950/10", headerColor: "text-blue-400", icon: Flame, pulse: true },
  { id: "ready", label: "READY TO SERVE", color: "border-emerald-500/40", bg: "from-emerald-950/10", headerColor: "text-emerald-400", icon: CheckCircle2, pulse: false },
];

const STATUS_FLOW: Record<string, string> = {
  pending: "accepted",
  accepted: "cooking",
  cooking: "ready",
};

// Live Digital Clock for Kitchen Staff
function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className="font-mono text-white/70 tracking-wider text-sm font-bold">{time}</span>;
}

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
      {minutes}m
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
  
  // Local checklist state for chefs to mark items off as they prepare them
  const [crossedItems, setCrossedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (idx: number) => {
    setCrossedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const hasPriority = order.priority && order.priority > 0;

  // Visual cues based on urgency/priority
  let cardBorder = "border-white/5 hover:border-white/10 shadow-lg";
  if (isUrgent) {
    cardBorder = "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/25";
  } else if (hasPriority) {
    cardBorder = "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-1 ring-amber-500/15";
  } else if (isWarning) {
    cardBorder = "border-amber-500/30";
  }

  // Pulsing LED Status colors matching columns
  const statusLedColors: Record<string, string> = {
    pending: "bg-red-500 shadow-[0_0_8px_#ef4444]",
    accepted: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
    cooking: "bg-blue-500 shadow-[0_0_8px_#3b82f6]",
    ready: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
  };

  const nextLabels: Record<string, string> = {
    accepted: "✓ Accept",
    cooking: "🍳 Start Cooking",
    ready: "✅ Mark Ready",
  };

  const nextColors: Record<string, string> = {
    accepted: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_12px_rgba(16,185,129,0.25)]",
    cooking: "from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_12px_rgba(59,130,246,0.25)]",
    ready: "from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-[0_4px_12px_rgba(245,158,11,0.25)]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`rounded-2xl border bg-[#121214]/60 backdrop-blur-md p-5 relative overflow-hidden ${cardBorder} transition-all duration-300`}
    >
      {/* Urgent background animation overlay */}
      {isUrgent && (
        <div className="absolute inset-0 bg-red-500/[0.02] animate-pulse rounded-2xl pointer-events-none" />
      )}

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${
        isUrgent ? "bg-gradient-to-r from-transparent via-red-500 to-transparent"
        : hasPriority ? "bg-gradient-to-r from-transparent via-amber-500 to-transparent"
        : isWarning ? "bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
        : "bg-gradient-to-r from-transparent via-white/5 to-transparent"
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-4xl font-black text-white tracking-tight font-mono leading-none">
              {order.tableNumber}
            </span>
            <div className="flex flex-col justify-center gap-0.5">
              <span className="text-[8px] uppercase tracking-widest text-white/35 font-black leading-none">TABLE</span>
              {hasPriority && (
                <span className="text-[8px] text-amber-400 font-black uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 leading-none">
                  PRIORITY
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-white/40 font-bold tracking-wide">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <TimerBadge createdAt={order.createdAt} />
          {/* LED Status Light */}
          <span className={`w-2.5 h-2.5 rounded-full ${statusLedColors[order.status] || "bg-white/10"} animate-pulse`} />
        </div>
      </div>

      {/* Items list with interactive checklists */}
      <div className="space-y-2 mb-5">
        {order.items.map((item, idx) => {
          const isCrossed = !!crossedItems[idx];
          return (
            <div 
              key={idx} 
              onClick={() => toggleItem(idx)}
              className="flex items-center gap-3 cursor-pointer select-none group/item py-1.5 px-2 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              {/* Checkbox box */}
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                isCrossed 
                  ? "bg-emerald-500 border-emerald-500 text-black" 
                  : "border-white/20 group-hover/item:border-white/40"
              }`}>
                {isCrossed && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
              </div>
              
              <div className="flex items-baseline gap-2 min-w-0">
                <span className={`text-lg font-black font-mono transition-all duration-300 ${
                  isCrossed ? "text-emerald-500/30 line-through" : "text-orange-400"
                }`}>
                  {item.quantity}×
                </span>
                <span className={`text-base font-bold transition-all duration-300 truncate ${
                  isCrossed ? "text-white/25 line-through" : "text-white group-hover/item:text-orange-300"
                }`}>
                  {item.name || "Unknown Item"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special note */}
      {order.specialNote && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 relative overflow-hidden">
          <span className="text-[8px] text-amber-400 font-black uppercase tracking-widest block mb-0.5">⚠ Chef Note</span>
          <span className="text-sm text-amber-200/90 font-semibold leading-tight">{order.specialNote}</span>
        </div>
      )}

      {/* Action button */}
      {nextStatus && (
        <button
          onClick={() => onAdvance(order._id, nextStatus)}
          disabled={advancing}
          className={`w-full py-3 rounded-xl text-white font-black text-sm tracking-wider bg-gradient-to-r transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 ${nextColors[nextStatus] || "from-gray-600 to-gray-700"}`}
        >
          {advancing ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Updating...
            </span>
          ) : (nextLabels[nextStatus] || `→ ${nextStatus}`)}
        </button>
      )}

      {order.status === "ready" && (
        <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs text-center tracking-widest uppercase flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Ready · Waiting for Waiter
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
      // fallback
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
    <div className="h-screen bg-[#050506] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] text-white overflow-hidden flex flex-col font-sans">
      {/* Top bar control panel */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 shadow-xl shrink-0">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-red-500/10 border border-orange-500/25 flex items-center justify-center shadow-inner group">
              <ChefHat className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Kitchen Display</h1>
                <span className="text-[10px] text-white/30 font-bold font-mono">v1.2</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
                <span>{staffName || "Kitchen Staff"}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-orange-400/80 font-bold">Temptations KDS</span>
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
              connected 
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]" 
                : "border-red-500/20 bg-red-500/5 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)] animate-pulse"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" : "bg-red-500 shadow-[0_0_6px_#ef4444]"}`} />
              {connected ? "System Live" : "Offline Connection"}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock */}
            <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
              <LiveClock />
              <span className="text-[8px] uppercase tracking-widest text-white/30 font-black mt-0.5">Kitchen Local Time</span>
            </div>

            {/* Active orders count */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-right">
                <p className="text-[9px] text-white/30 uppercase tracking-widest font-black leading-none mb-0.5">Queue Status</p>
                <span className="text-lg font-black text-orange-400 font-mono leading-none">{totalActive} Active</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-orange-400" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                  soundEnabled 
                    ? "bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05]" 
                    : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                }`}
                title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => document.documentElement.requestFullscreen?.()}
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-300"
                title="Fullscreen Mode"
              >
                <Maximize className="w-4 h-4" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300 shadow-lg shadow-red-950/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit KDS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Locked Kanban Board */}
      <div className="p-6 max-w-[1800px] w-full mx-auto flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 h-full min-h-0">
          {COLUMNS.map((col) => {
            const columnOrders = getColumnOrders(col.id);
            const ColIcon = col.icon;

            return (
              <div 
                key={col.id} 
                className="bg-[#0c0c0e]/50 border border-white/5 rounded-2xl p-4 flex flex-col h-full min-h-0 relative overflow-hidden transition-all"
              >
                {/* Colored top line accent for columns */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                  col.id === 'pending' ? 'from-red-500 to-rose-600' :
                  col.id === 'accepted' ? 'from-amber-500 to-orange-500' :
                  col.id === 'cooking' ? 'from-blue-500 to-indigo-600' :
                  'from-emerald-500 to-teal-600'
                }`} />

                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mt-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <ColIcon className={`w-4.5 h-4.5 ${col.headerColor}`} />
                    <h2 className={`text-xs font-black uppercase tracking-wider ${col.headerColor}`}>
                      {col.label}
                    </h2>
                    {col.pulse && columnOrders.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" style={{ color: "inherit" }} />
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${col.headerColor}`}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Column Cards (Independently Scrollable + Lenis Intercept Bypassed) */}
                <div 
                  data-lenis-prevent 
                  className="space-y-4 overflow-y-auto flex-1 pr-1 mt-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                  <AnimatePresence>
                    {columnOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-white/10">
                        <Utensils className="w-10 h-10 mb-2 stroke-[1.5]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">No orders</span>
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
