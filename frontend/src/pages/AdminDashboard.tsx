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
  { id: "menu", label: "Settings", icon: Settings2 },
  { id: "qrcodes", label: "QR Codes", icon: QrCode },
  { id: "history", label: "Order History", icon: Clock },
  { id: "summary", label: "Daily Summary", icon: BarChart3 },
  { id: "reviews", label: "Customer Reviews", icon: MessageSquare },
];

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

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get("/orders/analytics");
      setAnalytics(res.data?.data || null);
    } catch {
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [toast]);

  const fetchFeedback = useCallback(async (rating?: number | null) => {
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
  }, []);

  useEffect(() => {
    if (activeSection === "history") fetchHistory();
    if (activeSection === "summary") fetchAnalytics();
    if (activeSection === "reviews") fetchFeedback(feedbackFilter);
  }, [activeSection, fetchHistory, fetchAnalytics, fetchFeedback, feedbackFilter]);

  // Handle Socket Connection
  useEffect(() => {
    const socket = socketIO(SOCKET_URL, { autoConnect: false });
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      socket.emit("join-admin");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleNewOrder = (order: Order) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o._id === order._id);
        if (exists) return prev.map((o) => (o._id === order._id ? order : o));
        return [order, ...prev];
      });
      toast({ title: "🍽️ New Order!", description: `Table ${order.tableNumber || order.table?.number}` });
    };

    const handleBillRequested = (data: { tableNumber: number }) => {
      toast({ title: "🧾 Bill Requested", description: `Table ${data.tableNumber}` });
      fetchData();
    };

    const socket = socketRef.current;
    if (!socket) return;

    socket.on("newOrder", handleNewOrder);
    socket.on("billRequested", handleBillRequested);
    socket.on("orderStatusUpdated", fetchData);
    socket.on("orderPaid", fetchData);
    socket.on("tableUpdated", fetchData);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("billRequested", handleBillRequested);
      socket.off("orderStatusUpdated", fetchData);
      socket.off("orderPaid", fetchData);
      socket.off("tableUpdated", fetchData);
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
      fetchData();
      toast({ title: "✅ Payment Confirmed", description: "Order marked as paid & table freed" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleAddTable = async () => {
    try {
      const res = await api.post("/table");
      if (res.data?.success) {
        toast({ title: "Success", description: "New table added successfully" });
        fetchData();
        if (activeSection === "qrcodes") setQrCodes([]);
      }
    } catch {
      toast({ title: "Error", description: "Failed to add table", variant: "destructive" });
    }
  };

  const handleDeleteTable = async (tableNumber: number) => {
    if (!window.confirm(`Are you sure you want to delete Table ${tableNumber}?`)) return;
    try {
      await api.delete(`/table/${tableNumber}`);
      toast({ title: "Success", description: `Table ${tableNumber} removed successfully` });
      fetchData();
      if (activeSection === "qrcodes") setQrCodes([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove table",
        variant: "destructive"
      });
    }
  };

  const loadQrCodes = useCallback(async () => {
    if (qrCodes.length > 0 || tables.length === 0) return;
    setQrLoading(true);
    try {
      const qrs: QrData[] = [];
      for (const table of tables) {
        const tableNum = table.tableNumber ?? table.number;
        if (tableNum === undefined) continue;
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
      if (newItemFile) formData.append("imageFile", newItemFile);

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
    } catch {
      toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
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
      if (editItemFile) formData.append("imageFile", editItemFile);

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
            window.onload = () => { window.print(); setTimeout(() => { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportHistoryToCSV = () => {
    if (historyOrders.length === 0) return;
    const headers = ["Order ID", "Date", "Table", "Items", "Total", "Status"];
    const rows = historyOrders.map(o => [
      o._id.slice(-6).toUpperCase(),
      new Date(o.createdAt || "").toLocaleString(),
      o.tableNumber || o.table?.number || "—",
      o.items.map(i => `${i.name}(${i.quantity})`).join("; "),
      o.totalAmount,
      o.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getTimeSince = (date?: string) => {
    if (!date) return "—";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return diff < 1 ? "just now" : `${diff}m ago`;
  };

  const filteredMenuItems = menuItems.filter(i =>
    i.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(menuSearchQuery.toLowerCase())
  );

  const filteredHistory = historyOrders.filter(o =>
    String(o.tableNumber || o.table?.number).includes(historySearchQuery) ||
    o._id.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-cinematic flex pb-20 md:pb-0">
        <aside className="hidden md:flex w-[260px] min-h-screen glass-strong border-r border-white/5 flex-col sticky top-0 z-40 h-screen overflow-y-auto">
          <div className="p-6 border-b border-white/5 space-y-4">
            <h1 className="font-display text-2xl font-bold text-glow-subtle">OG Restaurant</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeSection === s.id ? "bg-primary/20 text-primary-foreground border border-primary/30 neon-glow" : "text-muted-foreground hover:bg-white/5"
                  }`}
              >
                <s.icon className="h-4 w-4" /> {s.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/5">
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </aside>

        <nav className="md:hidden fixed bottom-1 inset-x-2 z-50 glass-strong border border-white/10 rounded-2xl flex items-center justify-around px-2 py-2 shadow-2xl">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex flex-col items-center p-2 rounded-xl ${activeSection === s.id ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
              <s.icon className="h-5 w-5" />
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-8">
              <h2 className="font-display text-3xl font-bold text-glow-subtle">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
            </header>

            {loading ? <LoadingSkeleton /> : (
              <>
                {activeSection === "orders" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {orders.map(order => (
                        <motion.div key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Card className="glass border-white/5 p-5 hover:neon-glow transition-all">
                            <div className="flex justify-between mb-3">
                              <h3 className="font-bold">Table {order.tableNumber || order.table?.number}</h3>
                              <Badge className={statusColors[order.status]}>{order.status}</Badge>
                            </div>
                            <div className="space-y-1 mb-4">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm opacity-80">
                                  <span>{item.name} x{item.quantity}</span>
                                  <span>₹{(item.price || 0) * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <Separator className="mb-3 opacity-10" />
                            <div className="flex justify-between font-bold mb-4"><span>Total</span><span>₹{order.totalAmount}</span></div>
                            <div className="grid grid-cols-1 gap-2">
                              {order.status === "pending" && <Button onClick={() => updateOrderStatus(order._id, "preparing")} size="sm" className="bg-blue-500/20 text-blue-400">Mark Preparing</Button>}
                              {order.status === "preparing" && <Button onClick={() => updateOrderStatus(order._id, "served")} size="sm" className="bg-green-500/20 text-green-400">Mark Served</Button>}
                              {order.paymentStatus !== "paid" && order.status !== "pending" && <Button onClick={() => markAsPaid(order._id)} size="sm" className="bg-emerald-500/20 text-emerald-400">Mark Paid</Button>}
                              {order.paymentStatus === "paid" && order.status !== "completed" && <Button onClick={() => updateOrderStatus(order._id, "completed")} size="sm">Complete</Button>}
                              <Button onClick={() => handlePrint(order)} size="sm" variant="outline"><Printer className="h-3 w-3 mr-2" />Print Bill</Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {activeSection === "tables" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {tables.map(table => (
                      <Card key={table._id} className="glass border-white/5 p-5 text-center relative">
                        <Table2 className={`h-8 w-8 mx-auto mb-2 ${table.status === "occupied" ? "text-amber-400" : "text-green-400"}`} />
                        <h4 className="font-bold">Table {table.tableNumber ?? table.number}</h4>
                        <Badge className={`mt-2 ${table.status === "occupied" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
                          {table.status}
                        </Badge>
                        <div className="mt-4 flex flex-col gap-2">
                          {table.status === "occupied" && (
                            <Button onClick={() => handleForceRelease(table.tableNumber ?? 0)} size="sm" variant="ghost" className="text-[10px]">Release</Button>
                          )}
                          {table.status === "available" && (
                            <Button onClick={() => handleDeleteTable(table.tableNumber ?? 0)} size="sm" variant="ghost" className="text-[10px] text-destructive hover:bg-destructive/10">Delete</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    <Card onClick={handleAddTable} className="glass border-dashed border-white/20 p-5 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center min-h-[150px]">
                      <Plus className="h-6 w-6 text-primary mb-2" />
                      <span className="font-bold text-sm">Add Table</span>
                    </Card>
                  </div>
                )}

                {activeSection === "qrcodes" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {qrCodes.map(qr => (
                      <Card key={qr.tableNumber} className="glass border-white/5 p-4 text-center">
                        <h4 className="font-bold mb-3">Table {qr.tableNumber}</h4>
                        <div className="bg-white p-2 rounded-lg mb-4 inline-block"><img src={qr.qr} className="w-24 h-24" alt="QR" /></div>
                        <Button onClick={() => downloadQr(qr)} size="sm" className="w-full">Download</Button>
                      </Card>
                    ))}
                  </div>
                )}

                {activeSection === "history" && (
                  <Card className="glass border-white/5 overflow-hidden">
                    <div className="p-6 flex justify-between items-center bg-white/5">
                      <Input placeholder="Search orders..." className="max-w-xs glass" onChange={e => setHistorySearchQuery(e.target.value)} />
                      <Button onClick={exportHistoryToCSV} size="sm"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
                    </div>
                    <table className="w-full">
                      <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground text-left">
                        <tr><th className="p-4">ID</th><th className="p-4">Table</th><th className="p-4">Total</th><th className="p-4">Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredHistory.map(order => (
                          <tr key={order._id} className="text-sm">
                            <td className="p-4 font-mono font-bold text-primary">#{order._id.slice(-6).toUpperCase()}</td>
                            <td className="p-4">Table {order.tableNumber ?? order.table?.number}</td>
                            <td className="p-4 font-bold">₹{order.totalAmount}</td>
                            <td className="p-4"><Badge className={statusColors[order.status]}>{order.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}

                {activeSection === "summary" && analytics && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="glass border-white/5 p-6 flex items-center gap-6">
                        <BarChart3 className="h-10 w-10 text-primary" />
                        <div><p className="text-xs uppercase opacity-50">Total Orders</p><div className="text-3xl font-black">{summary.totalOrders}</div></div>
                      </Card>
                      <Card className="glass border-white/5 p-6 flex items-center gap-6">
                        <IndianRupee className="h-10 w-10 text-emerald-400" />
                        <div><p className="text-xs uppercase opacity-50">Revenue</p><div className="text-3xl font-black">₹{summary.totalRevenue}</div></div>
                      </Card>
                    </div>
                  </div>
                )}

                {activeSection === "reviews" && (
                  <div className="space-y-4">
                    {feedbacks.map(fb => (
                      <Card key={fb._id} className="glass border-white/5 p-5">
                        <div className="flex justify-between mb-2"><h4 className="font-bold">Table {fb.table_number}</h4><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < fb.customer_rating ? "fill-yellow-400 text-yellow-400" : "opacity-20"}`} />)}</div></div>
                        <p className="text-sm opacity-80 italic">"{fb.customer_feedback_text}"</p>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
