import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";

const RestaurantInfo = ({ className = "" }: { className?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`w-full max-w-5xl mx-auto ${className}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Address Card */}
                <Card className="glass border-white/10 p-4 group hover:neon-glow transition-all duration-500">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-1">Location</h4>
                            <p className="text-xs text-foreground/90 leading-tight font-medium">
                                OG cafe & Restaurant<br />
                                <span className="text-muted-foreground/80">Puttur & Tirupati bypass</span>
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Contact Card */}
                <Card className="glass border-white/10 p-4 group hover:neon-glow transition-all duration-500">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                            <Phone className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-accent-foreground/80 uppercase tracking-widest mb-1">Contact</h4>
                            <div className="space-y-0.5">
                                <a href="tel:+917981986524" className="block text-xs font-medium hover:text-primary transition-colors">+91 798198 6524</a>
                                <a href="tel:+918686377266" className="block text-xs font-medium hover:text-primary transition-colors">+91 86863 77266</a>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Hours Card */}
                <Card className="glass border-white/10 p-4 group hover:neon-glow transition-all duration-500 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Business Hours</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-white/5" />

                        <div className="text-center md:text-left">
                            <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold block">Cafe</span>
                            <p className="text-sm font-display font-bold text-glow-subtle whitespace-nowrap">24 / 7</p>
                        </div>

                        <div className="text-center md:text-left">
                            <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold block">Rest.</span>
                            <p className="text-sm font-display font-bold text-glow-subtle whitespace-nowrap">11am-11pm</p>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default RestaurantInfo;
