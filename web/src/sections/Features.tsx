import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import WordsPullUpMultiStyle from "../components/WordsPullUpMultiStyle";
import OriginButton from "../components/OriginButton";
import "./sections.css";

const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FeatureCardProps {
  index: number;
  children: React.ReactNode;
  className?: string;
}

function FeatureCard({ index, children, className = "" }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{
        delay: index * 0.15,
        duration: 0.8,
        ease: cardEase,
      }}
      className={`rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface CheckItemProps {
  text: string;
}

function CheckItem({ text }: CheckItemProps) {
  return (
    <div className="flex items-start gap-2">
      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <span className="text-gray-400 text-xs sm:text-sm leading-snug">{text}</span>
    </div>
  );
}

interface InfoCardProps {
  number: string;
  title: string;
  iconUrl: string;
  items: string[];
  index: number;
}

function InfoCard({ number, title, iconUrl, items, index }: InfoCardProps) {
  return (
    <FeatureCard index={index} className="feature-info-card">
      <div>
        <img
          src={iconUrl}
          alt={title}
          className="feature-card-icon"
        />
        <p className="feature-card-number">{number}</p>
        <h3 className="feature-card-title">{title}</h3>
        <div className="feature-card-checklist">
          {items.map((item, i) => (
            <CheckItem key={i} text={item} />
          ))}
        </div>
      </div>
      <OriginButton
        href="#"
        bg="#161616"
        hoverBg="#dde9b5"
        color="#f8f8f8"
        hoverColor="#ffffff"
        className="feature-card-link"
      >
        Learn more
        <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
      </OriginButton>
    </FeatureCard>
  );
}

const headingSegments = [
  {
    text: "Athex is your AI companion.",
    className: "text-[#E1E0CC]",
  },
  {
    text: "One video. Infinite clarity. Ask, summarize, and navigate — learn faster.",
    className: "text-gray-500",
  },
];

export default function Features() {
  return (
    <section id="features" className="features-section">
      {/* Background noise */}
      <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none" />

      <div className="features-container">
        {/* Header */}
        <div className="features-header">
          <h2 className="features-heading-text">
            <WordsPullUpMultiStyle segments={headingSegments} />
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="features-grid">
          {/* Card 1 - Video Card */}
          <FeatureCard index={0} className="feature-video-card">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://res.cloudinary.com/ddfvij6hz/video/upload/v1778365144/From_KlickPin_CF_Save_these_creative_kids_room_ideas_that_turn_ordinary_ideas_into_scroll-stopping_inspiration_using_simple_ideas_you_can_actually_pull_off_pin_-_Pin-946037465482851600_1_wmoh9y.mp4"
                type="video/mp4"
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="feature-video-text">
              <p
                className="text-base sm:text-lg font-medium"
                style={{ color: "#E1E0CC" }}
              >
                Your creative AI companion.
              </p>
            </div>
          </FeatureCard>

          {/* Card 2 - Project Storyboard */}
          <InfoCard
            index={1}
            number="01"
            title="Contextual Q&A."
            iconUrl="https://i.pinimg.com/736x/fa/85/4c/fa854c0cd8806a7abb4ea6c9c011e945.jpg"
            items={[
              "Ask anything from your lecture",
              "RAG-grounded — zero hallucination",
              "Answers sourced only from your video",
              "Full session memory retained",
            ]}
          />

          {/* Card 3 - Smart Critiques */}
          <InfoCard
            index={2}
            number="02"
            title="Smart Summaries.."
            iconUrl="https://i.pinimg.com/1200x/c6/ed/82/c6ed82cf920c7ef94a64ab2def6f3855.jpg"
            items={[
              "Topic-wise chapter summaries",
              "Last 5-minute quick recap",
              "Auto-generated chapter markers",
              "Notes and bookmarks built-in",
            ]}
          />

          {/* Card 4 - Immersion Capsule */}
          <InfoCard
            index={3}
            number="03"
            title="Jump-to-Moment."
            iconUrl="https://i.pinimg.com/1200x/9b/5a/52/9b5a52e2b31513eb77508dadd1d11765.jpg"
            items={[
              "Clickable timestamp answers",
              " Skip to the exact video moment",
              " Streaming real-time responses",
              "Works with YouTube and uploads",
            ]}
          />
        </div>
      </div>
    </section>
  );
}
