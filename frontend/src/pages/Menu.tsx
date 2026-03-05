import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Receipt, ShoppingCart,
  ChefHat, ClipboardList, X, Info, Search
} from "lucide-react";
import axios from "axios";
import { io as socketIO } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import RestaurantInfo from "@/components/RestaurantInfo";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

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
}
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

  // ── Fetch menu ────────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API_BASE}/menu`)
      .then(r => { setMenu(r.data?.data || r.data?.menu || r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
      if (data.tableNumber && String(data.tableNumber) !== tableId) return; // hard table guard
      if (data.sessionId && data.sessionId !== sessionId) return; // hard session guard
      fetchOrder();
      const msg: Record<string, string> = {
        preparing: "Hold tight! Deliciousness is loading… ⏳🍔",
        served: "Warning: Deliciousness has arrived! 😄",
        completed: "Session ended. Thank you!",
      };

      if (data.status === "preparing" || data.status === "served") {
        setPopupStatus(data.status);
        setShowTopPopup(true);
        setTimeout(() => setShowTopPopup(false), 5000);
      } else if (msg[data.status]) {
        toast({ title: "Update", description: msg[data.status] });
      }

      if (data.status === "completed") { localStorage.removeItem(cartKey); setCart([]); }
    };

    const onPaid = (data: { sessionId?: string; tableNumber?: number }) => {
      if (data.tableNumber && String(data.tableNumber) !== tableId) return; // hard table guard
      if (data.sessionId && data.sessionId !== sessionId) return;

      toast({ title: "✅ Paid", description: "Payment confirmed! Session ending..." });
      localStorage.removeItem(cartKey);
      setCart([]);

      setTimeout(() => {
        setSessionToken(null, tableId);
        navigate("/", { replace: true });
      }, 3000);
    };

    const onMenuUpdate = () => {
      axios.get(`${API_BASE}/menu`).then(r => setMenu(r.data?.data || r.data?.menu || r.data || []));
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
      await api.post("/orders", { items: cart.map(c => ({ foodId: c.foodId, quantity: c.quantity })) });
      toast({ title: "Order Placed! 🎉", description: "Sent to kitchen." });
      clearCart();
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
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const getQty = (id: string) => cart.find(c => c.foodId === id)?.quantity ?? 0;

  if (!sessionToken) return null;

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="min-h-screen bg-cinematic pb-28">

        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-glow-subtle">OG</h1>
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
                <Button variant="outline" size="sm" className="glass border-white/10"
                  onClick={() => { setShowMyOrders(v => !v); setShowCart(false); }}>
                  <ClipboardList className="h-4 w-4 mr-1.5" />My Order
                  <span className="ml-1.5 bg-primary/30 text-xs px-1.5 py-0.5 rounded-full">{myOrder.items.length}</span>
                </Button>
              )}

              <Button variant="outline" size="sm" className="glass border-primary/30 relative"
                onClick={() => { setShowCart(v => !v); setShowMyOrders(false); }}>
                <ShoppingCart className="h-4 w-4 mr-1.5" />Cart
                {cart.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-primary text-xs w-5 h-5 rounded-full flex items-center justify-center">
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
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${activeCategory === cat
                    ? "bg-primary/20 border-primary/40 text-primary-foreground"
                    : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Menu grid */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-3xl font-bold text-glow-subtle">
              {activeCategory === "All" ? "Our Menu" : activeCategory}
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  return (
                    <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className={`glass border-white/5 p-5 transition-all ${item.available ? "hover:neon-glow" : "opacity-60"}`}>
                        <div className="flex flex-col gap-4 mb-4">
                          {item.image && (
                            <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4 group-hover:border-primary/30 transition-colors">
                              <img src={resolveImagePath(item.image)} alt={item.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-out" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-2">
                                <h3 className="font-display text-xl font-bold tracking-tight">{item.name}</h3>
                                {item.category && <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">{item.category}</p>}
                              </div>
                              <span className="font-display font-black text-2xl text-primary shrink-0">₹{item.price}</span>
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
                          <Button onClick={() => item.available && addToCart(item)} disabled={!item.available}
                            variant="outline" className="w-full bg-primary/10 border-primary/30 hover:bg-primary/20">
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
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto">
              <Button onClick={() => setShowCart(true)}
                className="w-full h-14 bg-primary hover:bg-primary/80 font-semibold rounded-2xl neon-glow text-primary-foreground">
                <ShoppingCart className="h-5 w-5 mr-2" />
                {cart.reduce((s, c) => s + c.quantity, 0)} items · ₹{total}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Animated Popup */}
        <AnimatePresence>
          {showTopPopup && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed top-4 left-4 right-4 z-[100] max-w-sm mx-auto"
            >
              <div className="bg-background/95 backdrop-blur-md border border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.3)] rounded-2xl p-4 flex items-center gap-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
                <motion.div
                  animate={{ rotate: [0, -15, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-4xl filter drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                >
                  {popupStatus === "served" ? "🍽️" : "🍔"}
                </motion.div>
                <div className="relative z-10">
                  <h4 className="font-display font-bold text-lg text-primary tracking-wide">
                    {popupStatus === "served" ? "Arrived!" : "Cooking..."}
                  </h4>
                  <p className="text-sm font-medium leading-snug">
                    {popupStatus === "served"
                      ? "Warning: Deliciousness has arrived! 😄"
                      : "Hold tight! Deliciousness is loading... ⏳🍔"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
