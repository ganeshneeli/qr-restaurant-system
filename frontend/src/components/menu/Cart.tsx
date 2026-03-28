import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Minus, Plus, ChefHat } from "lucide-react";

interface CartProps {
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  cart: any[];
  updateQty: (id: string, delta: number) => void;
  total: number;
  specialNote: string;
  setSpecialNote: (note: string) => void;
  placeOrder: () => void;
  ordering: boolean;
}

const Cart = ({
  showCart,
  setShowCart,
  cart,
  updateQty,
  total,
  specialNote,
  setSpecialNote,
  placeOrder,
  ordering
}: CartProps) => {
  return (
    <AnimatePresence>
      {showCart && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
          className="fixed inset-x-0 bottom-0 z-50 glass-strong border-t border-primary/20 rounded-t-2xl max-h-[65vh] overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl font-bold text-primary">Your Cart</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}><X className="h-4 w-4" /></Button>
            </div>

            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.foodId} className="flex justify-between items-center py-3 border-b border-white/5">
                    <div>
                      <p className="font-medium text-primary">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="font-bold text-primary">₹{item.price * item.quantity}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateQty(item.foodId, -1)}><Minus className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => updateQty(item.foodId, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}

                <Separator className="my-4 bg-white/10" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-display text-lg text-primary">Total</span>
                  <span className="font-display text-2xl font-bold text-primary text-glow-subtle">₹{total}</span>
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
  );
};

export default Cart;
