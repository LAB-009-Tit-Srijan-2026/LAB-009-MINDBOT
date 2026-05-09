"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import GlowCard from "./GlowCard";
import MotionWrapper from "./MotionWrapper";

const stats = [
  [10000, "+", "Lectures processed"],
  [500000, "+", "AI study interactions"],
  [98, "%", "Faster revision"],
  [4.9, "/5", "Learner rating"],
] as const;

function Counter({ value, suffix, active }: { value: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 1600);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value]);

  const display = value >= 1000 ? `${Math.round(count / 1000)}k` : value % 1 ? count.toFixed(1) : Math.round(count);
  return <>{display}{suffix}</>;
}

export default function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section id="outcomes" className="section-pad relative">
      <div ref={ref} className="mx-auto max-w-7xl px-5 sm:px-6">
        <MotionWrapper className="mb-14 text-center">
          <div className="section-kicker mb-7">Results</div>
          <h2 className="mx-auto max-w-3xl text-4xl font-medium text-black sm:text-5xl">
            Built for measurable learning outcomes.
          </h2>
        </MotionWrapper>

        <div className="grid gap-5 md:grid-cols-4">
          {stats.map(([value, suffix, label], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlowCard className="rounded-2xl p-7 text-center">
                <div className="relative z-10">
                  <p className="text-sm font-bold text-[#ff6400]">0{index + 1}/</p>
                  <p className="mt-10 text-5xl font-medium text-black">
                    <Counter value={value} suffix={suffix} active={inView} />
                  </p>
                  <p className="mt-4 text-lg text-black/58">{label}</p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
