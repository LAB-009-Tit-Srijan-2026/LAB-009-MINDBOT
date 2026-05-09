"use client";

import { HTMLAttributes, ReactNode } from "react";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function GlowCard({ children, className = "", ...props }: GlowCardProps) {
  return (
    <div
      {...props}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
        props.onMouseMove?.(event);
      }}
      className={`premium-card rounded-[1.5rem] ${className}`}
    >
      {children}
    </div>
  );
}
