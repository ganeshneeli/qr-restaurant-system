import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

const AnimatedCounter = ({ value, prefix = "", suffix = "", className = "", duration = 1 }: AnimatedCounterProps) => {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setText(v));
    return unsub;
  }, [display]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
};

export default AnimatedCounter;
