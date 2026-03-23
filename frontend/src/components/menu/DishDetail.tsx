import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star, Flame, Utensils } from "lucide-react";

interface DishDetailProps {
  selectedDish: any;
  setSelectedDish: (item: any) => void;
  resolveImagePath: (path?: string) => string;
  addToCart: (item: any) => void;
}

const DishDetail = ({
  selectedDish,
  setSelectedDish,
  resolveImagePath,
  addToCart
}: DishDetailProps) => {
  return (
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
  );
};

export default DishDetail;
