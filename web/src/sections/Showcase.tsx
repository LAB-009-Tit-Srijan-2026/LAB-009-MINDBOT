import { PlayCircle, Star, ArrowRight, Aperture } from "lucide-react";
import OriginButton from "../components/OriginButton";
import "./showcase.css";

export default function Showcase() {
  return (
    <section id="showcase" className="showcase-section">
      {/* Ambient background glow */}
      <div className="showcase-bg-glow" />

      {/* Outer glass card */}
      <div className="showcase-wrapper">
        <div className="showcase-grid">

          {/* ── LEFT COLUMN ── */}
          <div className="showcase-left">

            {/* Top: 2 stat cards */}
            <div className="showcase-stats-row">

              {/* Card 1 — Subscribers */}
              <div className="showcase-stat-card">
                <div className="showcase-stat-top">
                  <div className="showcase-stat-icon-row">
                    <PlayCircle
                      className="showcase-stat-icon"
                      style={{ color: "#f2f7ccff" }}
                      fill="currentColor"
                      stroke="black"
                      strokeWidth={1}
                    />
                    <h2 className="showcase-stat-number showcase-stat-number--orange">
                      70%
                    </h2>
                  </div>
<p
  className="showcase-stat-label tracking-tighter"
  style={{ wordSpacing: "5px" }}
>
  AI Accuracy Rate
</p>
                </div>
                <p className="showcase-stat-desc">
                  Every answer grounded directly
in your lecture — zero guesswork,
zero hallucination.
                </p>
              </div>

              {/* Card 2 — Learners */}
              <div className="showcase-stat-card">
                <div className="showcase-stat-top">
                  <div className="showcase-stat-icon-row">
                    <Star
                      className="showcase-stat-icon"
                      style={{ color: "#eeeea8ff" }}
                      fill="currentColor"
                      stroke="black"
                      strokeWidth={1}
                    />
                    <h2 className="showcase-stat-number showcase-stat-number--amber">
                      50k+
                    </h2>
                  </div>
                  <p className="showcase-stat-label">STUDENTS  ACROSS  INDIA</p>
                </div>
                <p className="showcase-stat-desc">
                  
Join a generation of learners who
study smarter, not harder — with
AI that actually understands their course
                </p>
              </div>

            </div>

            {/* Bottom: CTA card */}
            <div className="showcase-cta-card">
              <div className="showcase-cta-glow" />
              <div className="showcase-cta-content">

                <h3 className="showcase-cta-heading">
                  <span>UNLOCK</span>
                  <div className="showcase-avatars">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIFgSFvtUYwmj-8G7tnMueOBAsnqUpZ1rWV9yjOYIasl1wlZUvQ9ujDSMGuBiMWKWrUN8A0w0hurR6RF9JPqzCJO6lHGPahaohXopquRO9uuTvQfY7aCY1UodKLiECzVqKllJV-6K1uU9HyrFdhNZYo_eUGNyh_fI3OwNqwo7p-HRhBGYuOT93aPuBjnABd9Uh9wwiSiAExrxKG976xiYX0g2XizaxcSDJe8Uzwvn9jDHp5siRBmbbxeAT3bdiKABq4ycyqGCYv1cy"
                      alt="Student 1"
                    />
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZFqCf1D6qEXKgcwgmMzmPxpOrBW37xp9HykeeyhjJLCGxiWQK2IQFSOxmFZ0eQ8XogvIHe4sZ-vm_8BnRbDPrINZSo6PK5y0gzrEnrc-ZrZyf4fM8cYBMJROnmlMXacrPZjdJOBaljlFrFYGgm2tHJljLlEztaI7AlbWG-A3KM4a4MuwYAP8krbajKmBNOmYR83xqdNw2KCt-ex5mf5Qiu0OvqE2SuugFK11bGHO7S7l3s3g8ZWWmpJYBVG__5nb8Y4lxWKTbC0hz"
                      alt="Student 2"
                    />
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGyA5t9UQCX3VN0snOCguWpKGzSOFk5ZOd4Q3UQIKMTRRPo9E3BgvQeKbgr4DccBZ-p-j2Ju7f2SaW4nLFRqOaa-4lPecebf7z7FYHVkZp-THPVA84ClrRMZ-sVmFQcP7vjJ5MgTzoAsrk675lhsJzQNzLs_ZF2NF-L6K4RFrcfKz3zNnaRMkgnOLIMjkhTQ-Z61chW6U43_7lAQE-Kxhtf_Uy1QXI6Zr7LiKYMaSjxzbnmMfqMq5JTfDfZKmtOnGta6J97CG6MqRP"
                      alt="Student 3"
                    />
                  </div>
                  <span>YOUR</span>
                </h3>

                <button className="showcase-arrow-btn">
                  <div className="showcase-arrow-btn-line" />
                  <ArrowRight className="showcase-arrow-btn-icon" />
                </button>

                <h3 className="showcase-cta-heading-2 wordspacing-[6px]">
                  FULL LECTURE IN
UNDER 60 SECONDS.

                </h3>

              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN — Video card ── */}
          <div className="showcase-video-card">

            {/* Background image + overlays */}
            <div className="showcase-video-bg">
              <video
                src="https://res.cloudinary.com/ddfvij6hz/video/upload/v1778391022/From_KlickPin_CF_Need_fresh_inspiration__Love_these_beautiful_self-love_quote_ideas_that_bring_style_function_and_personality_together_with_aesthetic_touches_that_-_Pin-14425661317877738_v4yyvb.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="showcase-video-vignette" />
              <div className="showcase-video-tint" />
            </div>
            
            {/* Top text */}
            <div className="showcase-video-top">
              <h2 className="showcase-video-title">
                Start<br />Learning
              </h2>
            </div>

            {/* Bottom CTA */}
            <div className="showcase-video-bottom">
              <OriginButton
                onClick={() => window.location.href = 'http://localhost:3000/'}
                bg="rgba(0,0,0,0.35)"
                hoverBg="#ff5722"
                color="#ff5722"
                hoverColor="#ffffff"
                className="origin-btn--outline"
              >
                Get in touch
                <ArrowRight style={{ width: 16, height: 16 }} />
              </OriginButton>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
