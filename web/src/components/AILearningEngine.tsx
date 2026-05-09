"use client";

import GlowCard from "./GlowCard";
import MotionWrapper from "./MotionWrapper";

const components = [
  ["01", "Transcript intelligence", "Every spoken idea becomes structured searchable knowledge."],
  ["02", "Semantic memory", "Related concepts connect automatically across lectures."],
  ["03", "Adaptive practice", "Flashcards and quizzes follow the learner's weak areas."],
];

export default function AILearningEngine() {
  return (
    <section className="section-pad relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <MotionWrapper className="mb-14 text-center">
          <div className="section-kicker mb-7">Components</div>
          <h2 className="mx-auto max-w-4xl text-4xl font-medium text-black sm:text-5xl lg:text-6xl">
            A calm interface powered by deep AI architecture.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-black/62">
            The system feels simple on the surface, but every module works together underneath.
          </p>
        </MotionWrapper>

        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <GlowCard className="dark-card min-h-[560px] rounded-2xl p-8">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="grid gap-4 sm:grid-cols-3">
                {["Video", "Transcript", "Notes"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white p-5 text-black">
                    <p className="text-sm font-bold text-[#ff6400]">{item}</p>
                    <div className="mt-12 h-2 rounded-full bg-black/10" />
                    <div className="mt-2 h-2 w-2/3 rounded-full bg-black/10" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-mono text-sm uppercase tracking-[0.08em] text-white/48">Knowledge graph</p>
                <h3 className="mt-4 text-5xl font-medium text-white">From content to cognition.</h3>
              </div>
            </div>
          </GlowCard>

          <div className="grid gap-7">
            {components.map(([num, title, desc]) => (
              <GlowCard key={title} className="rounded-2xl p-7">
                <div className="relative z-10 flex gap-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-black text-sm font-bold text-white">{num}</span>
                  <div>
                    <h3 className="text-2xl font-medium text-black">{title}</h3>
                    <p className="mt-3 text-base leading-7 text-black/58">{desc}</p>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
