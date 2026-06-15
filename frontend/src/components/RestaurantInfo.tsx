import { motion } from "framer-motion";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";

const RestaurantInfo = ({ className = "" }: { className?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`w-full max-w-5xl mx-auto ${className}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Address Card */}
                <Card className="glass-strong border-white/5 p-8 group hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:-translate-y-1.5 transition-all duration-700 bg-transparent relative overflow-hidden rounded-[2rem]">
                    {/* Glowing Accents */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col items-center text-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-black group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-500">
                            <MapPin className="h-6 w-6 text-red-400 group-hover:text-black" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Location</h4>
                            <div className="space-y-1">
                                <p className="text-base font-black text-white tracking-wide">
                                    Temptations Restaurant
                                </p>
                                <p className="text-xs text-white/50 font-medium leading-relaxed max-w-[240px] mx-auto">
                                    Opposite to Sri Chaitanya School, Muntha Vari Centre, Chirala
                                </p>
                            </div>
                            
                            <div className="pt-4 flex justify-center">
                                <a 
                                    href="https://maps.google.com/?q=Temptations+Restaurant+Chirala"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/50 uppercase tracking-widest hover:bg-red-500 hover:text-black hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Get Directions
                                </a>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact Card */}
                <Card className="glass-strong border-white/5 p-8 group hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:-translate-y-1.5 transition-all duration-700 bg-transparent relative overflow-hidden rounded-[2rem]">
                    {/* Glowing Accents */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col items-center text-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-black group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-500">
                            <Phone className="h-6 w-6 text-red-400 group-hover:text-black" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Contact</h4>
                            <div className="flex flex-col gap-2">
                                <a 
                                    href="tel:+917981986524" 
                                    className="text-base font-black text-white hover:text-red-400 hover:tracking-wide transition-all duration-300 block"
                                >
                                    +91 798198 6524
                                </a>
                                <a 
                                    href="tel:+918686377266" 
                                    className="text-base font-black text-white hover:text-red-400 hover:tracking-wide transition-all duration-300 block"
                                >
                                    +91 86863 77266
                                </a>
                            </div>
                            <div className="pt-2">
                                <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] text-white/40 uppercase tracking-widest">
                                    Available for Bookings
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Hours Card */}
                <Card className="glass-strong border-white/5 p-8 group hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:-translate-y-1.5 transition-all duration-700 bg-transparent relative overflow-hidden rounded-[2rem]">
                    {/* Glowing Accents */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-24 h-24 -mr-8 -mt-8 text-red-500" />
                    </div>
                    
                    <div className="flex flex-col items-center text-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-black group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-500">
                            <Clock className="h-6 w-6 text-red-400 group-hover:text-black" />
                        </div>
                        <div className="space-y-3 w-full">
                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Business Hours</h4>
                            
                            <div className="bg-red-950/10 rounded-2xl px-6 py-4 border border-red-900/20 group-hover:border-red-500/30 transition-all duration-500 shadow-[inset_0_0_12px_rgba(239,68,68,0.05)] w-full max-w-[200px] mx-auto">
                                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold block mb-1">Cafe & Rest.</span>
                                <p className="text-xl font-display font-black text-red-400 text-glow">11am - 11pm</p>
                            </div>
                            
                            <p className="text-[9px] text-white/30 uppercase tracking-widest pt-2 italic">Opening Daily</p>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default RestaurantInfo;
