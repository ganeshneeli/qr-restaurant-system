import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Mail, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";

const RestaurantInfo = ({ className = "" }: { className?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`w-full max-w-5xl mx-auto ${className}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Address Card */}
                <Card className="glass-strong border-white/5 p-6 group hover:border-white/20 transition-all duration-700 bg-transparent">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Location</h4>
                            <p className="text-sm text-white/90 leading-relaxed font-bold">
                                OG cafe & Restaurant<br />
                                <span className="text-white/50 font-medium">Puttur & Tirupati bypass</span>
                            </p>
                            <div className="pt-2 flex justify-center">
                                <div className="text-[10px] text-white/20 flex items-center gap-1 group-hover:text-white/40 transition-colors">
                                    <ExternalLink className="h-3 w-3" />
                                    Get Directions
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact Card */}
                <Card className="glass-strong border-white/5 p-6 group hover:border-white/20 transition-all duration-700 bg-transparent">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <Phone className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Contact</h4>
                            <div className="flex flex-col gap-1">
                                <a href="tel:+917981986524" className="text-sm font-black text-white hover:text-glow-white transition-all">+91 798198 6524</a>
                                <a href="tel:+918686377266" className="text-sm font-black text-white hover:text-glow-white transition-all">+91 86863 77266</a>
                            </div>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest pt-2">Available for Bookings</p>
                        </div>
                    </div>
                </Card>

                {/* Hours Card */}
                <Card className="glass-strong border-white/5 p-6 group hover:border-white/20 transition-all duration-700 bg-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-24 h-24 -mr-8 -mt-8" />
                    </div>
                    <div className="flex flex-col items-center text-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Business Hours</h4>
                            <div className="bg-white/5 rounded-xl px-6 py-3 border border-white/5 group-hover:border-white/10 transition-colors">
                                <span className="text-[9px] uppercase tracking-tighter text-white/30 font-bold block mb-1">Cafe & Rest.</span>
                                <p className="text-lg font-display font-black text-glow-white">11am - 11pm</p>
                            </div>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest pt-1 italic">Opening Daily</p>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default RestaurantInfo;
