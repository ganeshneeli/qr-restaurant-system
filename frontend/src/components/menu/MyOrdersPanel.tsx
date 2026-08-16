import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Receipt } from "lucide-react";

interface MyOrdersPanelProps {
  showMyOrders: boolean;
  setShowMyOrders: (show: boolean) => void;
  myOrder: any;
  requestBill: () => void;
  STATUS_COLORS: Record<string, string>;
}

const ITEM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  cooking: { label: "Cooking 🔥", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  served:  { label: "Served ✓",  className: "bg-green-500/15 text-green-400 border-green-500/30" },
};

const MyOrdersPanel = ({
  showMyOrders,
  setShowMyOrders,
  myOrder,
  requestBill,
  STATUS_COLORS
}: MyOrdersPanelProps) => {
  return (
    <AnimatePresence>
      {showMyOrders && myOrder && (
        <motion.div data-lenis-prevent initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
          className="fixed inset-x-0 bottom-0 z-50 glass-strong border-t border-white/10 rounded-t-2xl max-h-[75vh] overflow-y-auto">
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

            <div className="space-y-2.5 mb-4">
              {myOrder.items.map((item: any, i: number) => {
                const iStatus: string = item.itemStatus || "pending";
                const cfg = ITEM_STATUS_CONFIG[iStatus] || ITEM_STATUS_CONFIG.pending;
                const isServed = iStatus === "served";
                return (
                  <div key={i} className={`flex justify-between items-center gap-2 py-2.5 px-3 rounded-xl border transition-all duration-300 ${
                    isServed ? "border-white/5 bg-white/[0.01] opacity-60" : "border-white/10 bg-white/[0.03]"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isServed ? "line-through text-white/40" : "text-white"}`}>
                        {item.name || item.foodId}
                      </p>
                      <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm text-white/60">₹{(item.price || 0) * item.quantity}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between font-semibold text-lg mb-5 px-1">
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
  );
};

export default MyOrdersPanel;
