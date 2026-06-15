import { motion, useScroll, useSpring } from "framer-motion";
import { 
  QrCode, 
  ShieldCheck, 
  ChevronDown, 
  Utensils, 
  Star, 
  Clock, 
  MapPin, 
  Cake, 
  IceCream, 
  Camera, 
  PartyPopper, 
  Coins, 
  Truck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageTransition from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import RestaurantInfo from "@/components/RestaurantInfo";
import VideoBackground from "@/components/VideoBackground";
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const SIGNATURE_DISHES = [
  { 
    name: "Hyderabadi Chicken Biryani", 
    url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80", 
    category: "Biryanis & Curries" 
  },
  { 
    name: "Fresh Strawberry Celebration Cake", 
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", 
    category: "Bakery Special" 
  },
  { 
    name: "Gourmet Double Cheese Burger", 
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", 
    category: "Cafe Classics" 
  },
  { 
    name: "Thick Belgian Chocolate Milkshake", 
    url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", 
    category: "Dessert Parlor" 
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();

  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (!api) return;
    
    // Slow autoplay interval (6 seconds per slide)
    const intervalId = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 6000);

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    return () => {
      clearInterval(intervalId);
    };
  }, [api]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
        {/* Scroll Progress Bar */}
        <motion.div 
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-red-500 to-amber-500 origin-left z-50"
          style={{ scaleX }}
        />

        {/* === HERO SECTION === */}
        <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4">
          {/* Background Video */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <VideoBackground 
              className="scale-105"
            />
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-[#050505]" />
          </div>

          {/* Glowing radial ornament */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-800/10 blur-[130px] pointer-events-none z-10 animate-pulse-slow" />

          {/* Hero Content */}
          <div className="relative z-20 flex flex-col items-center text-center max-w-5xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "circOut" }}
              className="flex flex-col items-center mb-6"
            >
              <h1 className="font-display text-[4.5rem] sm:text-[7rem] md:text-[9.5rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.5)] leading-[1.05] mb-2 sm:mb-4">
                Temptations
              </h1>
              
              {/* Elegant luxury line separator */}
              <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.6)] my-4" />
              
              <p className="text-red-500 font-display font-bold text-base sm:text-xl md:text-2xl tracking-[0.25em] uppercase">
                New Iceberg Temptations
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-white/70 text-sm sm:text-base md:text-lg mb-8 max-w-2xl leading-relaxed px-4"
            >
              Gourmet multi-cuisine dining, fresh bakery delights, premium cakes, thick shakes, and ice creams, all set in a cozy, photo-friendly space for family gatherings.
            </motion.p>

            {/* Quick Badges for Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-12"
            >
              <span className="glass border-white/5 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-white/80 flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-red-500" /> Dine-In
              </span>
              <span className="glass border-white/5 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-white/80 flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-red-500" /> Local Delivery
              </span>
              <span className="glass border-white/5 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-white/80 flex items-center gap-2">
                <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium p-0 px-2 py-0.5 rounded">Takeaway</Badge>
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 2 }}
              className="flex flex-col items-center gap-4 cursor-pointer"
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Scroll to Explore</p>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown className="h-4 w-4 text-white/20" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* === AT A GLANCE METADATA === */}
        <section className="relative py-16 px-4 border-y border-white/5 bg-black/40">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: "Find Us At", detail: "Opp. Sri Chaitanya School, Muntha Vari Centre, Chirala" },
              { icon: Clock, title: "We Are Open", detail: "Open Daily: 11:00 AM - 11:00 PM" },
              { icon: Coins, title: "Price Range", detail: "Moderately Priced: ₹200 - ₹400 per person" },
              { icon: ShieldCheck, title: "Our Services", detail: "Dine-in, Takeaway & Swift Local Delivery" }
            ].map((info, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:border-red-500/25 hover:shadow-[0_0_25px_rgba(239,68,68,0.1)] transition-all duration-500 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-black transition-colors duration-500">
                  <info.icon className="h-5 w-5 text-red-400 group-hover:text-black" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{info.title}</h4>
                  <p className="text-sm font-medium text-white/80 leading-snug">{info.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* === THE BENTO EXPERIENCE SHOWCASE === */}
        <section className="relative py-32 px-4 bg-[#050505] overflow-hidden">
          {/* Subtle background gradients */}
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-red-950/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-amber-950/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20 space-y-4"
            >
              <Badge className="bg-red-950/40 hover:bg-red-950/40 text-red-400 border border-red-900/50 uppercase tracking-[0.2em] px-3 py-1 text-[10px]">The Temptations Vibe</Badge>
              <h2 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-none">Experience Culinary Art</h2>
              <p className="text-white/40 tracking-[0.2em] uppercase text-xs">A harmonious blend of fine tastes and photogenic spaces</p>
            </motion.div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Card 1: Biryanis & North Indian (Wide: spans 2 columns on large screens) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-2 flex flex-col md:flex-row glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-red-500/30 hover:shadow-[0_25px_50px_rgba(239,68,68,0.12)] hover:-translate-y-2 transition-all duration-700 relative"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Left: Image */}
                <div className="w-full md:w-1/2 relative overflow-hidden aspect-[16/10] md:aspect-auto min-h-[300px]">
                  <img 
                    src="https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80" 
                    alt="Biryani and Curries" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
                  <div className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-red-400" />
                  </div>
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between relative z-10">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Savor the Heritage</span>
                    <h3 className="font-display text-3xl font-bold text-white group-hover:text-red-400 group-hover:text-glow transition-colors duration-300">Biryanis & North Indian</h3>
                    <p className="text-sm text-white/50 leading-relaxed">A rich compilation of traditional North Indian curries and fragrant, slow-cooked Biryanis bursting with authentic spices. Handcrafted with precision by our specialty chefs.</p>
                  </div>
                  <div className="border-t border-white/5 pt-6 mt-6">
                    <div className="flex flex-wrap gap-2">
                      {["Hyderabadi Biryani", "Butter Chicken Curry", "Kadhai Paneer", "Fresh Butter Naan"].map((item, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] font-bold tracking-wider text-white/50 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-xl hover:bg-red-500 hover:text-black hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-300 cursor-pointer"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Bakery & Cafe (Tall: spans 1 column) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-1 flex flex-col glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-red-500/30 hover:shadow-[0_25px_50px_rgba(239,68,68,0.12)] hover:-translate-y-2 transition-all duration-700 relative min-h-[450px]"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Full Background Image with Overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80" 
                    alt="Bakery Cakes" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/65 to-transparent" />
                </div>

                <div className="p-8 flex flex-col justify-between h-full relative z-10 flex-grow">
                  <div className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6">
                    <Cake className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Freshly Baked Every Day</span>
                    <h3 className="font-display text-3xl font-bold mb-4 text-white group-hover:text-red-400 group-hover:text-glow transition-colors duration-300">Bakery & Cafe</h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-6">Chirala's ultimate cafe hub. Treat yourself to fresh custom celebration cakes, pastries, gourmet pizzas, crispy burgers, and loaded sandwiches.</p>
                    <div className="flex flex-wrap gap-2">
                      {["Celebration Cakes", "Artisan Pizza", "Burgers"].map((item, idx) => (
                        <span 
                          key={idx} 
                          className="text-[9px] font-bold tracking-wider text-white/50 bg-black/50 border border-white/5 px-2.5 py-1 rounded-lg hover:bg-red-500 hover:text-black hover:border-red-500 transition-all duration-300 cursor-pointer"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Desserts & Shakes (Tall: spans 1 column) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1 flex flex-col glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-red-500/30 hover:shadow-[0_25px_50px_rgba(239,68,68,0.12)] hover:-translate-y-2 transition-all duration-700 relative min-h-[450px]"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Full Background Image with Overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80" 
                    alt="Dessert Milkshakes" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/65 to-transparent" />
                </div>

                <div className="p-8 flex flex-col justify-between h-full relative z-10 flex-grow">
                  <div className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6">
                    <IceCream className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Sweet Indulgence</span>
                    <h3 className="font-display text-3xl font-bold mb-4 text-white group-hover:text-red-400 group-hover:text-glow transition-colors duration-300">Shakes & Ice Cream</h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-6">Famous thick Belgian milkshakes, customized ice cream sundaes, and classic desserts to sweeten up your dining sessions.</p>
                    <div className="flex flex-wrap gap-2">
                      {["Thick Shakes", "Sundaes", "Scoops"].map((item, idx) => (
                        <span 
                          key={idx} 
                          className="text-[9px] font-bold tracking-wider text-white/50 bg-black/50 border border-white/5 px-2.5 py-1 rounded-lg hover:bg-red-500 hover:text-black hover:border-red-500 transition-all duration-300 cursor-pointer"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 4: Ambiance & Events (Wide: spans 2 columns, text on left, image on right) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 flex flex-col md:flex-row-reverse glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-red-500/30 hover:shadow-[0_25px_50px_rgba(239,68,68,0.12)] hover:-translate-y-2 transition-all duration-700 relative"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Right: Image */}
                <div className="w-full md:w-1/2 relative overflow-hidden aspect-[16/10] md:aspect-auto min-h-[300px]">
                  <img 
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80" 
                    alt="Temptations Vibe & Ambiance" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#050505] via-transparent to-transparent" />
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-red-400" />
                  </div>
                </div>

                {/* Left: Info & features */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between relative z-10">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Photo-Friendly Gatherings</span>
                    <h3 className="font-display text-3xl font-bold text-white group-hover:text-red-400 group-hover:text-glow transition-colors duration-300">Vibe & Birthday Parties</h3>
                    <p className="text-sm text-white/50 leading-relaxed">Relaxed atmosphere designed for family dinners and friends hangouts. Includes dedicated party areas suitable for birthdays and small celebrations.</p>
                  </div>
                  <div className="space-y-3 mt-6">
                    {[
                      { icon: Camera, title: "Instagrammable Corners", desc: "Cozy warm lighting and photogenic designs." },
                      { icon: PartyPopper, title: "Birthday Party Spaces", desc: "Private areas customized for group gatherings." }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-red-500/10 transition-colors">
                        <item.icon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-white leading-none mb-1">{item.title}</h4>
                          <p className="text-[11px] text-white/40 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* === SIGNATURE DELIGHTS CAROUSEL === */}
        <section className="relative py-32 px-4 bg-[#050505] border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20 space-y-4"
            >
              <Badge className="bg-red-950/40 hover:bg-red-950/40 text-red-400 border border-red-900/50 uppercase tracking-[0.2em] px-3 py-1 text-[10px]">Signature Menu</Badge>
              <h2 className="font-display text-5xl md:text-7xl font-black tracking-tight">Chef's Recommendations</h2>
              <p className="text-white/40 tracking-[0.2em] uppercase text-xs">A curated journey through our finest creations</p>
            </motion.div>

            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full relative"
            >
              <CarouselContent className="-ml-4 md:-ml-8">
                {SIGNATURE_DISHES.map((dish, index) => (
                  <CarouselItem key={index} className="pl-4 md:pl-8 basis-full sm:basis-1/2 lg:basis-1/3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index % 3 * 0.1 }}
                    >
                      <Card className="glass border-white/5 overflow-hidden group border-0 bg-transparent rounded-[2.5rem] hover:border-red-500/30 hover:shadow-[0_20px_45px_rgba(239,68,68,0.12)] transition-all duration-700 relative">
                        {/* Hover top glow line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <CardContent className="p-0 relative aspect-[4/5]">
                          <img
                            src={dish.url}
                            alt={dish.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />
                          <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="h-[1px] w-8 bg-red-500" />
                              <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">{dish.category}</span>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-white group-hover:text-red-400 group-hover:text-glow transition-all duration-300">{dish.name}</h3>
                          </div>

                          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="w-10 h-10 rounded-full bg-red-950/70 backdrop-blur-md border border-red-900/50 flex items-center justify-center">
                              <Utensils className="h-4 w-4 text-red-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center items-center mt-12 gap-4">
                <CarouselPrevious className="static translate-y-0 glass border-white/10 hover:bg-white hover:text-black w-12 h-12 rounded-full" />
                <div className="flex items-center gap-2.5 mx-4">
                  {Array.from({ length: count }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => api?.scrollTo(idx)}
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        current === idx 
                          ? "w-9 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" 
                          : "w-2.5 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
                <CarouselNext className="static translate-y-0 glass border-white/10 hover:bg-white hover:text-black w-12 h-12 rounded-full" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* === HOW IT WORKS / QR SECTION === */}
        <section className="relative py-32 px-4 border-t border-white/5 bg-gradient-to-b from-[#050505] to-black overflow-hidden">
          {/* Background Glows */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-950/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <Badge className="bg-red-950/40 hover:bg-red-950/40 text-red-400 border border-red-900/50 uppercase tracking-[0.2em] px-3 py-1 text-[10px]">Smart Order</Badge>
                  <h2 className="font-display text-5xl font-black">Scan, Order, & Savor.</h2>
                  <p className="text-white/50 leading-relaxed text-sm">Enjoy zero waiting time. Our digital tables let you place orders directly to the kitchen with complete transparency and safety.</p>
                </div>

                <div className="relative pl-8 space-y-12 border-l border-red-900/20 py-2">
                  {/* Glowing vertical line overlay */}
                  <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-red-500 via-amber-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  
                  {[
                    { icon: QrCode, title: "Scan QR Code", desc: "Scan the unique secure QR code placed on your dining table." },
                    { icon: Utensils, title: "Select Menu Items", desc: "Browse our rich multi-cuisine menu, custom bakery items, and custom shakes." },
                    { icon: Star, title: "Receive Order", desc: "Enjoy your fresh gourmet dishes served hot straight to your table." },
                  ].map((item, i) => (
                    <div key={i} className="relative group flex gap-6">
                      {/* Timeline Dot with Outer Pulsing ring */}
                      <div className="absolute -left-[45px] top-1 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black border border-red-900/60 flex items-center justify-center group-hover:bg-red-500 group-hover:text-black group-hover:border-red-500 transition-all duration-300">
                          <item.icon className="h-4 w-4 text-red-400 group-hover:text-black" />
                        </div>
                      </div>
                      <div className="pl-2">
                        <h4 className="font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{item.title}</h4>
                        <p className="text-xs text-white/40 leading-relaxed max-w-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Aura rings behind */}
                <div className="absolute inset-0 rounded-full bg-red-600/5 blur-[80px] pointer-events-none scale-90" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-red-500/10 animate-ping pointer-events-none opacity-20" />
                <div className="aspect-square bg-white/5 rounded-[2.5rem] border border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
                  <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,51,51,0.2)] mb-4 animate-bounce-slow">
                    <QrCode className="h-12 w-12 text-black" />
                  </div>
                  <h3 className="font-display text-xl font-bold">Dine-In Companion</h3>
                  <p className="text-white/60 text-xs max-w-xs relative z-10 leading-relaxed">No app downloads required. Scan to start your secure table session, select your favorite multi-cuisine dishes, and check out instantly.</p>
                  <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase text-white/30 mt-4 relative z-10">
                    <ShieldCheck className="h-3 w-3 text-red-500" />
                    Secure Session Authorization
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === RESTAURANT INFO === */}
        <section className="relative py-32 px-4 border-t border-white/5 bg-black/45">
          <div className="max-w-4xl mx-auto">
            <RestaurantInfo />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 flex flex-col items-center gap-8"
            >
              <div className="w-px h-24 bg-gradient-to-b from-red-500/30 to-transparent" />
              <Button
                onClick={() => navigate("/admin-login")}
                className="px-10 h-14 text-sm tracking-[0.2em] font-bold uppercase glass border-white/10 bg-white/5 hover:bg-red-500 hover:text-black transition-all duration-700 rounded-full"
                variant="outline"
              >
                <ShieldCheck className="mr-3 h-4 w-4 text-red-400 group-hover:text-black" />
                Staff Portal
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-white/5 text-center flex flex-col items-center gap-8 bg-black">
          {/* CGI Text Logo */}
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-black tracking-widest text-glow-white text-white">CodeGenius</span>
            <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded">CGI</span>
          </div>

          {/* Copyright */}
          <div className="text-white/70 text-sm leading-relaxed max-w-xl">
            <p>© 2026 CodeGenius Innovations (CGI). All rights reserved.</p>
            <p className="text-white/40 text-xs mt-1">
              QR-Based Smart Dine-In Ordering System developed by CodeGenius Innovations (CGI).
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2 text-white/60 text-sm">
            <p>
              📞 <span className="font-medium">Call / WhatsApp:</span>{" "}
              <a href="tel:+919187135171" className="hover:text-white transition-colors">
                +91 9187135171
              </a>
            </p>

            <p>
              📧 <span className="font-medium">Email Us:</span>{" "}
              <a href="mailto:contact@codegeniusinnovations.in" className="hover:text-white transition-colors">
                contact@codegeniusinnovations.in
              </a>
            </p>
          </div>

          {/* Social Media */}
          <div className="flex gap-6 text-xs text-white/50">
            <a
              href="https://www.linkedin.com/company/fingrowconsulting/posts/?feedView=all"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              🔗 LinkedIn
            </a>

            <a
              href="https://www.instagram.com/fingrow_technologies?igsh=MWJheXlybjR6MjFhOA%3D%3D"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              📸 Instagram
            </a>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Landing;
// No hardcoded deployment URLs found in Landing.tsx, it mostly uses local /assets/ or cdn.gintaa.com
