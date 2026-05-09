"use client";

import { motion } from "framer-motion";
import AnimatedButton from "./AnimatedButton";

const premiumEase = [0.16, 1, 0.3, 1] as const;

export default function HeroSection() {
  return (
    <section className="relative min-h-screen px-3 pb-8 pt-24 sm:px-6">
      <motion.div
        className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1870px] items-center overflow-hidden rounded-[2rem] bg-black p-6 sm:rounded-[2.35rem] sm:p-10 lg:p-14"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(0,0,0,0.56), rgba(0,0,0,0.08) 52%, rgba(0,0,0,0.48)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2400&q=85')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: premiumEase }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_44%,rgba(255,244,122,0.25),transparent_18rem)]" />

        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
        >
          <motion.p
            className="mb-6 max-w-md font-mono text-xs font-bold uppercase leading-5 tracking-[0.08em] text-white sm:text-sm"
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: premiumEase } },
            }}
          >
            AI video intelligence for students. Convert lectures into searchable, conversational study systems.
          </motion.p>

          <motion.h1
            className="text-[clamp(4.5rem,14vw,12rem)] font-black leading-[0.75] tracking-normal text-[#f4ff7b]"
            variants={{
              hidden: { opacity: 0, y: 34 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: premiumEase } },
            }}
          >
            Neuralux
          </motion.h1>

          <motion.div
            className="mt-1 flex w-full items-center justify-center gap-6"
            variants={{
              hidden: { opacity: 0, y: 34 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: premiumEase } },
            }}
          >
            <span className="hidden h-px w-40 bg-[#f4ff7b] md:block" />
            <span className="font-serif text-[clamp(4rem,10vw,9.5rem)] italic leading-[0.76] text-[#f4ff7b]">
              Study OS
            </span>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: premiumEase } },
            }}
          >
            <div className="rounded-full bg-black px-5 py-3 font-mono text-sm text-white shadow-2xl">
              upload lecture → ask → revise → master
            </div>
            <AnimatedButton variant="secondary">Get Started</AnimatedButton>
          </motion.div>

          <motion.div
            className="mt-16 grid w-full max-w-4xl gap-4 md:grid-cols-2"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: premiumEase } },
            }}
          >
            {[
              ["01", "AI Chat for every lecture"],
              ["02", "Semantic search and smart timeline"],
            ].map(([number, label]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 text-left text-black shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm font-bold text-white">{number}</span>
                  <span className="text-lg font-semibold">{label}</span>
                </div>
                <span className="text-2xl leading-none">+</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
