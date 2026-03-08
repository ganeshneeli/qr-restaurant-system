import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Receipt, ShoppingCart,
  ChefHat, ClipboardList, X, Info, Search,
  Bell, Flame, Star, Sparkles, Utensils, Coffee, Ghost, Check
} from "lucide-react";
import axios from "axios";
import { io as socketIO } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import RestaurantInfo from "@/components/RestaurantInfo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://qr-restaurant-system-1.onrender.com/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://qr-restaurant-system-1.onrender.com";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  order_count?: number;
  isChefSpecial?: boolean;
  createdAt?: string;

  // Flash Sale Fields
  isFlashSale?: boolean;
  discountPrice?: number;
  saleStartTime?: string;
  saleEndTime?: string;
}

const CountdownTimer = ({ endTime, onEnd }: { endTime: string; onEnd?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const target = new Date(endTime).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("EXPIRED");
        if (onEnd) onEnd();
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  if (timeLeft === "EXPIRED") return <span className="text-destructive font-black">EXPIRED</span>;

  return (
    <span className="font-mono font-black text-primary animate-pulse flex items-center gap-1">
      <Flame className="w-3 h-3 fill-current" />
      {timeLeft}
    </span>
  );
};

interface CartItem { foodId: string; name: string; price: number; quantity: number; }
interface OrderItem { name?: string; foodId?: string; quantity: number; price?: number; }
interface Order { _id: string; items: OrderItem[]; totalAmount: number; status: string; paymentStatus?: string; billRequested?: boolean; }

const CATEGORIES = ["All", "Soups", "Starters Veg", "Starters Non-Veg", "Rice & Biryani", "Rotis & Bread", "Curries", "Tea & Beverages", "Other"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  preparing: "bg-blue-500/20   text-blue-400   border-blue-500/30",
  served: "bg-green-500/20  text-green-400  border-green-500/30",
  completed: "bg-white/10      text-white/50   border-white/10",
};


// ─── JWT helper ──────────────────────────────────────────────────────────────
function jwtPayload(token: string): Record<string, unknown> | null {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
  catch { return null; }
}

// ─── Component ────────────────────────────────────────────────────────────────
const MenuContent = () => {
  // 1. Table id ALWAYS from URL — never from global state
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { getSessionToken, setSessionToken } = useAuth();
  const { toast } = useToast();

  // 2. Per-table token
  const sessionToken = useMemo(
    () => (tableId ? getSessionToken(tableId) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableId]  // NOT getSessionToken — it's stable, but sessionStorage may change
  );

  // 3. Decode token
  const decoded = useMemo(() => sessionToken ? jwtPayload(sessionToken) : null, [sessionToken]);
  const tableNumber = decoded?.tableNumber as number | undefined;
  const sessionId = decoded?.sessionId as string | undefined;

  // 4. Per-table cart key
  const cartKey = `cart-${tableId}`;

  // ── State ─────────────────────────────────────────────────────────────────
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { const s = localStorage.getItem(cartKey); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [myOrder, setMyOrder] = useState<Order | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopPopup, setShowTopPopup] = useState(false);
  const [popupStatus, setPopupStatus] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

  // Pagination States
  // Pagination & Flash Sale States
  const [menuPage, setMenuPage] = useState(1);
  const [menuPagination, setMenuPagination] = useState({ totalPages: 1, totalCount: 0 });
  const [flashSales, setFlashSales] = useState<MenuItem[]>([]);
  const [upcomingSales, setUpcomingSales] = useState<MenuItem[]>([]);

  // Feedback States

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const [specialNote, setSpecialNote] = useState("");


  const socketRef = useRef<Socket | null>(null);

  const resolveImagePath = (imagePath?: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${SOCKET_URL}${imagePath}`;
  };

  // ── Redirect if no session ────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionToken && tableId) {
      navigate(`/table/${tableId}`, { replace: true });
    }
  }, [sessionToken, tableId, navigate]);

  // ── Persist cart ──────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  // ── Scoped axios ──────────────────────────────────────────────────────────
  const api = useMemo(() => axios.create({
    baseURL: API_BASE,
    headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
  }), [sessionToken]);

  // ── Fetch order ───────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await api.get("/orders/my");
      setMyOrder(res.data?.data ?? null);
    } catch { /* silent */ }
  }, [api, sessionToken]);

  const isItemOnSale = useCallback((item: MenuItem) => {
    if (!item.isFlashSale || !item.saleStartTime || !item.saleEndTime || !item.discountPrice) return false;
    const now = new Date().getTime();
    const start = new Date(item.saleStartTime).getTime();
    const end = new Date(item.saleEndTime).getTime();
    return now >= start && now <= end;
  }, []);

  // ── Fetch menu ────────────────────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/menu`, {
        params: {
          category: activeCategory,
          search: searchQuery || undefined,
          page: menuPage,
          limit: 12
        }
      });
      const sanitizedMenu = (res.data?.data || []).map((item: MenuItem) => {
        if (item.isFlashSale && !isItemOnSale(item)) {
          return { ...item, isFlashSale: false, discountPrice: undefined };
        }
        return item;
      });
      setMenu(sanitizedMenu);

      // Update flash sales if on first page
      if (menuPage === 1 && res.data?.flashSales) {
        const active = res.data.flashSales.filter((item: MenuItem) => isItemOnSale(item));

        const now = new Date().getTime();
        const upcoming = res.data.flashSales.filter((item: MenuItem) => {
          if (!item.isFlashSale || !item.saleStartTime || !item.saleEndTime || !item.discountPrice) return false;
          const start = new Date(item.saleStartTime).getTime();
          return start > now; // Future sales
        });

        setFlashSales(active);
        setUpcomingSales(upcoming);
      }

      setMenuPagination({
        totalPages: res.data?.pagination?.totalPages || 1,
        totalCount: res.data?.pagination?.totalCount || 0
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeCategory, menuPage, searchQuery]);

  const handleSaleEnd = useCallback((itemId: string) => {
    // 1. Remove from flashSales carousel instantly
    setFlashSales(prev => prev.filter(item => item._id !== itemId));

    // 2. Revert price locally in the main menu grid
    setMenu(prev => prev.map(item =>
      item._id === itemId
        ? { ...item, isFlashSale: false, discountPrice: undefined }
        : item
    ));

    // 3. Silent refresh from server to ensure synchronization
    fetchMenu();
  }, [fetchMenu]);

  // ── Auto-activate future sales ────────────────────────────────────────────
  useEffect(() => {
    if (upcomingSales.length === 0) return;

    const now = new Date().getTime();

    // Find the next closest sale start time
    let closestStart = Infinity;
    upcomingSales.forEach(sale => {
      const start = new Date(sale.saleStartTime!).getTime();
      if (start > now && start < closestStart) {
        closestStart = start;
      }
    });

    if (closestStart !== Infinity) {
      const timeUntilStart = closestStart - now;
      // Add a tiny 50ms buffer to ensure time check passes
      const timerId = setTimeout(() => {
        fetchMenu();
      }, timeUntilStart + 50);

      return () => clearTimeout(timerId);
    }
  }, [upcomingSales, fetchMenu]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);


  // ── Fetch order on mount + poll ────────────────────────────────────────────
  useEffect(() => {
    if (!sessionToken) return;
    fetchOrder();
    const t = setInterval(fetchOrder, 30_000);
    return () => clearInterval(t);
  }, [fetchOrder, sessionToken]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  // Key insight: we pass `tableId` and `sessionId` into the effect deps.
  // The socket is created with transports that work on localhost + production.
  // We do NOT use autoConnect:false to avoid the Strict-Mode timing race.
  useEffect(() => {
    if (!tableId || !sessionToken || !tableNumber) return;

    // Create socket with immediate connection — avoids Strict Mode race where
    // autoConnect:false + socket.connect() can miss the "connect" event.
    // CRITICAL: forceNew: true ensures that when navigating between tables in the same 
    // browser tab, the internal multiplexed Manager singleton is completely bypassed,
    // avoiding room closure overlaps and auto-reconnect cross-contamination.
    const socket = socketIO(SOCKET_URL, {
      transports: ["websocket", "polling"],
      forceNew: true
    });
    socketRef.current = socket;

    const onConnect = () => {
      console.log(`[Table-${tableId}] Socket connected → joining room`);
      socket.emit("join-table", tableId);
    };

    const onStatusUpdate = (data: { status: string; sessionId?: string; tableNumber?: number }) => {
      if (data.tableNumber && String(data.tableNumber) !== tableId) return;
      if (data.sessionId && data.sessionId !== sessionId) return;
      fetchOrder();

      if (data.status === "preparing" || data.status === "served") {
        setPopupStatus(data.status);
        setShowTopPopup(true);
        // Extend duration for cinematic effect
        setTimeout(() => setShowTopPopup(false), 7000);
      } else {
        const msg: Record<string, string> = {
          completed: "Session ended. Thank you!",
        };
        if (msg[data.status]) {
          toast({ title: "Update", description: msg[data.status] });
        }
      }

      if (data.status === "completed") { localStorage.removeItem(cartKey); setCart([]); }
    };

    const onPaid = (data: { sessionId?: string; tableNumber?: number; orderId?: string }) => {
      if (data.tableNumber && String(data.tableNumber) !== tableId) return; // hard table guard
      if (data.sessionId && data.sessionId !== sessionId) return;

      toast({ title: "✅ Paid", description: "Payment confirmed! Please leave feedback." });
      localStorage.removeItem(cartKey);
      setCart([]);

      // Save order ID for feedback and show feedback modal
      if (data.orderId) setPaidOrderId(data.orderId);
      // Fallback: if backend doesn't send orderId in paid event, try to get from current order
      else if (myOrder) setPaidOrderId(myOrder._id);

      setShowFeedback(true);
    };

    const onMenuUpdate = () => {
      fetchMenu();
    };

    socket.on("connect", onConnect);
    socket.on("orderStatusUpdated", onStatusUpdate);
    socket.on("orderPaid", onPaid);
    socket.on("menuUpdate", onMenuUpdate);

    // If already connected (Strict Mode second mount), emit immediately
    if (socket.connected) {
      socket.emit("join-table", tableId);
    }

    return () => {
      socket.emit("leave-table", tableId);
      socket.off("connect", onConnect);
      socket.off("orderStatusUpdated", onStatusUpdate);
      socket.off("orderPaid", onPaid);
      socket.off("menuUpdate", onMenuUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tableId, tableNumber, sessionId, sessionToken, cartKey]); // stable deps

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (item: MenuItem) => setCart(prev => {
    const e = prev.find(c => c.foodId === item._id);
    if (e) return prev.map(c => c.foodId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
    return [...prev, { foodId: item._id, name: item.name, price: item.price, quantity: 1 }];
  });

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(c => c.foodId === id ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0));

  const clearCart = () => { setCart([]); localStorage.removeItem(cartKey); };

  // ── Place order ───────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!cart.length || !sessionToken) return;
    setOrdering(true);
    try {
      await api.post("/orders", {
        items: cart.map(c => ({ foodId: c.foodId, quantity: c.quantity })),
        specialNote: specialNote
      });
      toast({ title: "Order Placed! 🎉", description: "Sent to kitchen." });
      clearCart();
      setSpecialNote("");
      setShowCart(false);
      setTimeout(fetchOrder, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: "Order Failed", description: msg || "Please try again.", variant: "destructive" });
    } finally {
      setOrdering(false);
    }
  };

  // ── Request bill ──────────────────────────────────────────────────────────
  const requestBill = async () => {
    try {
      await api.put("/orders/request-bill");
      toast({ title: "Bill Requested ✅", description: "Staff will arrive shortly." });
      fetchOrder();
    } catch {
      toast({ title: "Error", description: "Could not request bill.", variant: "destructive" });
    }
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const filteredMenu = menu.filter(i => {
    const matchesCategory = activeCategory === "All" || i.category === activeCategory;
    return matchesCategory;
  });
  const getQty = (id: string) => cart.find(c => c.foodId === id)?.quantity ?? 0;

  const CHEF_SPECIALS = useMemo(() => {
    return menu.filter(item => item.isChefSpecial && item.available);
  }, [menu]);

  const TRENDING_ITEMS = useMemo(() => {
    return [...menu]
      .filter(item => item.available && (item.order_count ?? 0) > 0)
      .sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0))
      .slice(0, 3);
  }, [menu]);

  const getBadges = (item: MenuItem) => {
    const badges = [];
    if (item.order_count && item.order_count > 50) badges.push({ text: "Most Ordered", icon: "🔥", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" });
    else if (item.order_count && item.order_count > 30) badges.push({ text: "Highly Reordered", icon: "⭐", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" });
    else if (item.order_count && item.order_count > 15) badges.push({ text: "Popular Choice", icon: "👍", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" });

    if (item.createdAt) {
      const createdDate = new Date(item.createdAt);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) badges.push({ text: "New Item", icon: "🆕", color: "text-green-500 bg-green-500/10 border-green-500/20" });
    }

    if (item.isChefSpecial) badges.push({ text: "Chef Special", icon: "👨‍🍳", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" });

    return badges;
  };

  const submitFeedback = async () => {
    if (!feedbackRating || !paidOrderId) return;

    try {
      await axios.post(`${API_BASE}/feedback`, {
        order_id: paidOrderId,
        table_number: tableId,
        customer_rating: feedbackRating,
        customer_feedback_text: feedbackText
      });

      setFeedbackSubmitted(true);

      setTimeout(() => {
        setSessionToken(null, tableId);
        navigate("/", { replace: true });
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ title: "Error", description: "Failed to submit feedback", variant: "destructive" });
    }
  };

  if (!sessionToken) return null;

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden pb-32 selection:bg-white selection:text-black">
        {/* Background Video */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            className="w-full h-full object-cover scale-105"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/assets/dashboard-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
        </div>

        {/* Global Cinematic Status Glow */}
        <AnimatePresence>
          {popupStatus === "served" && showTopPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] pointer-events-none"
            >
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
              <div className="absolute inset-0 ring-[50px] ring-white/10 ring-inset animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Particles/Glow - matching landing page */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-[120px] pointer-events-none z-0 animate-pulse-slow" />

        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-glow-white text-white">OG</h1>
              {tableId && (
                <Badge className="bg-primary/20 text-primary border-primary/30 border text-xs font-semibold">
                  Table {tableId}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 glass border-white/5">
                    <Info className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="glass-strong border-l border-white/10 w-[90%] sm:max-w-md p-0 overflow-y-auto">
                  <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="font-display text-2xl font-bold">Store Info</SheetTitle>
                  </SheetHeader>
                  <div className="p-6"><RestaurantInfo className="!mx-0 !max-w-full" /></div>
                </SheetContent>
              </Sheet>

              {myOrder && (
                <Button variant="outline" size="sm" className="glass border-white/10 hover:border-white/20 transition-all"
                  onClick={() => { setShowMyOrders(v => !v); setShowCart(false); }}>
                  <ClipboardList className="h-4 w-4 mr-1.5 text-white/70" />
                  <span className="text-white/90">My Order</span>
                  <span className="ml-1.5 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{myOrder.items.length}</span>
                </Button>
              )}

              <Button variant="outline" size="sm" className="glass border-white/20 relative hover:border-white/40 transition-all font-bold"
                onClick={() => { setShowCart(v => !v); setShowMyOrders(false); }}>
                <ShoppingCart className="h-4 w-4 mr-1.5 text-white" />
                <span className="text-white">Cart</span>
                {cart.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-lg">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </motion.span>
                )}
              </Button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="max-w-6xl mx-auto px-4 pb-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setMenuPage(1); }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${activeCategory === cat
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Relative content wrapper to ensure it's above the fixed background */}
        <div className="relative z-10">

          {/* Menu Content */}
          <main className="max-w-6xl mx-auto px-4 py-8">

            {/* 0. Flash Sales Section */}
            {activeCategory === "All" && flashSales.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12 relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-6 md:p-8"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Flame className="w-64 h-64 text-primary fill-current -rotate-12" />
                </div>

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-xs animate-bounce">
                          🔥 FLASH DEAL
                        </Badge>
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Limited Time Offer</span>
                      </div>
                      <h2 className="font-display text-4xl md:text-5xl font-black text-white text-glow-white tracking-tighter">
                        Today's Special
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashSales.map((item, idx) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSelectedDish(item)}
                        className="group cursor-pointer glass border-white/10 p-4 rounded-2xl hover:border-primary/50 hover:shadow-[0_0_40px_rgba(var(--primary),0.2)] transition-all duration-500 relative"
                      >
                        <div className="flex gap-4">
                          <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                            <img src={resolveImagePath(item.image)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-white truncate group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-2xl font-black text-primary">₹{item.discountPrice}</span>
                              <span className="text-sm text-white/30 line-through">₹{item.price}</span>
                            </div>
                            {/* Category Banner */}
                            <div className="absolute top-4 left-4 z-10">
                              {isItemOnSale(item) ? (
                                <Badge className="bg-primary text-primary-foreground font-black px-2 py-0 h-5 border-none animate-pulse">
                                  FLASH DEAL
                                </Badge>
                              ) : (
                                <Badge className="glass-strong border-white/10 text-white/70 backdrop-blur-md">
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              {item.saleEndTime && (
                                <div className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5 scale-90 origin-left">
                                  <CountdownTimer
                                    endTime={item.saleEndTime}
                                    onEnd={() => handleSaleEnd(item._id)}
                                  />
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const salePrice = isItemOnSale(item) ? item.discountPrice : item.price;
                                  addToCart({ ...item, price: salePrice || item.price });
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {/* Animated background glow */}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10 blur-xl" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 1. Trending Items Section */}
            {activeCategory === "All" && TRENDING_ITEMS.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                  <h2 className="font-display text-2xl font-black tracking-tight uppercase">Trending Items</h2>
                </div>

                <div className="space-y-4">
                  {TRENDING_ITEMS.map((item, idx) => {
                    const isSale = isItemOnSale(item);

                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSelectedDish(item)}
                        className={`glass border-white/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/20 transition-all group ${isSale ? 'border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)]' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-display text-2xl font-black text-white/20 group-hover:text-white/40 transition-colors w-6">
                            {idx + 1}
                          </span>
                          {item.image && (
                            <img
                              src={resolveImagePath(item.image)}
                              alt={item.name}
                              loading="lazy"
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white group-hover:text-glow-white transition-all">
                                {item.name}
                              </h3>
                              {isSale && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] px-1 py-0 h-4">SALE</Badge>
                              )}
                            </div>
                            {getBadges(item).length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {getBadges(item).map((badge, bIdx) => (
                                  <div key={bIdx} className="flex items-center gap-1">
                                    <span className="text-xs">{badge.icon}</span>
                                    <span className={`text-[10px] uppercase font-black ${badge.color.split(' ')[0]}`}>
                                      {badge.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`${isSale ? 'text-primary' : 'text-white/50'} font-bold`}>₹{isSale ? item.discountPrice : item.price}</span>
                          {isSale && <span className="text-[10px] text-white/20 line-through">₹{item.price}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}


            {/* 2. Hero Sections (Chef Specials) */}
            {activeCategory === "All" && CHEF_SPECIALS.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Star className="h-5 w-5 text-glow-white text-white fill-white" />
                  <h2 className="font-display text-2xl font-black tracking-tight uppercase">Chef's Selection</h2>
                </div>

                <Carousel opts={{ align: "start", loop: true }} className="w-full relative px-12">
                  <CarouselContent className="-ml-4">
                    {CHEF_SPECIALS.map((item, i) => (
                      <CarouselItem key={item._id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedDish(item)}
                          className="cursor-pointer"
                        >
                          <Card className="glass-strong border-white/5 overflow-hidden border-0 bg-transparent group aspect-[16/10]">
                            <CardContent className="p-0 relative h-full">
                              <img
                                src={resolveImagePath(item.image)}
                                alt={item.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4">
                                <Badge className="bg-white text-black mb-2 rounded-full px-3 py-0 font-black text-[10px]">SIGNATURE</Badge>
                                <h3 className="font-display text-xl font-bold text-white text-glow-white leading-none">{item.name}</h3>
                                {getBadges(item).length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2 mt-1 opacity-80">
                                    {getBadges(item).map((badge, bIdx) => (
                                      <div key={bIdx} className="flex items-center gap-1">
                                        <span className="text-[10px]">{badge.icon}</span>
                                        <span className="text-[8px] uppercase font-black text-white/70">
                                          {badge.text}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-baseline gap-2 mt-1">
                                  <p className="text-white text-lg font-black text-glow-white">₹{isItemOnSale(item) ? item.discountPrice : item.price}</p>
                                  {isItemOnSale(item) && (
                                    <p className="text-white/40 text-xs line-through">₹{item.price}</p>
                                  )}
                                </div>
                              </div>

                              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
                                <Sparkles className="h-4 w-4 text-white" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0 bg-white/5 border-white/10 hover:bg-white hover:text-black hidden sm:flex" />
                  <CarouselNext className="right-0 bg-white/5 border-white/10 hover:bg-white hover:text-black hidden sm:flex" />
                </Carousel>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-glow-white text-white">
                {activeCategory === "All" ? "The Full Catalog" : activeCategory}
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setMenuPage(1); }}
                  className="pl-9 glass border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {loading ? <LoadingSkeleton /> : (
              <AnimatePresence mode="wait">
                <motion.div key={activeCategory}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenu.map((item, i) => {
                    const qty = getQty(item._id);
                    const isSale = isItemOnSale(item);
                    const displayPrice = isSale ? item.discountPrice : item.price;

                    return (
                      <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card className={`glass border-white/5 p-5 transition-all duration-300 group ${item.available ? "hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]" : "opacity-60"} ${isSale ? 'border-primary/20 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.05)]' : ''}`}>
                          <div className="flex flex-col gap-4 mb-4 cursor-pointer" onClick={() => setSelectedDish(item)}>
                            {item.image && (
                              <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4 group-hover:border-white/20 transition-colors relative">
                                <img src={resolveImagePath(item.image)} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                {isSale && (
                                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg">
                                    🔥 FLASH DEAL
                                  </div>
                                )}
                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Info className="h-3 w-3 text-white" />
                                  <span className="text-[10px] text-white font-bold">Details</span>
                                </div>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 mr-2">
                                  <h3 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-glow-white transition-all">{item.name}</h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {item.category && <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{item.category}</p>}
                                    {getBadges(item).map((badge, bIdx) => (
                                      <div key={bIdx} className={`px-2 py-0.5 rounded-full border ${badge.color} flex items-center gap-1 scale-90 origin-left`}>
                                        <span className="text-[10px]">{badge.icon}</span>
                                        <span className="text-[8px] uppercase font-black whitespace-nowrap">{badge.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <span className={`font-display font-black text-2xl ${isSale ? 'text-primary' : 'text-white'} shadow-sm`}>₹{displayPrice}</span>
                                  {isSale && <span className="text-xs text-white/20 line-through">₹{item.price}</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          {qty > 0 ? (
                            <div className="flex items-center justify-between glass rounded-lg p-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateQty(item._id, -1)}><Minus className="h-4 w-4" /></Button>
                              <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-bold">{qty}</motion.span>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateQty(item._id, 1)}><Plus className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <Button onClick={() => item.available && addToCart({ ...item, price: displayPrice ?? item.price })} disabled={!item.available}
                              variant="outline" className={`w-full ${isSale ? 'bg-primary/20 border-primary/40 hover:bg-primary/30 text-primary' : 'bg-primary/10 border-primary/30 hover:bg-primary/20'}`}>
                              <Plus className="h-4 w-4 mr-1" />{item.available ? "Add" : "Unavailable"}
                            </Button>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}


                  {filteredMenu.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                      <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-display text-xl">No items in this category</p>
                    </div>
                  )}
                </motion.div>

                {/* Pagination Controls */}
                {menuPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-12 glass p-4 rounded-2xl border border-white/5">
                    <Button
                      variant="ghost"
                      disabled={menuPage === 1}
                      onClick={() => { setMenuPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="text-white/50 hover:text-white glass-strong"
                    >
                      <Minus className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <span className="text-xs text-white/40 font-black uppercase tracking-[0.2em]">
                      Page {menuPage} of {menuPagination.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      disabled={menuPage === menuPagination.totalPages}
                      onClick={() => { setMenuPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="text-white/50 hover:text-white glass-strong"
                    >
                      Next <Plus className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            )}
          </main>

          {/* My Orders Panel */}
          <AnimatePresence>
            {showMyOrders && myOrder && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
                className="fixed inset-x-0 bottom-0 z-50 glass-strong border-t border-white/10 rounded-t-2xl max-h-[70vh] overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="font-display text-xl font-bold">My Order</h3>
                      <Badge className={`${STATUS_COLORS[myOrder.status] || STATUS_COLORS.pending} border text-xs mt-1`}>
                        {myOrder.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowMyOrders(false)}><X className="h-4 w-4" /></Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {myOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-white/5">
                        <div>
                          <p className="font-medium">{item.name || item.foodId}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                        </div>
                        <span className="font-semibold">₹{(item.price || 0) * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between font-semibold text-lg mb-5">
                    <span>Total</span><span className="text-glow-subtle">₹{myOrder.totalAmount}</span>
                  </div>

                  {myOrder.paymentStatus === "paid" ? (
                    <div className="text-center py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">✅ Payment Confirmed</div>
                  ) : myOrder.billRequested ? (
                    <div className="text-center py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">🧾 Bill Requested — Staff will arrive shortly</div>
                  ) : (
                    <Button onClick={requestBill} variant="outline" className="w-full h-12 glass border-primary/30 hover:neon-glow">
                      <Receipt className="h-4 w-4 mr-2" />Request Bill
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cart Panel */}
          <AnimatePresence>
            {showCart && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
                className="fixed inset-x-0 bottom-0 z-50 glass-strong border-t border-primary/20 rounded-t-2xl max-h-[65vh] overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-xl font-bold">Your Cart</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}><X className="h-4 w-4" /></Button>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <div key={item.foodId} className="flex justify-between items-center py-3 border-b border-white/5">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">₹{item.price} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="font-bold">₹{item.price * item.quantity}</span>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateQty(item.foodId, -1)}><Minus className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateQty(item.foodId, 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}

                      <Separator className="my-4 bg-white/10" />

                      <div className="flex justify-between items-center mb-6">
                        <span className="font-display text-lg">Total</span>
                        <span className="font-display text-2xl font-bold text-glow-subtle">₹{total}</span>
                      </div>

                      <div className="space-y-2 mb-6">
                        <Label htmlFor="specialNote" className="text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <ChefHat className="h-3.5 w-3.5" /> Add Note for Chef
                        </Label>
                        <Input
                          id="specialNote"
                          placeholder="Less spicy, no onions, extra cheese..."
                          className="glass border-white/10 focus:border-white/20 h-12"
                          value={specialNote}
                          onChange={(e) => setSpecialNote(e.target.value)}
                        />
                      </div>

                      <Button onClick={placeOrder} disabled={ordering}
                        className="w-full h-12 bg-primary hover:bg-primary/80 font-semibold hover:neon-glow">
                        {ordering ? "Placing..." : "Place Order"}
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating cart bar */}
          <AnimatePresence>
            {cart.length > 0 && !showCart && !showMyOrders && (
              <motion.div
                key="cart-bar"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto"
              >
                <motion.div
                  key={cart.length} // Force re-animate on item count change
                  animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <Button onClick={() => setShowCart(true)}
                    className="w-full h-14 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {cart.reduce((s, c) => s + c.quantity, 0)} ITEMS · ₹{total}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cinematic Top Status Notification */}
          <AnimatePresence>
            {showTopPopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 40, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="w-full max-w-lg relative"
                >
                  {/* Atmospheric Glow */}
                  <div className={`absolute inset-0 blur-[120px] opacity-40 rounded-full animate-pulse-slow ${popupStatus === "served" ? "bg-yellow-500" : "bg-blue-500"
                    }`} />

                  <div className="glass-strong border-white/10 rounded-[3rem] p-10 text-center relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors pointer-events-none" />

                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-7xl mb-8 flex justify-center filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                      {popupStatus === "served" ? "🎩" : "🔥"}
                    </motion.div>

                    <h3 className="font-display text-4xl font-black text-white text-glow-white mb-4 tracking-tight">
                      {popupStatus === "served" ? "Bon Appétit!" : "Chef's in Motion"}
                    </h3>

                    <p className="text-white/60 text-lg font-medium leading-relaxed max-w-xs mx-auto mb-8">
                      {popupStatus === "served"
                        ? "Your masterpieces have arrived. Indulge in perfection."
                        : "Your selection is being crafted with precision and passion."}
                    </p>

                    <div className="flex justify-center gap-2">
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0.5, 0.2]
                          }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className={`w-2 h-2 rounded-full ${popupStatus === "served" ? "bg-yellow-500" : "bg-blue-500"}`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ────── MODALS ────── */}

          {/* 1. Dish Detail Story View */}
          <AnimatePresence>
            {selectedDish && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-2xl overflow-y-auto"
              >
                <div className="relative w-full aspect-[4/5] sm:aspect-video max-h-[70vh]">
                  <img
                    src={resolveImagePath(selectedDish.image)}
                    alt={selectedDish.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDish(null)}
                    className="fixed top-6 right-4 sm:top-6 sm:right-6 z-[120] w-12 h-12 rounded-full glass-strong bg-black/40 border-white/20 flex items-center justify-center shadow-2xl"
                  >
                    <X className="h-6 w-6 text-white" />
                  </motion.button>
                </div>

                <div className="px-6 py-8 space-y-8 max-w-3xl mx-auto w-full flex-grow">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/10 text-white border-white/20">{selectedDish.category}</Badge>
                      <div className="flex text-yellow-500"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>
                    </div>
                    <h2 className="font-display text-5xl font-black text-white text-glow-white">{selectedDish.name}</h2>
                    <p className="text-3xl font-display font-black text-white/50">₹{selectedDish.price}</p>
                  </div>

                  <p className="text-white/60 text-lg leading-relaxed">
                    Crafted with premium ingredients and our secret blend of spices. Each bite is a journey into the heart of authentic flavors. Properly seasoned and cooked to perfection by our master chefs.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass border-white/10 p-4 rounded-2xl flex items-center gap-4">
                      <Flame className="h-6 w-6 text-orange-500" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-white/30">Spice Level</p>
                        <p className="text-sm font-bold">Medium Authentic</p>
                      </div>
                    </div>
                    <div className="glass border-white/10 p-4 rounded-2xl flex items-center gap-4">
                      <Utensils className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-white/30">Preparation</p>
                        <p className="text-sm font-bold">Hand-crafted</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 p-6 glass border-t border-white/10 mt-auto flex flex-col gap-3">
                  <Button
                    onClick={() => { addToCart(selectedDish); setSelectedDish(null); }}
                    disabled={!selectedDish.available}
                    className="w-full h-16 text-lg font-black bg-white text-black hover:bg-white/90 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    Add to Collection · ₹{selectedDish.price}
                  </Button>
                  <Button
                    onClick={() => setSelectedDish(null)}
                    variant="outline"
                    className="w-full h-14 text-base font-bold bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:text-red-400 rounded-2xl transition-all"
                  >
                    Go Back
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Feedback Modal */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-sm glass-strong border-white/10 rounded-[2.5rem] overflow-hidden p-8 text-center"
                >
                  {feedbackSubmitted ? (
                    <div className="py-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="font-display text-2xl font-black text-white">Payment Confirmed</h3>
                      <p className="text-white/70">Order marked as paid and table freed successfully. Thank you for your feedback!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="font-display text-2xl font-black text-white">Thank you for dining with us!</h3>

                      <div className="flex justify-center gap-2 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setFeedbackRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-10 h-10 ${star <= feedbackRating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-white/20"
                                } transition-colors`}
                            />
                          </motion.button>
                        ))}
                      </div>

                      <textarea
                        placeholder="Tell us about your experience"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full h-24 p-4 rounded-xl glass-input bg-white/5 border border-white/10 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
                      />

                      <Button
                        onClick={submitFeedback}
                        disabled={feedbackRating === 0}
                        className="w-full h-14 bg-white text-black font-bold text-lg rounded-xl hover:bg-white/90 disabled:opacity-50"
                      >
                        Submit Feedback
                      </Button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div> {/* End of relative content wrapper */}
      </div>
    </PageTransition>
  );
};

// ── Strict Remount Boundary ─────────────────────────────────────────────────
// Ensures the entire component (and its state hooks) completely unmounts and
// remounts when navigating between tables to guarantee 0% state contamination.
const TablePage = () => {
  const { tableId } = useParams<{ tableId: string }>();
  return <MenuContent key={tableId} />;
};

export default TablePage;
