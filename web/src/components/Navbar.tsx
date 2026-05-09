"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import AnimatedButton from "./AnimatedButton";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "AI System", href: "#ai-system" },
  { label: "Timeline", href: "#learning-engine" },
  { label: "Results", href: "#outcomes" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const width = useTransform(scrollY, [0, 130], ["min(1120px, calc(100vw - 32px))", "min(930px, calc(100vw - 24px))"]);
  const y = useTransform(scrollY, [0, 130], [18, 10]);

  return (
    <motion.header
      className="fixed left-0 right-0 top-0 z-50 flex justify-center"
      initial={{ opacity: 0, y: -28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      style={{ y }}
    >
      <motion.nav className="segmented-panel flex items-center justify-between gap-3 rounded-full px-3 py-2" style={{ width }}>
        <a href="#" className="group flex items-center gap-3 pl-1 pr-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-sm font-bold text-white">N</span>
          <span className="hidden text-base font-bold tracking-tight text-black sm:block">
            neural<span className="text-[#ff6400]">ux</span>
          </span>
        </a>

        <div className="hidden items-center rounded-full bg-black/[0.035] p-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-black/58 transition-colors duration-300 hover:bg-white hover:text-black"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a href="#ai-system" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-black/60 transition-colors hover:text-black sm:block">
            Explore
          </a>
          <AnimatedButton className="min-h-10 px-4 py-2 text-sm" variant="primary">
            Start
          </AnimatedButton>
        </div>
      </motion.nav>
    </motion.header>
  );
}
