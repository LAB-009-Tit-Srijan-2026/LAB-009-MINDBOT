"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

export default function AnimatedButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  showArrow = true,
}: AnimatedButtonProps) {
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.35 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.35 });

  const variants = {
    primary: "border-[#ff6400] bg-[#ff6400] text-white shadow-[0_16px_35px_rgba(255,100,0,0.22)] hover:bg-[#f05d00]",
    secondary: "border-black/10 bg-white text-black hover:border-[#ff6400]/50 hover:text-[#ff6400]",
    ghost: "border-transparent bg-transparent text-black/70 hover:text-black",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.14);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      whileTap={{ scale: 0.98 }}
      className={`group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-full border px-7 py-3 text-base font-semibold tracking-normal transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${variants[variant]} ${className}`}
    >
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[120%]" />
      <span className="relative z-10 whitespace-nowrap">{children}</span>
      {showArrow && (
        <span className="relative z-10 transition-transform duration-500 group-hover:translate-x-1">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <path
              d="M3.5 8.5h9.5m0 0L9.3 4.8M13 8.5l-3.7 3.7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
          </svg>
        </span>
      )}
    </motion.button>
  );
}
