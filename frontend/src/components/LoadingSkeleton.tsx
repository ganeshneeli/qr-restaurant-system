import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

const LoadingSkeleton = ({ count = 6, className = "" }: LoadingSkeletonProps) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.05 }}
        className="glass rounded-lg p-6 space-y-4"
      >
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
        <div className="h-8 w-1/3 rounded skeleton-shimmer" />
      </motion.div>
    ))}
  </div>
);

export default LoadingSkeleton;
