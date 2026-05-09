"use client";

import AnimatedButton from "./AnimatedButton";
import GlowCard from "./GlowCard";

const steps = [
  ["01/", "Upload lecture"],
  ["02/", "AI maps concepts"],
  ["03/", "Ask and extract clips"],
  ["04/", "Revise with flashcards"],
];

export default function SmartTimeline() {
  return (
    <section id="learning-engine" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <GlowCard
          className="image-card min-h-[720px] rounded-[2rem] p-6 sm:p-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=85')",
          }}
        >
          <div className="relative z-10 flex min-h-[640px] items-center">
            <div className="max-w-xl rounded-[1.7rem] bg-white p-7 text-black shadow-2xl sm:p-10">
              <h2 className="text-2xl font-medium leading-snug sm:text-3xl">
                See how Neuralux turns a raw lecture into a ready-to-study AI workspace.
              </h2>
              <div className="mt-10">
                {steps.map(([num, label]) => (
                  <div key={label} className="flex items-center gap-10 border-b border-black/12 py-6 last:border-b-0">
                    <span className="text-lg font-medium">{num}</span>
                    <span className="text-2xl font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <AnimatedButton className="mt-10 w-full justify-center" variant="primary">
                Start your study flow
              </AnimatedButton>
            </div>
          </div>
        </GlowCard>
      </div>
    </section>
  );
}
