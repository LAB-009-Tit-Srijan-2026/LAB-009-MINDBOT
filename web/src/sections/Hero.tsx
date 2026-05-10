import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import WordsPullUp from "../components/WordsPullUp";
import OriginButton from "../components/OriginButton";
import "./sections.css";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Github", href: "https://github.com/LAB-009-Tit-Srijan-2026/LAB-009-MINDBOT.git", external: true },
  { label: "Dashboard", href: "https://app.athex.xyz" },
  { label: "Pricing", href: "#" },
  { label: "Inquiries", href: "#" },
];

const fadeUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

const customEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Hero() {
  return (
    <section id="hero" className="hero-section shrink-0">
      <div className="hero-video-wrapper">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
            type="video/mp4"
          />
        </video>

        {/* Noise Overlay */}
        <div className="absolute inset-0 noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none z-10" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 z-10 pointer-events-none" />

        {/* Navbar */}
        <nav className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8">
            <ul className="flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap transition-colors duration-300"
                    style={{ color: "#fefdfcff" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ffffffff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#fefefe")
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Hero Content — pinned to bottom of the rounded container */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
          <div className="grid grid-cols-12 gap-4 items-end">
            {/* Left: Giant heading */}
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] font-medium leading-[0.85] tracking-[-0.07em]"
                style={{ color: "#fefdfdff" }}
              >
                <WordsPullUp text="ATHEX" showAsterisk />
              </h1>
            </div>

            {/* Right: Description + CTA */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 sm:gap-6 pb-2">
              <motion.p
                className="text-primary/70 text-xs sm:text-sm md:text-base"
                style={{ lineHeight: 1.2, color: "#fefdfdff" }}
                variants={fadeUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5, duration: 0.8, ease: customEase }}
              >
                Athex turns any lecture video into an intelligent AI companion. Ask questions directly from your lecture. Get timestamped answers. Skip to exactly what you need — instantly.
              </motion.p>

              <OriginButton
                  href="https://app.athex.xyz"
                  bg="#ffffff"
                  hoverBg="#111111"
                  color="#000000"
                  hoverColor="#ffffff"
                  className="origin-btn--light w-45"
                >
                  <span>Join the lab</span>
                  <span className="origin-btn-arrow ">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#fff" }} />
                  </span>
                </OriginButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
