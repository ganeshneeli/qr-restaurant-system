import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Info } from "lucide-react";

interface MenuItemProps {
  item: any;
  qty: number;
  isSale: boolean;
  displayPrice: number;
  resolveImagePath: (path?: string) => string;
  getBadges: (item: any) => any[];
  setSelectedDish: (item: any) => void;
  addToCart: (item: any) => void;
  updateQty: (id: string, delta: number) => void;
}

const MenuItemCard = ({
  item,
  qty,
  isSale,
  displayPrice,
  resolveImagePath,
  getBadges,
  setSelectedDish,
  addToCart,
  updateQty
}: MenuItemProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
};

export default MenuItemCard;
