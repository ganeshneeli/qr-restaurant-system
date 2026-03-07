import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  Clock,
  Table2,
  QrCode,
  Download,
  CheckCircle2,
  IndianRupee,
  Printer,
  Plus,
  Settings2,
  Eye,
  EyeOff,
  Search,
  Pencil,
  Trash2,
  Flame,
  Star,
  MessageSquare,
  ChefHat,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { io as socketIO } from "socket.io-client";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://qr-restaurant-system-1.onrender.com";
import PageTransition from "@/components/PageTransition";
import AnimatedCounter from "@/components/AnimatedCounter";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  name?: string;
  foodId?: string;
  quantity: number;
  price?: number;
}

interface Order {
  _id: string;
  tableNumber?: number;
  table?: { number: number };
  items: OrderItem[];
  totalAmount?: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  billRequested?: boolean;
  sessionId?: string;
  specialNote?: string;
}

interface TableData {
  _id: string;
  tableNumber?: number;
  number?: number;
  status: string;
  activatedAt?: string;
  startedAt?: string;
}

interface Summary {
  totalRevenue?: number;
  totalOrders?: number;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  order_count?: number;
  isChefSpecial?: boolean;
}

interface AnalyticsData {
  mostOrdered: MenuItem[];
  leastOrdered: MenuItem[];
  dailyTrends: { _id: string; count: number; revenue: number }[];
}

interface QrData {
  tableNumber: number;
  qr: string;
  url: string;
}

interface Feedback {
  _id: string;
  order_id: string;
  table_number: string;
  customer_rating: number;
  customer_feedback_text: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  preparing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  served: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-white/10 text-white/50 border-white/10",
};

const sections = [
  { id: "orders", label: "Live Orders", icon: UtensilsCrossed },
  { id: "tables", label: "All Tables", icon: Table2 },
  { id: "menu", label: "Menu", icon: Settings2 },
  { id: "qrcodes", label: "QR Codes", icon: QrCode },
  { id: "history", label: "Order History", icon: Clock },
  { id: "summary", label: "Daily Summary", icon: BarChart3 },
  { id: "reviews", label: "Customer Reviews", icon: MessageSquare },
];

const PAGE_SIZE = 5;

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<QrData[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Other", image: "" });
  const [newItemFile, setNewItemFile] = useState<File | null>(null);
  const [editItemFile, setEditItemFile] = useState<File | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [mostOrderedPage, setMostOrderedPage] = useState(1);
  const [leastOrderedPage, setLeastOrderedPage] = useState(1);
  const socketRef = useRef<any>(null);

  // Feedback reviews state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [feedbackFilter, setFeedbackFilter] = useState<number | null>(null);

  const resolveImagePath = (imagePath?: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${SOCKET_URL}${imagePath}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, tablesRes, summaryRes] = await Promise.all([
        api.get("/orders"),
        api.get("/table/all"),
        api.get("/orders/summary/today"),
      ]);
      setOrders(ordersRes.data?.orders || []);
      setTables(tablesRes.data?.data || []);
      setSummary(summaryRes.data || {});

      const menuRes = await api.get("/menu");
      setMenuItems(menuRes.data?.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/orders?status=all");
      setHistoryOrders(res.data?.orders || []);
    } catch {
      toast({ title: "Error", description: "Failed to load history", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeSection === "history") fetchHistory();
    if (activeSection === "summary") fetchAnalytics();
    if (activeSection === "reviews") fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, fetchHistory]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get("/orders/analytics");
      setAnalytics(res.data?.data || null);
    } catch {
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchFeedback = async (rating?: number | null) => {
    setFeedbacksLoading(true);
    try {
      const params = rating ? `?rating=${rating}` : "";
      const [listRes, statsRes] = await Promise.all([
        api.get(`/feedback${params}`),
        api.get("/feedback/stats"),
      ]);
      setFeedbacks(listRes.data?.data || []);
      setFeedbackStats(statsRes.data?.data || { averageRating: 0, totalReviews: 0 });
    } catch {
      // silent
    } finally {
      setFeedbacksLoading(false);
    }
  };

  // Handle Socket Connection separately to keep it stable
  useEffect(() => {
    console.log("🔌 Admin: Initializing socket connection...");
    const socket = socketIO(SOCKET_URL, { autoConnect: false });
    socketRef.current = socket;

    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Admin Socket connected:", socket.id);
      socket.emit("join-admin");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Admin Socket connection error:", err);
    });

    return () => {
      console.log("🔌 Admin: Disconnecting socket...");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Only on mount/unmount

  // Handle Socket Listeners
  useEffect(() => {
    const handleNewOrder = (order: Order) => {
      console.log("📦 Socket: newOrder received", order);
      setOrders((prev) => {
        const exists = prev.find((o) => o._id === order._id);
        if (exists) return prev.map((o) => (o._id === order._id ? order : o));
        return [order, ...prev];
      });
      toast({
        title: "🍽️ New Order!",
        description: `Table ${order.tableNumber || order.table?.number}`
      });
    };

    const handleBillRequested = (data: { tableNumber: number }) => {
      console.log("🧾 Socket: billRequested received", data);
      toast({
        title: "🧾 Bill Requested",
        description: `Table ${data.tableNumber}`
      });
      fetchData();
    };

    const handleStatusUpdated = () => {
      console.log("🔄 Socket: orderStatusUpdated received");
      fetchData();
    };

    const handleOrderPaid = () => {
      console.log("💰 Socket: orderPaid received");
      fetchData();
    };

    const handleTableUpdated = () => {
      console.log("🪑 Socket: tableUpdated received");
      fetchData();
    };

    const socket = socketRef.current;
    if (!socket) return;

    socket.on("newOrder", handleNewOrder);
    socket.on("billRequested", handleBillRequested);
    socket.on("orderStatusUpdated", handleStatusUpdated);
    socket.on("orderPaid", handleOrderPaid);
    socket.on("tableUpdated", handleTableUpdated);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("billRequested", handleBillRequested);
      socket.off("orderStatusUpdated", handleStatusUpdated);
      socket.off("orderPaid", handleOrderPaid);
      socket.off("tableUpdated", handleTableUpdated);
    };
  }, [fetchData, toast]);

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        status === "completed"
          ? prev.filter((o) => o._id !== orderId)
          : prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
      if (status === "completed") fetchData();
      toast({ title: "Updated", description: `Order marked as ${status}` });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const markAsPaid = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/pay`);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      fetchData(); // Refresh tables and summary
      toast({ title: "✅ Payment Confirmed", description: "Order marked as paid & table freed" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const loadQrCodes = useCallback(async (forced = false) => {
    if (!forced && qrCodes.length > 0 && qrCodes.length === tables.length) return;
    setQrLoading(true);
    try {
      const qrs: QrData[] = [];
      // Fetch QRs for all existing tables in the state
      const tableNumbers = tables.map(t => t.tableNumber ?? t.number).filter(Boolean);

      for (const tableNum of tableNumbers) {
        try {
          const res = await api.get(`/table/${tableNum}/qr`);
          if (res.data?.success) qrs.push(res.data);
        } catch { /* skip */ }
      }
      setQrCodes(qrs);
    } finally {
      setQrLoading(false);
    }
  }, [qrCodes.length, tables]);

  useEffect(() => {
    if (activeSection === "qrcodes") loadQrCodes();
  }, [activeSection, loadQrCodes]);

  const downloadQr = (qr: QrData) => {
    const a = document.createElement("a");
    a.href = qr.qr;
    a.download = `table-${qr.tableNumber}-qr.png`;
    a.click();
  };

  const handleForceRelease = async (tableNumber: number) => {
    if (!window.confirm(`Are you sure you want to manually release Table ${tableNumber}?`)) return;
    try {
      await api.post(`/table/${tableNumber}/release`);
      fetchData();
      toast({ title: "Success", description: `Table ${tableNumber} has been released.` });
    } catch {
      toast({ title: "Error", description: "Failed to release table", variant: "destructive" });
    }
  };

  const handleAddTable = async () => {
    try {
      const res = await api.post("/table/add");
      if (res.data?.success) {
        fetchData();
        toast({ title: "Success", description: `Table ${res.data.data.tableNumber} added!` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add table", variant: "destructive" });
    }
  };

  const handleRemoveTable = async (tableNumber: number) => {
    if (!window.confirm(`Are you sure you want to remove Table ${tableNumber}?`)) return;
    try {
      const res = await api.delete(`/table/${tableNumber}`);
      if (res.data?.success) {
        fetchData();
        toast({ title: "Success", description: `Table ${tableNumber} removed.` });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to remove table";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("price", newItem.price);
      formData.append("category", newItem.category);
      formData.append("image", newItem.image);
      if (newItemFile) {
        formData.append("imageFile", newItemFile);
      }

      const res = await api.post("/menu", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        setMenuItems(prev => [...prev, res.data.data]);
        setIsAddingItem(false);
        setNewItem({ name: "", price: "", category: "Other", image: "" });
        setNewItemFile(null);
        toast({ title: "Success", description: "New item added to menu" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const toggleItemAvailability = async (itemId: string) => {
    try {
      const res = await api.put(`/menu/${itemId}/toggle`);
      if (res.data?.success) {
        setMenuItems(prev => prev.map(item =>
          item._id === itemId ? { ...item, available: res.data.data.available } : item
        ));
        toast({
          title: "Availability Updated",
          description: `${res.data.data.name} is now ${res.data.data.available ? "Available" : "Unavailable"}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const formData = new FormData();
      formData.append("name", editingItem.name);
      formData.append("price", String(editingItem.price));
      formData.append("category", editingItem.category);
      formData.append("image", editingItem.image || "");
      if (editItemFile) {
        formData.append("imageFile", editItemFile);
      }

      await api.put(`/menu/${editingItem._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast({ title: "Success", description: "Item updated successfully" });
      setEditingItem(null);
      setEditItemFile(null);
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/menu/${id}`);
      toast({ title: "Success", description: "Item removed from menu" });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    }
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>${item.name || item.foodId} x ${item.quantity}</span>
        <span>₹${(item.price || 0) * item.quantity}</span>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - Table ${order.tableNumber || order.table?.number}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #000; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
            .order-info { margin-bottom: 15px; font-size: 14px; }
            .items { border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
            .total { font-weight: bold; font-size: 20px; text-align: right; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">OG RESTAURANT</h1>
            <p style="margin: 5px 0;">Fine Dining Experience</p>
          </div>
          <div class="order-info">
            <p><strong>Table:</strong> ${order.tableNumber || order.table?.number}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
            <p><strong>Order ID:</strong> ${order._id.slice(-6).toUpperCase()}</p>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="total">
            Total: ₹${order.totalAmount}
          </div>
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Visit again soon</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getTimeSince = (date?: string) => {
    if (!date) return "—";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return "just now";
    return `${diff}m ago`;
  };

  const filteredMenuItems = menuItems.filter(i =>
    i.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(menuSearchQuery.toLowerCase())
  );

  const filteredHistory = historyOrders.filter(o =>
    String(o.tableNumber || o.table?.number).includes(historySearchQuery) ||
    o._id.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const exportHistoryToCSV = () => {
    if (historyOrders.length === 0) return;

    const headers = ["Order ID", "Date", "Table", "Items", "Total Amount (₹)", "Status", "Payment"];
    const rows = historyOrders.map(o => [
      o._id.slice(-6).toUpperCase(),
      new Date(o.createdAt || "").toLocaleString(),
      o.tableNumber || o.table?.number || "—",
      o.items.map(i => `${i.name} (${i.quantity})`).join("; "),
      o.totalAmount,
      o.status,
      o.paymentStatus || "unpaid"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `order_history_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-cinematic flex pb-20 md:pb-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[260px] min-h-screen glass-strong border-r border-white/5 flex-col sticky top-0 z-40 h-screen overflow-y-auto">
          <div className="p-6 border-b border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-glow-subtle">OG</h1>
                <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
              </div>
            </div>

            {/* Background Video */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/assets/dashboard-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${activeSection === s.id
                  ? "bg-primary/20 text-primary-foreground border border-primary/30 neon-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-1 inset-x-2 z-50 glass-strong border border-white/10 rounded-2xl flex items-center justify-around px-2 py-2 bg-background/95 backdrop-blur-xl shadow-2xl safe-area-bottom">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${activeSection === s.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-300 ${activeSection === s.id ? "bg-primary/20 neon-glow -translate-y-1" : ""}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-bold leading-none transition-all ${activeSection === s.id ? "text-primary-foreground scale-110" : "font-medium"}`}>
                {s.label.split(" ").pop()}
              </span>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-glow-subtle flex items-center">
                  <span className="md:hidden text-primary mr-2">OG</span>
                  <span className="md:hidden text-white/20 mr-2">|</span>
                  {sections.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-muted-foreground text-xs md:text-sm mt-1">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="md:hidden text-muted-foreground hover:text-destructive glass border-white/5"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Video Header */}
            <div className="md:hidden mb-6 relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/assets/dashboard-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">Fine Dining</p>
                <p className="text-sm font-bold text-white tracking-tight">OG Dashboard</p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* === LIVE ORDERS === */}
                {activeSection === "orders" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {orders.map((order) => (
                        <motion.div
                          key={order._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, y: -20 }}
                          layout
                        >
                          <Card className="glass border-white/5 p-5 hover:neon-glow transition-all duration-300">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-display text-lg font-bold">
                                  Table {order.tableNumber ?? "—"}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {getTimeSince(order.createdAt)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge className={`${statusColors[order.status] || statusColors.pending} border text-xs`}>
                                  {order.status}
                                </Badge>
                                {order.paymentStatus === "paid" ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border text-xs">
                                    Paid ✓
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-xs">
                                    Unpaid
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-1.5 mb-3">
                              {order.items?.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {item.name || item.foodId} × {item.quantity}
                                  </span>
                                  {item.price && (
                                    <span>₹{item.price * item.quantity}</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {order.specialNote && (
                              <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20 flex gap-2 items-start">
                                <ChefHat className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Chef Note</p>
                                  <p className="text-xs italic text-white/90">"{order.specialNote}"</p>
                                </div>
                              </div>
                            )}

                            {order.billRequested && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border mb-3 w-full justify-center">
                                🧾 Bill Requested
                              </Badge>
                            )}

                            <Separator className="bg-white/5 mb-3" />

                            {/* Total */}
                            <div className="flex justify-between font-semibold mb-4">
                              <span>Grand Total</span>
                              <span className="text-glow-subtle flex items-center gap-0.5">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {order.totalAmount ?? "—"}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                {order.status === "pending" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order._id, "preparing")}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400"
                                    variant="outline"
                                  >
                                    Preparing
                                  </Button>
                                )}
                                {order.status === "preparing" && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order._id, "served")}
                                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400"
                                    variant="outline"
                                  >
                                    Served
                                  </Button>
                                )}
                              </div>

                              {/* Mark as Paid */}
                              {order.paymentStatus !== "paid" && order.status !== "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => markAsPaid(order._id)}
                                  className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400"
                                  variant="outline"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Mark as Paid
                                </Button>
                              )}

                              {/* Complete Order */}
                              {order.paymentStatus === "paid" && order.status !== "completed" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order._id, "completed")}
                                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground"
                                  variant="outline"
                                >
                                  Complete Order
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => handlePrint(order)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground"
                                variant="outline"
                              >
                                <Printer className="h-3.5 w-3.5 mr-1.5" />
                                Print Bill
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* === DAILY SUMMARY & ANALYTICS === */}
                {activeSection === "summary" && (
                  <div className="space-y-8">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="glass border-white/5 p-6 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg border border-primary/20">
                          <BarChart3 className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Orders Today</p>
                          <div className="text-4xl font-black text-glow-subtle mt-1">
                            <AnimatedCounter value={summary.totalOrders || 0} />
                          </div>
                        </div>
                      </Card>
                      <Card className="glass border-white/5 p-6 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-lg border border-emerald-500/20">
                          <IndianRupee className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Revenue Today</p>
                          <div className="text-4xl font-black text-glow-subtle mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-bold opacity-50">₹</span>
                            <AnimatedCounter value={summary.totalRevenue || 0} />
                          </div>
                        </div>
                      </Card>
                    </div>

                    {analyticsLoading ? (
                      <LoadingSkeleton />
                    ) : analytics && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Daily Trends Chart-like Table */}
                        <Card className="glass border-white/5 p-6">
                          <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Daily Order Trends (Last 7 Days)
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-left border-b border-white/5">
                                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Orders</th>
                                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Revenue</th>
                                  <th className="pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground text-right w-1/3">Activity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analytics.dailyTrends.map((trend) => (
                                  <tr key={trend._id} className="border-b border-white/5 last:border-0 group">
                                    <td className="py-4 font-medium">{new Date(trend._id).toLocaleDateString()}</td>
                                    <td className="py-4 font-bold text-primary">{trend.count}</td>
                                    <td className="py-4 font-bold text-emerald-400">₹{trend.revenue}</td>
                                    <td className="py-4 text-right">
                                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${Math.min((trend.count / 50) * 100, 100)}%` }}
                                          className="bg-primary h-full rounded-full"
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Most Ordered */}
                          <Card className="glass border-white/5 p-6">
                            <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2 text-orange-400">
                              <Flame className="h-5 w-5 fill-current" />
                              Most Ordered
                            </h3>
                            <div className="space-y-4">
                              {analytics.mostOrdered.slice((mostOrderedPage - 1) * PAGE_SIZE, mostOrderedPage * PAGE_SIZE).map((item, i) => (
                                <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-black text-white/20 w-4">{((mostOrderedPage - 1) * PAGE_SIZE) + i + 1}</span>
                                    <span className="font-medium">{item.name}</span>
                                  </div>
                                  <Badge className="bg-primary/20 text-primary border-primary/30">
                                    {item.order_count} Orders
                                  </Badge>
                                </div>
                              ))}
                            </div>
                            {analytics.mostOrdered.length > PAGE_SIZE && (
                              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={mostOrderedPage === 1}
                                  onClick={() => setMostOrderedPage(p => p - 1)}
                                  className="text-[10px] uppercase font-bold tracking-widest"
                                >
                                  Prev
                                </Button>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  Page {mostOrderedPage} of {Math.ceil(analytics.mostOrdered.length / PAGE_SIZE)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={mostOrderedPage >= Math.ceil(analytics.mostOrdered.length / PAGE_SIZE)}
                                  onClick={() => setMostOrderedPage(p => p + 1)}
                                  className="text-[10px] uppercase font-bold tracking-widest"
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </Card>

                          {/* Least Ordered */}
                          <Card className="glass border-white/5 p-6">
                            <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2 text-muted-foreground">
                              <Search className="h-5 w-5" />
                              Least Ordered
                            </h3>
                            <div className="space-y-4">
                              {analytics.leastOrdered.slice((leastOrderedPage - 1) * PAGE_SIZE, leastOrderedPage * PAGE_SIZE).map((item, i) => (
                                <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-black text-white/10 w-4">{((leastOrderedPage - 1) * PAGE_SIZE) + i + 1}</span>
                                    <span className="font-medium opacity-70">{item.name}</span>
                                  </div>
                                  <Badge className="bg-white/10 text-white/50 border-white/20">
                                    {item.order_count} Orders
                                  </Badge>
                                </div>
                              ))}
                            </div>
                            {analytics.leastOrdered.length > PAGE_SIZE && (
                              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={leastOrderedPage === 1}
                                  onClick={() => setLeastOrderedPage(p => p - 1)}
                                  className="text-[10px] uppercase font-bold tracking-widest"
                                >
                                  Prev
                                </Button>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  Page {leastOrderedPage} of {Math.ceil(analytics.leastOrdered.length / PAGE_SIZE)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={leastOrderedPage >= Math.ceil(analytics.leastOrdered.length / PAGE_SIZE)}
                                  onClick={() => setLeastOrderedPage(p => p + 1)}
                                  className="text-[10px] uppercase font-bold tracking-widest"
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === ALL TABLES === */}
                {activeSection === "tables" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div>
                        <h3 className="font-display font-bold text-lg">Table Management</h3>
                        <p className="text-xs text-muted-foreground">Add or remove dining tables</p>
                      </div>
                      <Button
                        onClick={handleAddTable}
                        className="bg-primary/20 text-primary-foreground border border-primary/30 neon-glow hover:bg-primary/30"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Table
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {tables.map((table, i) => {
                        const tableNum = table.tableNumber ?? table.number;
                        const isOccupied = table.status === "occupied";
                        const activatedAt = table.activatedAt ?? table.startedAt;

                        return (
                          <motion.div
                            key={table._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Card className={`glass border-white/5 p-5 text-center transition-all relative group ${isOccupied ? "neon-glow" : ""}`}>
                              {!isOccupied && (
                                <button
                                  onClick={() => handleRemoveTable(tableNum || 0)}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <div className="relative w-12 h-12 mx-auto mb-3">
                                <div
                                  className={`w-3 h-3 rounded-full absolute top-0 right-0 ${isOccupied ? "bg-amber-400 pulse-dot" : "bg-green-500"
                                    }`}
                                />
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center border ${isOccupied
                                    ? "bg-amber-500/10 border-amber-500/30"
                                    : "bg-green-500/10 border-green-500/30"
                                    }`}
                                >
                                  <Table2
                                    className={`h-5 w-5 ${isOccupied ? "text-amber-400" : "text-green-400"}`}
                                  />
                                </div>
                              </div>
                              <h3 className="font-display text-lg font-bold">Table {tableNum}</h3>
                              <Badge
                                className={`mt-1 text-xs border ${isOccupied
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : "bg-green-500/20 text-green-400 border-green-500/30"
                                  }`}
                              >
                                {isOccupied ? "Occupied" : "Available"}
                              </Badge>
                              {isOccupied && activatedAt && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.floor((Date.now() - new Date(activatedAt).getTime()) / 60000)} min
                                </p>
                              )}
                              {isOccupied && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleForceRelease(tableNum || 0)}
                                  className="w-full mt-3 h-8 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5 border border-white/5"
                                >
                                  Release Table
                                </Button>
                              )}
                            </Card>
                          </motion.div>
                        );
                      })}
                      {tables.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                          <Table2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p className="font-display text-xl">No tables found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === QR CODES === */}
                {activeSection === "qrcodes" && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-6">
                      Print or display these QR codes at each table. Customers scan to begin ordering.
                    </p>
                    {qrLoading ? (
                      <LoadingSkeleton />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {qrCodes.map((qr, i) => (
                          <motion.div
                            key={qr.tableNumber}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="glass border-white/5 p-4 text-center hover:neon-glow transition-all group">
                              <h3 className="font-display font-bold mb-3 text-sm">Table {qr.tableNumber}</h3>
                              <div className="bg-white rounded-lg p-2 mb-3 mx-auto w-fit">
                                <img
                                  src={qr.qr}
                                  alt={`QR Table ${qr.tableNumber}`}
                                  className="w-24 h-24"
                                />
                              </div>
                              <p className="text-xs font-bold text-primary mb-3">OG Restaurant / Table {qr.tableNumber}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadQr(qr)}
                                className="w-full glass border-white/10 hover:border-primary/30 hover:neon-glow text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}                {/* === ORDER HISTORY === */}
                {activeSection === "history" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-display font-bold text-glow">Order History</h2>
                        <p className="text-muted-foreground text-sm">
                          Track past orders and export historical data to Excel.
                        </p>
                      </div>
                      <div className="flex w-full sm:w-auto items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search by ID or Table..."
                            value={historySearchQuery}
                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                            className="pl-9 glass border-white/10 focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <Button
                          onClick={exportHistoryToCSV}
                          disabled={historyOrders.length === 0}
                          className="shrink-0 bg-primary/20 text-primary-foreground border border-primary/30 neon-glow hover:bg-primary/30"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </div>

                    <div className="glass border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-[10px] font-bold text-muted-foreground">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Table</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4">Special Note</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {historyLoading ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground animate-pulse">
                                Loading historical data...
                              </td>
                            </tr>
                          ) : filteredHistory.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                                No orders found.
                              </td>
                            </tr>
                          ) : (
                            filteredHistory.map((order) => (
                              <tr key={order._id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-primary font-bold">
                                  #{order._id.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-6 py-4 text-xs text-muted-foreground">
                                  {new Date(order.createdAt || "").toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-white/10 px-2 py-1 rounded-md text-xs font-bold">
                                    Table {order.tableNumber || order.table?.number || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {order.items.slice(0, 3).map((item, idx) => (
                                      <span key={idx} className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-muted-foreground">
                                        {item.name} x{item.quantity}
                                      </span>
                                    ))}
                                    {order.items.length > 3 && (
                                      <span className="text-[10px] text-primary/70">+{order.items.length - 3} more</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {order.specialNote ? (
                                    <span className="text-[10px] italic text-primary/70 block max-w-[150px] truncate" title={order.specialNote}>
                                      "{order.specialNote}"
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-sm">
                                  ₹{order.totalAmount}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${order.status === "completed" ? "bg-green-500/20 text-green-400" :
                                    order.status === "processing" ? "bg-primary/20 text-primary" :
                                      "bg-yellow-500/20 text-yellow-400"
                                    }`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}


                {/* === MENU MANAGEMENT === */}
                {activeSection === "menu" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <p className="text-muted-foreground text-sm flex-1">
                        Manage your restaurant's digital menu items and availability.
                      </p>
                      <div className="flex w-full sm:w-auto items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search menu..."
                            value={menuSearchQuery}
                            onChange={(e) => setMenuSearchQuery(e.target.value)}
                            className="pl-9 glass border-white/10 focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                          <DialogTrigger asChild>
                            <Button className="shrink-0 bg-primary/20 text-primary-foreground border border-primary/30 neon-glow hover:bg-primary/30">
                              <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Add New Item</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-strong border-white/10 text-foreground">
                            <DialogHeader>
                              <DialogTitle className="font-display text-xl">Add New Menu Item</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddItem} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">Item Name</Label>
                                <Input
                                  id="name"
                                  placeholder="e.g. Chicken Biryani"
                                  className="glass-input"
                                  value={newItem.name}
                                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="image">Image URL</Label>
                                <Input
                                  id="image"
                                  placeholder="https://images.unsplash.com/..."
                                  className="glass-input"
                                  value={newItem.image}
                                  onChange={e => setNewItem({ ...newItem, image: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="imageFile">Or Upload Image</Label>
                                <Input
                                  id="imageFile"
                                  type="file"
                                  accept="image/*"
                                  className="glass-input pt-2"
                                  onChange={e => setNewItemFile(e.target.files ? e.target.files[0] : null)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="price">Price (₹)</Label>
                                  <Input
                                    id="price"
                                    type="number"
                                    placeholder="0.00"
                                    className="glass-input"
                                    value={newItem.price}
                                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="category">Category</Label>
                                  <Select
                                    value={newItem.category}
                                    onValueChange={v => setNewItem({ ...newItem, category: v })}
                                  >
                                    <SelectTrigger className="glass-input">
                                      <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-strong border-white/10">
                                      {["Soups", "Starters Veg", "Starters Non-Veg", "Rice & Biryani", "Rotis & Bread", "Tea & Beverages", "Curries", "Other"].map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Button type="submit" className="w-full mt-4">Create Item</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMenuItems.map((item, i) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <Card className="glass border-white/5 p-4 flex flex-col gap-4 group hover:border-primary/20 transition-all overflow-hidden relative">
                            {item.image && (
                              <div className="absolute inset-0 z-0 opacity-10 blur-sm group-hover:opacity-20 transition-opacity">
                                <img src={resolveImagePath(item.image)} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex justify-between items-start z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                  {item.image ? (
                                    <img src={resolveImagePath(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <UtensilsCrossed className="h-8 w-8 text-primary/70" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">{item.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{item.category}</span>
                                    <span className="text-xs text-primary font-bold">₹{item.price}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${item.isChefSpecial ? "text-purple-500" : "text-muted-foreground"} hover:text-purple-400`}
                                  onClick={async () => {
                                    try {
                                      await api.put(`/menu/${item._id}`, { ...item, isChefSpecial: !item.isChefSpecial });
                                      fetchData();
                                      toast({ title: "Success", description: "Chef Special status updated" });
                                    } catch {
                                      toast({ title: "Error", variant: "destructive" });
                                    }
                                  }}
                                >
                                  <Star className={`h-4 w-4 ${item.isChefSpecial ? "fill-current" : ""}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteItem(item._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/5">
                              <span className={`text-[10px] uppercase tracking-wider font-bold ${item.available ? "text-green-500" : "text-muted-foreground"}`}>
                                {item.available ? "On Menu" : "Hidden"}
                              </span>
                              <Switch
                                checked={item.available}
                                onCheckedChange={() => toggleItemAvailability(item._id)}
                              />
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                      {filteredMenuItems.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p className="font-display text-xl">No items found matching "{menuSearchQuery}"</p>
                        </div>
                      )}
                    </div>

                    {/* Edit Dialog */}
                    <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                      <DialogContent className="glass-strong border-white/10 text-foreground">
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl">Edit Menu Item</DialogTitle>
                        </DialogHeader>
                        {editingItem && (
                          <form onSubmit={handleUpdateItem} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Item Name</Label>
                              <Input
                                id="edit-name"
                                className="glass-input"
                                value={editingItem.name}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-image">Image URL</Label>
                              <Input
                                id="edit-image"
                                className="glass-input"
                                value={editingItem.image || ""}
                                onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-imageFile">Or Upload Image</Label>
                              <Input
                                id="edit-imageFile"
                                type="file"
                                accept="image/*"
                                className="glass-input pt-2"
                                onChange={e => setEditItemFile(e.target.files ? e.target.files[0] : null)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-price">Price (₹)</Label>
                                <Input
                                  id="edit-price"
                                  type="number"
                                  className="glass-input"
                                  value={editingItem.price}
                                  onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select
                                  value={editingItem.category}
                                  onValueChange={v => setEditingItem({ ...editingItem, category: v })}
                                >
                                  <SelectTrigger className="glass-input">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="glass-strong border-white/10">
                                    {["Soups", "Starters Veg", "Starters Non-Veg", "Rice & Biryani", "Rotis & Bread", "Tea & Beverages", "Curries", "Other"].map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button type="submit" className="w-full mt-4">Save Changes</Button>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                {activeSection === "reviews" && (
                  <div>
                    <h2 className="text-2xl font-black text-white mb-6">Customer Reviews</h2>

                    {/* Stats Header */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="glass-strong rounded-2xl p-5 text-center">
                        <div className="text-3xl font-black text-yellow-400">
                          {feedbackStats.averageRating > 0 ? feedbackStats.averageRating.toFixed(1) : "—"}
                        </div>
                        <div className="flex justify-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(feedbackStats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                          ))}
                        </div>
                        <p className="text-white/50 text-xs mt-1">Average Rating</p>
                      </div>
                      <div className="glass-strong rounded-2xl p-5 text-center">
                        <div className="text-3xl font-black text-white">{feedbackStats.totalReviews}</div>
                        <p className="text-white/50 text-xs mt-2">Total Reviews</p>
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap mb-6">
                      <button
                        onClick={() => { setFeedbackFilter(null); fetchFeedback(null); }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${feedbackFilter === null ? "bg-white text-black" : "glass text-white/70 hover:text-white"
                          }`}
                      >
                        All
                      </button>
                      {[5, 4, 3, 2, 1].map(star => (
                        <button
                          key={star}
                          onClick={() => { setFeedbackFilter(star); fetchFeedback(star); }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${feedbackFilter === star ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/40" : "glass text-white/70 hover:text-white"
                            }`}
                        >
                          {star} <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        </button>
                      ))}
                    </div>

                    {/* Review List */}
                    {feedbacksLoading ? (
                      <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-28 glass rounded-2xl animate-pulse" />)}</div>
                    ) : feedbacks.length === 0 ? (
                      <div className="text-center py-16 text-white/40">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No reviews yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedbacks.map(fb => (
                          <div key={fb._id} className="glass-strong rounded-2xl p-5 border border-white/5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-white text-sm">Table {fb.table_number}</p>
                                <div className="flex gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-4 h-4 ${s <= fb.customer_rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-white/30 text-xs whitespace-nowrap">
                                {new Date(fb.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {fb.customer_feedback_text && (
                              <p className="text-white/70 text-sm mt-3 leading-relaxed">"{fb.customer_feedback_text}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div >
    </PageTransition >
  );
};

export default AdminDashboard;

