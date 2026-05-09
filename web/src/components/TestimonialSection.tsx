"use client";

import GlowCard from "./GlowCard";
import MotionWrapper from "./MotionWrapper";

const testimonials = [
  ["Sarah Chen", "@sarahlearns", "Neuralux made my recorded lectures feel interactive. Search, chat, and flashcards are finally in one place."],
  ["Marcus Williams", "@medwithmarcus", "The smart timeline is exactly what revision needed. I jump to hard concepts instantly."],
  ["Priya Sharma", "@priyadatasci", "Premium interface, real utility. It feels like a serious AI product for learning."],
];

export default function TestimonialSection() {
  return (
    <section className="section-pad relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <MotionWrapper className="mb-16 text-center">
          <div className="section-kicker mb-7">Testimonials</div>
          <h2 className="text-4xl font-medium text-black sm:text-5xl">Words on Neuralux</h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-black/62">
            Learners use it to move faster through lectures without losing depth.
          </p>
        </MotionWrapper>

        <div className="grid gap-7 md:grid-cols-3">
          {testimonials.map(([name, handle, quote], index) => (
            <MotionWrapper key={name} delay={index * 0.08}>
              <GlowCard className={`h-[430px] rounded-2xl p-7 ${index === 1 ? "" : "dark-card"}`}>
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex gap-1 text-2xl text-[#ff6400]">★★★★★</div>
                  <p className={`text-xl leading-8 ${index === 1 ? "text-black" : "text-white"}`}>&ldquo;{quote}&rdquo;</p>
                  <div>
                    <p className={`text-lg font-bold ${index === 1 ? "text-black" : "text-white"}`}>{name}</p>
                    <p className={`mt-1 text-sm ${index === 1 ? "text-black/48" : "text-white/48"}`}>{handle}</p>
                  </div>
                </div>
              </GlowCard>
            </MotionWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
