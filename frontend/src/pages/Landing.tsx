import { motion } from "framer-motion";
import { QrCode, ShieldCheck, ChevronDown, Utensils, Star, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageTransition from "@/components/PageTransition";
import { useNavigate } from "react-router-dom";
import RestaurantInfo from "@/components/RestaurantInfo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const SIGNATURE_DISHES = [
  { name: "Signature Biryani", url: "https://cdn.gintaa.com/web/web_new/food_images/biryani_resta.png", category: "Chef's Special" },
  { name: "Steamed Momos", url: "https://cdn.gintaa.com/web/web_new/food_images/momo.jpg", category: "Starters" },
  { name: "Crispy Fish Fry", url: "https://cdn.gintaa.com/web/web_new/food_images/fish_fry.jpg", category: "Classic" },
  { name: "Royal Burger", url: "https://cdn.gintaa.com/web/web_new/food_images/burger.jpg", category: "Fast Food" },
  { name: "Artisan Pizza", url: "https://cdn.gintaa.com/web/web_new/food_images/pizza.jpg", category: "Italian" },
  { name: "South Special Dosa", url: "https://cdn.gintaa.com/web/web_new/food_images/dosa.jpg", category: "Breakfast" },
  { name: "Mutton Kasa", url: "https://cdn.gintaa.com/web/web_new/food_images/mutton_kasa.jpg", category: "Main Course" },
  { name: "Spicy Chilly Chicken", url: "https://cdn.gintaa.com/web/web_new/food_images/chilly-chicken.jpg", category: "Chinese" },
  { name: "Classic Roll", url: "https://cdn.gintaa.com/web/web_new/food_images/roll.jpg", category: "Street Food" },
  { name: "Hakka Chowmein", url: "https://cdn.gintaa.com/web/web_new/food_images/chowmin.jpg", category: "Chinese" },
  { name: "Stuffed Paratha", url: "https://cdn.gintaa.com/web/web_new/food_images/paratha.jpg", category: "Breakfast" },
  { name: "Refreshing Drinks", url: "https://cdn.gintaa.com/web/web_new/food_images/drink.jpg", category: "Beverages" },
  { name: "Signature Starters", url: "https://cdn.gintaa.com/web/web_new/food_images/starter.jpg", category: "Starters" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">

        {/* === HERO SECTION === */}
        <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4">
          {/* Background Video */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <video
              className="w-full h-full object-cover scale-105"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/assets/dashboard-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#050505]" />
          </div>

          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-[120px] pointer-events-none z-10 animate-pulse-slow" />

          {/* Hero Content */}
          <div className="relative z-20 flex flex-col items-center text-center max-w-5xl">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="mb-4"
            >
              <h1 className="font-display text-[10rem] md:text-[14rem] font-black tracking-tighter text-[#8B0000] drop-shadow-[0_0_25px_rgba(139,0,0,0.8)] leading-none">
                OG
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-white/40 text-sm md:text-base mb-12 tracking-[0.5em] uppercase font-light"
            >
              The Art of Fine Dining
            </motion.p>

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

        {/* === SIGNATURE DISHES CAROUSEL === */}
        <section className="relative py-32 px-4 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20 space-y-4"
            >
              <h2 className="font-display text-5xl md:text-7xl font-black tracking-tight text-glow-white">Signature Delights</h2>
              <p className="text-white/40 tracking-[0.2em] uppercase text-xs">A curated journey through our finest creations</p>
            </motion.div>

            <Carousel
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
                      <Card className="glass-strong border-white/5 overflow-hidden group border-0 bg-transparent">
                        <CardContent className="p-0 relative aspect-[4/5]">
                          <img
                            src={dish.url}
                            alt={dish.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                          <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="h-[1px] w-8 bg-white/30" />
                              <span className="text-[10px] uppercase tracking-widest text-white/50">{dish.category}</span>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-white group-hover:text-glow-white transition-all">{dish.name}</h3>
                          </div>

                          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                              <Utensils className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center mt-12 gap-4">
                <CarouselPrevious className="static translate-y-0 glass border-white/10 hover:bg-white hover:text-black w-12 h-12" />
                <CarouselNext className="static translate-y-0 glass border-white/10 hover:bg-white hover:text-black w-12 h-12" />
              </div>
            </Carousel>
          </div>
        </section>

        {/* === FEATURED HIGHLIGHT === */}
        <section className="relative py-32 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 group"
              >
                <img
                  src="https://cdn.gintaa.com/web/web_new/food_images/bengali.jpg"
                  alt="Authentic Flavors"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-10 left-10">
                  <Badge className="bg-white text-black mb-4 font-black tracking-widest px-4 py-1.5 rounded-full">MUST TRY</Badge>
                  <h3 className="font-display text-4xl font-black text-glow-white">Authentic Flavors</h3>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="font-display text-5xl md:text-6xl font-black tracking-tight leading-tight">Mastering the Art of <span className="text-glow-white">Bengali Cuisine</span></h2>
                  <p className="text-white/50 text-lg leading-relaxed">Our master chefs bring centuries of tradition to your plate. Using only the freshest ingredients and secret spices, we create memories that linger.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="glass border-white/10 px-6 py-4 rounded-2xl flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-glow-white italic">24h</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Marination</span>
                  </div>
                  <div className="glass border-white/10 px-6 py-4 rounded-2xl flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-glow-white italic">100%</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Organic</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === HOW IT WORKS / QR SECTION === */}
        <section className="relative py-32 px-4 bg-gradient-to-b from-[#050505] to-black overflow-hidden">
          {/* Background Glows */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="font-display text-5xl font-black text-glow-white">Simple. Digital. Seamless.</h2>
                  <p className="text-white/50 leading-relaxed">Experience modern dining at its finest. No apps to download, no waiting for menus. Just scan and savor.</p>
                </div>

                <div className="space-y-6">
                  {[
                    { icon: QrCode, title: "Scan QR", desc: "Find the unique code on your table." },
                    { icon: Utensils, title: "Browse & Order", desc: "Explore our digital menu in high-res." },
                    { icon: Star, title: "Enjoy", desc: "Premium service at your fingertips." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-500">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-sm text-white/40">{item.desc}</p>
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
                <div className="aspect-square bg-white/5 rounded-[2rem] border border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
                  <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-4">
                    <QrCode className="h-12 w-12 text-black" />
                  </div>
                  <p className="text-white/60 text-sm max-w-xs relative z-10">Scan the secure QR code at your table to begin your exclusive dining session.</p>
                  <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase text-white/30 mt-4 relative z-10">
                    <ShieldCheck className="h-3 w-3" />
                    Secure Table Authentication
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === RESTAURANT INFO === */}
        <section className="relative py-32 px-4 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <RestaurantInfo />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 flex flex-col items-center gap-8"
            >
              <div className="w-px h-24 bg-gradient-to-b from-white/30 to-transparent" />
              <Button
                onClick={() => navigate("/admin-login")}
                className="px-10 h-14 text-sm tracking-[0.2em] font-bold uppercase glass border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all duration-700"
                variant="outline"
              >
                <ShieldCheck className="mr-3 h-4 w-4" />
                Staff Portal
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5 text-center flex flex-col items-center gap-6">

          {/* Logo */}
          <img
            src="/fingrow-logo.png"
            alt="Fingrow Consulting Services"
            className="w-40 object-contain"
          />

          {/* Copyright */}
          <div className="text-white/70 text-sm leading-relaxed">
            <p>© 2026 Fingrow Consulting Services Pvt Ltd. All rights reserved.</p>
            <p className="text-white/50">
              QR-Based Smart Dine-In Ordering System developed by Fingrow Technology Team.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-1 text-white/60 text-sm">
            <p>
              📞 <span className="font-medium">Call / WhatsApp:</span>{" "}
              <a href="tel:+919187135171" className="hover:text-white">
                +91 9187135171
              </a>
            </p>

            <p>
              📧 <span className="font-medium">Email Us:</span>{" "}
              <a href="mailto:contact@fingrow.in" className="hover:text-white">
                contact@fingrow.in
              </a>{" "}
              |{" "}
              <a href="mailto:harish.m@fingrow.in" className="hover:text-white">
                harish.m@fingrow.in
              </a>
            </p>
          </div>

          {/* Social Media */}
          <div className="flex gap-6 text-sm text-white/60">
            <a
              href="https://www.linkedin.com/company/fingrowconsulting/posts/?feedView=all"
              target="_blank"
              className="hover:text-white"
            >
              🔗 LinkedIn
            </a>

            <a
              href="https://www.instagram.com/fingrow_technologies?igsh=MWJheXlybjR6MjFhOA%3D%3D"
              target="_blank"
              className="hover:text-white"
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
