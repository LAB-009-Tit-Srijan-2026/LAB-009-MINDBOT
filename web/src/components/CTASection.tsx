"use client";

import AnimatedButton from "./AnimatedButton";
import GlowCard from "./GlowCard";

export default function CTASection() {
  return (
    <section className="section-pad relative">
      <div className="mx-auto max-w-[1880px] px-3 sm:px-6">
        <GlowCard className="dark-card rounded-[2rem] p-8 text-center sm:p-16 lg:p-24">
          <div className="relative z-10 mx-auto max-w-5xl">
            <h2 className="text-[clamp(4rem,12vw,12rem)] font-black leading-[0.82] tracking-normal text-white">
              learn
            </h2>
            <p className="font-serif text-[clamp(4rem,10vw,10rem)] italic leading-[0.82] text-white">
              smarter
            </p>
            <p className="mx-auto mt-8 max-w-2xl text-xl leading-9 text-white/62">
              Create an AI study workspace from any lecture and start revising with context.
            </p>
            <div className="mt-10 flex justify-center">
              <AnimatedButton>Get Started</AnimatedButton>
            </div>
          </div>
        </GlowCard>
      </div>
    </section>
  );
}
