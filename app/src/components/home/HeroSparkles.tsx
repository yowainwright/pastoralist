import React from "react";
import { motion } from "framer-motion";

const Star: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 10 10"
    fill={color}
    aria-hidden="true"
    style={{ filter: `drop-shadow(0 0 3px ${color})` }}
  >
    <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" />
  </svg>
);

const SPARKLES: {
  left: string;
  top: string;
  size: number;
  color: string;
  delay: number;
  duration: number;
}[] = [
  // Top edge
  { left: "5%", top: "4%", size: 12, color: "#fbbf24", delay: 0, duration: 3.2 },
  { left: "13%", top: "1%", size: 7, color: "#c084fc", delay: 1.7, duration: 2.8 },
  { left: "20%", top: "2%", size: 8, color: "#e2e8f0", delay: 1.4, duration: 2.7 },
  { left: "32%", top: "4%", size: 11, color: "#f9a8d4", delay: 0.2, duration: 3.4 },
  { left: "44%", top: "3%", size: 10, color: "#93c5fd", delay: 0.6, duration: 3.5 },
  { left: "57%", top: "1%", size: 8, color: "#fbbf24", delay: 2.8, duration: 2.6 },
  { left: "70%", top: "5%", size: 14, color: "#fbbf24", delay: 2.1, duration: 2.9 },
  { left: "79%", top: "2%", size: 7, color: "#e2e8f0", delay: 1.0, duration: 3.1 },
  { left: "90%", top: "7%", size: 9, color: "#c084fc", delay: 0.3, duration: 3.1 },
  // Left edge
  { left: "1%", top: "14%", size: 8, color: "#93c5fd", delay: 2.2, duration: 3.0 },
  { left: "1%", top: "25%", size: 11, color: "#f9a8d4", delay: 1.8, duration: 2.6 },
  { left: "4%", top: "38%", size: 7, color: "#fbbf24", delay: 0.4, duration: 3.5 },
  { left: "3%", top: "55%", size: 8, color: "#93c5fd", delay: 0.5, duration: 3.4 },
  { left: "1%", top: "67%", size: 12, color: "#e2e8f0", delay: 2.6, duration: 2.7 },
  { left: "2%", top: "78%", size: 13, color: "#fbbf24", delay: 2.3, duration: 2.8 },
  { left: "4%", top: "89%", size: 7, color: "#c084fc", delay: 1.0, duration: 3.3 },
  // Right edge
  { left: "96%", top: "16%", size: 8, color: "#f9a8d4", delay: 0.6, duration: 2.9 },
  { left: "96%", top: "22%", size: 10, color: "#e2e8f0", delay: 1.1, duration: 3.0 },
  { left: "98%", top: "35%", size: 7, color: "#fbbf24", delay: 2.0, duration: 3.4 },
  { left: "97%", top: "48%", size: 13, color: "#c084fc", delay: 0.4, duration: 3.3 },
  { left: "96%", top: "62%", size: 8, color: "#93c5fd", delay: 1.5, duration: 2.6 },
  { left: "95%", top: "72%", size: 9, color: "#f9a8d4", delay: 1.9, duration: 2.7 },
  { left: "97%", top: "85%", size: 11, color: "#fbbf24", delay: 0.1, duration: 3.2 },
  // Upper interior
  { left: "10%", top: "12%", size: 9, color: "#e2e8f0", delay: 1.3, duration: 2.8 },
  { left: "14%", top: "18%", size: 7, color: "#fbbf24", delay: 0.9, duration: 3.6 },
  { left: "25%", top: "10%", size: 10, color: "#c084fc", delay: 2.4, duration: 2.5 },
  { left: "35%", top: "16%", size: 8, color: "#93c5fd", delay: 0.7, duration: 3.0 },
  { left: "74%", top: "11%", size: 9, color: "#f9a8d4", delay: 1.6, duration: 2.7 },
  { left: "82%", top: "14%", size: 11, color: "#93c5fd", delay: 2.5, duration: 2.5 },
  { left: "88%", top: "20%", size: 7, color: "#fbbf24", delay: 0.3, duration: 3.3 },
  // Mid interior (sides, avoiding the main content center)
  { left: "7%", top: "42%", size: 10, color: "#c084fc", delay: 1.2, duration: 3.1 },
  { left: "8%", top: "60%", size: 8, color: "#f9a8d4", delay: 2.7, duration: 2.8 },
  { left: "91%", top: "38%", size: 9, color: "#e2e8f0", delay: 0.5, duration: 3.4 },
  { left: "92%", top: "57%", size: 11, color: "#fbbf24", delay: 1.8, duration: 2.6 },
  // Lower interior
  { left: "12%", top: "74%", size: 7, color: "#93c5fd", delay: 0.4, duration: 3.2 },
  { left: "18%", top: "80%", size: 9, color: "#c084fc", delay: 0.7, duration: 3.2 },
  { left: "28%", top: "76%", size: 12, color: "#fbbf24", delay: 2.1, duration: 2.9 },
  { left: "38%", top: "88%", size: 12, color: "#e2e8f0", delay: 2.0, duration: 2.8 },
  { left: "48%", top: "78%", size: 8, color: "#f9a8d4", delay: 1.4, duration: 3.5 },
  { left: "58%", top: "83%", size: 10, color: "#c084fc", delay: 0.2, duration: 3.0 },
  { left: "62%", top: "85%", size: 8, color: "#fbbf24", delay: 1.3, duration: 3.5 },
  { left: "72%", top: "77%", size: 11, color: "#93c5fd", delay: 2.6, duration: 2.7 },
  { left: "80%", top: "82%", size: 11, color: "#f9a8d4", delay: 0.2, duration: 3.1 },
  { left: "88%", top: "75%", size: 7, color: "#e2e8f0", delay: 1.7, duration: 3.4 },
  // Bottom edge
  { left: "7%", top: "95%", size: 8, color: "#fbbf24", delay: 2.3, duration: 2.6 },
  { left: "10%", top: "94%", size: 10, color: "#93c5fd", delay: 1.6, duration: 2.6 },
  { left: "22%", top: "97%", size: 7, color: "#c084fc", delay: 0.9, duration: 3.1 },
  { left: "35%", top: "95%", size: 9, color: "#e2e8f0", delay: 1.4, duration: 2.8 },
  { left: "50%", top: "96%", size: 7, color: "#c084fc", delay: 0.8, duration: 3.3 },
  { left: "63%", top: "94%", size: 11, color: "#f9a8d4", delay: 2.0, duration: 2.9 },
  { left: "75%", top: "97%", size: 8, color: "#fbbf24", delay: 0.5, duration: 3.4 },
  { left: "85%", top: "93%", size: 13, color: "#fbbf24", delay: 2.4, duration: 2.9 },
  { left: "93%", top: "95%", size: 7, color: "#93c5fd", delay: 1.1, duration: 3.0 },
];

export function HeroSparkles() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 135, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Star size={s.size} color={s.color} />
        </motion.span>
      ))}
    </div>
  );
}
