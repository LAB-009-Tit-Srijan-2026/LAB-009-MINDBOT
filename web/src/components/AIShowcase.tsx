"use client";

import GlowCard from "./GlowCard";
import MotionWrapper from "./MotionWrapper";

const capabilities = [
  ["AI lecture chat", "Ask follow-ups without leaving the video."],
  ["Smart summaries", "Turn long explanations into crisp study notes."],
  ["Knowledge links", "Connect concepts across every lecture."],
];

export default function AIShowcase() {
  return (
    <section id="ai-system" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <MotionWrapper className="mb-16 text-center">
          <div className="section-kicker mb-7">About Neuralux</div>
          <h2 className="mx-auto max-w-4xl text-4xl font-medium tracking-normal text-black sm:text-5xl lg:text-6xl">
            AI that understands your lectures.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-black/62">
            We convert videos into searchable, conversational, and personalized learning experiences.
          </p>
        </MotionWrapper>

        <div className="grid gap-7 lg:grid-cols-[1fr_1fr_1fr] lg:items-stretch">
          <GlowCard
            className="image-card min-h-[470px] rounded-2xl"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1498050108023-c5249f4df0852?auto=format&fit=crop&w=1200&q=85')",
            }}
          >
            <div className="relative z-10 flex h-full min-h-[470px] flex-col justify-end p-7 text-white">
              <p className="text-5xl font-medium">10x</p>
              <p className="mt-4 max-w-sm text-2xl font-semibold leading-tight">
                Faster lecture review with AI chat, clips, and semantic recall.
              </p>
            </div>
          </GlowCard>

          <GlowCard
            className="image-card min-h-[470px] rounded-2xl"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85')",
            }}
          >
            <div className="relative z-10 flex h-full min-h-[470px] items-end p-7">
              <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
                <p className="text-sm font-bold text-[#ff6400]">Live AI workspace</p>
                <p className="mt-2 text-lg font-semibold">Upload video → extract concepts → revise smarter.</p>
              </div>
            </div>
          </GlowCard>

          <div className="flex flex-col justify-center">
            <p className="mb-16 text-2xl leading-10 text-black/62">
              Discover how transcripts, embeddings, and adaptive practice come together to build a learning system that feels effortless.
            </p>
            <div className="space-y-0">
              {capabilities.map(([title, desc]) => (
                <div key={title} className="border-t border-black/14 py-7 last:border-b">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <h3 className="text-3xl font-medium text-black">{title}</h3>
                      <p className="mt-2 text-base text-black/54">{desc}</p>
                    </div>
                    <span className="text-2xl text-[#ff6400]">+</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
