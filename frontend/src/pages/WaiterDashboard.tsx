import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io as socketIO } from "socket.io-client";
import { UtensilsCrossed, Bell, BellOff, LogOut, CheckCircle2, Clock, AlertTriangle, Package, Bike, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://qr-restaurant-system-1.onrender.com/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://qr-restaurant-system-1.onrender.com";

interface OrderItem { name?: string; quantity: number; }
interface Order {
  _id: string;
  tableNumber: number;
  items: OrderItem[];
  status: string;
  specialNote?: string;
  billRequested?: boolean;
  createdAt?: string;
  totalAmount?: number;
  priority?: number;
}

const WAITER_COLUMNS = [
  {
    id: "pending",
    label: "NEW ORDERS",
    icon: AlertTriangle,
    color: "border-red-500/30",
    bg: "from-red-950/15",
    headerColor: "text-red-400",
    badgeBg: "bg-red-500/10 border-red-500/20",
    desc: "Just came in from kitchen",
  },
  {
    id: "ready",
    label: "READY FOR PICKUP",
    icon: Package,
    color: "border-emerald-500/30",
    bg: "from-emerald-950/15",
    headerColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    desc: "Kitchen has completed these",
  },
  {
    id: "served",
    label: "DELIVERED",
    icon: CheckCircle2,
    color: "border-white/10",
    bg: "from-white/[0.01]",
    headerColor: "text-white/40",
    badgeBg: "bg-white/5 border-white/10",
    desc: "Delivered to table",
  },
];

function WaiterCard({ order, onMarkDelivered, delivering }: {
  order: Order;
  onMarkDelivered: (id: string) => void;
  delivering: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!order.createdAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - new Date(order.createdAt!).getTime()) / 60000));
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  const isBillPending = order.billRequested;
  const isReady = order.status === "ready";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93, y: -8 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className={`rounded-2xl border bg-white/[0.03] p-4 relative overflow-hidden transition-all duration-300 ${
        isReady
          ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          : isBillPending
          ? "border-amber-500/40"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Top accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${
        isReady ? "bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
        : isBillPending ? "bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
        : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-white font-mono">{order.tableNumber}</span>
          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Table</span>
            <span className="text-xs text-white/60 font-medium">{order.items.length} items</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
            elapsed >= 10 ? "border-red-500/30 bg-red-500/10 text-red-400"
            : elapsed >= 5 ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}>
            <Clock className="w-2.5 h-2.5" />
            {elapsed}m
          </span>
          {order.totalAmount && (
            <span className="text-[9px] text-white/30 font-medium">₹{order.totalAmount.toFixed(0)}</span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-sm font-black text-white/70 font-mono w-5">{item.quantity}×</span>
            <span className="text-sm font-medium text-white/80">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Bill requested badge */}
      {isBillPending && (
        <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300 font-bold">Bill Requested!</span>
        </div>
      )}

      {/* Special note */}
      {order.specialNote && (
        <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block mb-0.5">Note</span>
          <span className="text-xs text-white/60">{order.specialNote}</span>
        </div>
      )}

      {/* Action */}
      {order.status === "ready" && (
        <button
          onClick={() => onMarkDelivered(order._id)}
          disabled={delivering}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs tracking-wider transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Bike className="w-3.5 h-3.5" />
          {delivering ? "Updating..." : "Mark as Delivered"}
        </button>
      )}
    </motion.div>
  );
}

export default function WaiterDashboard() {
  const { staffToken, adminToken, staffName, staffLogout } = useAuth();
  const activeToken = staffToken || adminToken;
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [newReadyAlert, setNewReadyAlert] = useState<number | null>(null);
  const socketRef = useRef<any>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playNotif = useCallback(() => {
    if (!notifEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      [440, 550, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.25);
      });
    } catch {}
  }, [notifEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/waiter`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data.success) setOrders(res.data.orders || []);
    } catch {}
  }, [activeToken]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!activeToken) return;
    const socket = socketIO(SOCKET_URL, { auth: { token: activeToken } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinWaiter");
    });

    socket.on("orderReadyForPickup", (payload: { tableNumber: number; orderId: string }) => {
      setNewReadyAlert(payload.tableNumber);
      playNotif();
      setTimeout(() => setNewReadyAlert(null), 4000);
      fetchOrders();
    });

    socket.on("newWaiterTask", () => { fetchOrders(); });
    socket.on("billRequested", () => { fetchOrders(); });

    // Also listen for general updates
    socket.on("statusUpdated", () => { fetchOrders(); });

    socket.on("disconnect", () => setConnected(false));
    return () => { socket.disconnect(); };
  }, [activeToken, playNotif, fetchOrders]);

  const handleMarkDelivered = async (orderId: string) => {
    setDelivering(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: "served" }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "served" } : o));
    } catch {}
    finally { setDelivering(null); }
  };

  const handleLogout = () => {
    staffLogout();
    navigate("/staff-login");
  };

  const getColOrders = (status: string) =>
    orders.filter(o => o.status === status).sort((a, b) =>
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

  const readyCount = getColOrders("ready").length;
  const pendingCount = getColOrders("pending").length;

  return (
    <div className="min-h-screen bg-[#060606] text-white">
      {/* Toast Alert */}
      <AnimatePresence>
        {newReadyAlert !== null && (
          <motion.div
            initial={{ opacity: 0, y: -80, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -80, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm"
          >
            <Package className="w-5 h-5" />
            Table {newReadyAlert} is READY for pickup!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Waiter Dashboard</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{staffName || "Waiter"} · Temptations</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
              connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              {connected ? "Live" : "Offline"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {readyCount > 0 && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-black text-sm">{readyCount} Ready</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-black text-sm">{pendingCount} New</span>
              </div>
            )}

            <button
              onClick={() => setNotifEnabled(!notifEnabled)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              {notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
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

      {/* Board */}
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {WAITER_COLUMNS.map((col) => {
            const colOrders = getColOrders(col.id);
            const ColIcon = col.icon;

            return (
              <div key={col.id} className={`bg-gradient-to-b ${col.bg} to-transparent rounded-2xl border ${col.color} p-4`}>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ColIcon className={`w-4 h-4 ${col.headerColor}`} />
                    <h2 className={`text-[11px] font-black uppercase tracking-widest ${col.headerColor}`}>
                      {col.label}
                    </h2>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${col.badgeBg} ${col.headerColor}`}>
                    {colOrders.length}
                  </span>
                </div>
                <p className="text-[10px] text-white/25 font-medium mb-4">{col.desc}</p>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {colOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-white/15">
                        <Home className="w-6 h-6 mb-2" />
                        <span className="text-xs font-medium">Clear</span>
                      </div>
                    ) : (
                      colOrders.map(order => (
                        <WaiterCard
                          key={order._id}
                          order={order}
                          onMarkDelivered={handleMarkDelivered}
                          delivering={delivering === order._id}
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
