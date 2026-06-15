import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io as socketIO } from "socket.io-client";
import { 
  UtensilsCrossed, 
  Bell, 
  BellOff, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Package, 
  Bike, 
  Home,
  Check,
  ClipboardList,
  Layers,
  MapPin
} from "lucide-react";
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
      className={`rounded-2xl border bg-[#121214]/60 backdrop-blur-md p-4 relative overflow-hidden transition-all duration-300 ${
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
  const [tables, setTables] = useState<any[]>([]);
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

  const fetchTables = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tables/all`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.data.success) setTables(res.data.data || []);
    } catch {}
  }, [activeToken]);

  useEffect(() => { 
    fetchOrders(); 
    fetchTables();
  }, [fetchOrders, fetchTables]);

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
      fetchTables();
    });

    socket.on("newWaiterTask", () => { 
      fetchOrders(); 
      fetchTables(); 
    });

    socket.on("billRequested", () => { 
      fetchOrders(); 
      fetchTables(); 
    });

    socket.on("statusUpdated", () => { 
      fetchOrders(); 
      fetchTables(); 
    });

    socket.on("tableStatusChanged", () => {
      fetchTables();
      fetchOrders();
    });

    socket.on("disconnect", () => setConnected(false));
    return () => { socket.disconnect(); };
  }, [activeToken, playNotif, fetchOrders, fetchTables]);

  const handleMarkDelivered = async (orderId: string) => {
    setDelivering(orderId);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: "served" }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "served" } : o));
      fetchTables();
    } catch {}
    finally { setDelivering(null); }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: "accepted" }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      fetchOrders();
      fetchTables();
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  };

  const handleReleaseTable = async (tableNumber: number) => {
    if (!confirm(`Release Table ${tableNumber} and mark it available?`)) return;
    try {
      await axios.post(`${API_URL}/tables/${tableNumber}/release`, {}, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      fetchTables();
      fetchOrders();
    } catch (error) {
      console.error("Failed to release table:", error);
    }
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

  // Compute active tasks checklist
  const activeTasks = useMemo(() => {
    const list: { id: string; type: "pickup" | "bill" | "pending"; tableNumber: number; title: string; desc: string; actionText: string; action: () => void }[] = [];
    
    orders.forEach(order => {
      if (order.status === "ready") {
        list.push({
          id: `${order._id}-pickup`,
          type: "pickup",
          tableNumber: order.tableNumber,
          title: `Pickup Order`,
          desc: `Table ${order.tableNumber} has food ready in kitchen.`,
          actionText: "Deliver",
          action: () => handleMarkDelivered(order._id)
        });
      }
      if (order.billRequested) {
        list.push({
          id: `${order._id}-bill`,
          type: "bill",
          tableNumber: order.tableNumber,
          title: `Bring Bill`,
          desc: `Table ${order.tableNumber} requested check.`,
          actionText: "Release Table",
          action: () => handleReleaseTable(order.tableNumber)
        });
      }
      if (order.status === "pending") {
        list.push({
          id: `${order._id}-pending`,
          type: "pending",
          tableNumber: order.tableNumber,
          title: `New Order Awaiting`,
          desc: `Table ${order.tableNumber} sent new items.`,
          actionText: "Accept",
          action: () => handleAcceptOrder(order._id)
        });
      }
    });
    return list;
  }, [orders]);

  return (
    <div className="h-screen bg-[#050506] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] text-white overflow-hidden flex flex-col font-sans">
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
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 shadow-xl shrink-0">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Waiter Dashboard</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{staffName || "Waiter"} · Temptations Portal</p>
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

      {/* Main Body */}
      <div className="p-6 max-w-[1800px] w-full mx-auto flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex gap-6 h-full min-h-0">
          
          {/* LEFT CONTENT: KANBAN BOARD */}
          <div className="flex-1 min-h-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full min-h-0">
              {WAITER_COLUMNS.map((col) => {
                const colOrders = getColOrders(col.id);
                const ColIcon = col.icon;

                return (
                  <div key={col.id} className={`bg-[#0c0c0e]/50 border border-white/5 rounded-2xl p-4 flex flex-col h-full min-h-0 relative overflow-hidden transition-all`}>
                    
                    {/* Top colored accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                      col.id === 'pending' ? 'from-red-500 to-rose-600' :
                      col.id === 'ready' ? 'from-emerald-500 to-teal-600' :
                      'from-gray-500 to-gray-600'
                    }`} />

                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mt-1 shrink-0">
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
                    <p className="text-[10px] text-white/25 font-medium mt-2 shrink-0">{col.desc}</p>

                    {/* Cards Scrollable list */}
                    <div 
                      data-lenis-prevent 
                      className="space-y-4 overflow-y-auto flex-1 pr-1 mt-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                      <AnimatePresence>
                        {colOrders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-white/15">
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

          {/* RIGHT SIDEBAR: RESTAURANT TABLE FLOOR MAP & LIVE TASKS */}
          <div className="w-[360px] shrink-0 bg-[#0c0c0e]/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-6 h-full min-h-0">
            
            {/* Restaurant Floor Map */}
            <div className="shrink-0 space-y-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Live Floor Map
              </span>
              
              {tables.length === 0 ? (
                <div className="text-center py-6 text-white/20 text-xs font-semibold border border-white/5 rounded-xl">
                  No tables loaded
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                  {tables.map(table => {
                    const tableOrders = orders.filter(o => o.tableNumber === table.tableNumber);
                    const hasReady = tableOrders.some(o => o.status === "ready");
                    const hasBill = tableOrders.some(o => o.billRequested);
                    const hasActive = tableOrders.some(o => ["pending", "accepted", "cooking"].includes(o.status));
                    
                    let ringColor = "border-white/5 text-white/20 bg-white/[0.005]";
                    let statusLabel = "Free";
                    let pulseClass = "";

                    if (hasReady) {
                      ringColor = "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]";
                      statusLabel = "Ready";
                      pulseClass = "animate-pulse";
                    } else if (hasBill) {
                      ringColor = "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]";
                      statusLabel = "Bill";
                      pulseClass = "animate-pulse";
                    } else if (hasActive) {
                      ringColor = "border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]";
                      statusLabel = "Active";
                    } else if (table.status === "occupied") {
                      ringColor = "border-blue-500 bg-blue-500/10 text-blue-400";
                      statusLabel = "Dining";
                    }

                    return (
                      <div
                        key={table._id}
                        onClick={() => table.status === "occupied" && handleReleaseTable(table.tableNumber)}
                        className={`h-14 rounded-xl border flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95 ${ringColor} ${pulseClass}`}
                        title={`Table ${table.tableNumber} (${statusLabel}) ${table.status === 'occupied' ? '— Click to release' : ''}`}
                      >
                        <span className="text-base font-black font-mono leading-none">{table.tableNumber}</span>
                        <span className="text-[7px] uppercase tracking-widest font-black opacity-60 mt-1">{statusLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Tasks Checklist */}
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 flex items-center gap-1.5 shrink-0">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                Active Waiter Tasks
              </span>
              
              <div 
                data-lenis-prevent
                className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              >
                {activeTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-white/10 text-center">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">All Tasks Completed</span>
                  </div>
                ) : (
                  activeTasks.map((task) => {
                    const taskColors = 
                      task.type === "pickup" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30" :
                      task.type === "bill" ? "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30" :
                      "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30";

                    return (
                      <div 
                        key={task.id}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-3 hover:border-white/10 hover:bg-white/[0.03] transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">{task.title}</h4>
                            <p className="text-[10px] text-white/40 mt-1 leading-snug">{task.desc}</p>
                          </div>
                          <span className={`text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded border ${
                            task.type === "pickup" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" :
                            task.type === "bill" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" :
                            "text-red-400 border-red-500/20 bg-red-500/10"
                          }`}>
                            {task.type}
                          </span>
                        </div>
                        
                        <button
                          onClick={task.action}
                          className={`w-full py-2.5 rounded-lg border font-bold text-xs tracking-wider transition-all duration-300 ${taskColors}`}
                        >
                          {task.actionText}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
