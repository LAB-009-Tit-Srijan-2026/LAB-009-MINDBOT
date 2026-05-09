"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import GlowCard from "./GlowCard";
import MotionWrapper from "./MotionWrapper";

const features = [
  ["01", "AI Chat", "Ask questions inside your lecture and get answers grounded in the transcript."],
  ["02", "Semantic Search", "Find ideas by meaning across every video, slide, and note."],
  ["03", "Flashcards", "Generate recall cards from concepts, definitions, and exam signals."],
  ["04", "Smart Timeline", "Jump to key moments with AI-tagged timestamps and checkpoints."],
  ["05", "Clip Extraction", "Save important explanations as compact review clips."],
  ["06", "Personalized Learning", "Adapt practice difficulty and revision timing to each learner."],
];

export default function BentoGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section id="features" className="section-pad relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <MotionWrapper className="mb-14 text-center">
          <div className="section-kicker mb-7">Features</div>
          <h2 className="mx-auto max-w-3xl text-4xl font-medium tracking-normal text-black sm:text-5xl lg:text-6xl">
            A selection of AI learning modules.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-black/62">
            Explore a curated set of tools that turn passive lecture watching into active understanding.
          </p>
        </MotionWrapper>

        <div ref={ref} className="grid gap-7 lg:grid-cols-[1.35fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlowCard className="dark-card min-h-[560px] rounded-2xl p-7 sm:p-10">
              <div className="relative z-10 flex h-full flex-col justify-end">
                <div className="mx-auto mb-10 w-full max-w-sm rounded-[1.75rem] border-[10px] border-neutral-700 bg-[#f7f5f1] p-4 shadow-2xl">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-bold text-black/40">AI Tutor</p>
                    <p className="mt-3 text-lg font-semibold text-black">Explain entropy from this lecture.</p>
                    <div className="mt-5 rounded-2xl bg-black p-4 text-sm leading-6 text-white">
                      Entropy measures uncertainty. Your professor explains it with coin flips at 14:30.
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <h3 className="text-3xl font-semibold text-white">Lecture cockpit</h3>
                    <p className="mt-3 max-w-lg text-lg leading-8 text-white/64">
                      Chat, search, clips, and revision live inside one intelligent learning workspace.
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-[#ff6400] px-5 py-3 font-semibold text-white sm:block">Live AI</span>
                </div>
              </div>
            </GlowCard>
          </motion.div>

          <div className="grid gap-7">
            {features.slice(1, 4).map(([number, title, desc], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <GlowCard className="dark-card rounded-2xl p-6">
                  <div className="relative z-10">
                    <div className="mb-12 flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-bold text-black">{number}</span>
                      <span className="text-2xl text-white">+</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-base leading-7 text-white/58">{desc}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-7 md:grid-cols-3">
          {features.slice(0, 1).concat(features.slice(4)).map(([number, title, desc], index) => (
            <MotionWrapper key={title} delay={index * 0.08}>
              <GlowCard className="rounded-2xl p-6">
                <div className="relative z-10">
                  <span className="text-sm font-bold text-[#ff6400]">{number}/</span>
                  <h3 className="mt-14 text-2xl font-semibold text-black">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-black/58">{desc}</p>
                </div>
              </GlowCard>
            </MotionWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
