import { motion } from "framer-motion";
import { MapPin, BrainCircuit } from "lucide-react";
import OriginButton from "../components/OriginButton";
import "./Footer.css";

const links = [
  {
    title: "Quick links",
    items: [
      { label: "Pricing", href: "#pricing" },
      { label: "Resources", href: "#features" },
      { label: "About us", href: "#" },
      { label: "FAQ", href: "#inquiries" },
      { label: "Contact us", href: "#" },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "Facebook", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Youtube", href: "#" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms of service", href: "#" },
      { label: "Privacy policy", href: "#" },
      { label: "Cookie policy", href: "#" },
    ],
  },
];

const DotGlobe = () => {
  return (
    <div className="dotglobe-wrapper">
      <div className="dotglobe-gradient" />
      <div className="dotglobe-circle-1" />
      <div className="dotglobe-circle-2" />
      
      {/* Decorative Nodes representing map pins */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="dotglobe-node"
          style={{
            top: `${25 + Math.random() * 50}%`,
            left: `${25 + Math.random() * 50}%`,
          }}
          initial={{ opacity: 0.2, scale: 0.8 }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          <div className="dotglobe-node-inner">
            <div className="dotglobe-node-blur" />
            <MapPin className="dotglobe-node-icon" />
            <div className="dotglobe-node-dot" />
          </div>
        </motion.div>
      ))}

      {/* Abstract dotted pattern overlay */}
      <div className="footer-dotted-pattern" />
    </div>
  );
};

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      {/* Background ambient glow */}
      <div className="footer-glow" />

      {/* Main Parent Container */}
      <div className="footer-main-container">
        
        {/* Floating CTA Card */}
        <div className="footer-cta-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="cta-card"
          >
            {/* Subtle gradient hover effect inside CTA */}
            <div className="cta-hover-gradient" />
            
            {/* Glowing Globe Illustration */}
            <div className="cta-globe">
              <DotGlobe />
            </div>

            {/* CTA Content */}
            <div className="cta-content">
              <h2 className="cta-heading text-[#DDE9B5]">
                Experience superior <br />
                <span className="cta-heading-highlight">
                  AI intelligence
                </span>
              </h2>
              <p className="cta-subtitle">
                150+ neural parameters per search.
              </p>
              <OriginButton
                onClick={() => window.location.href = 'https://app.athex.xyz'}
                bg="#ffffff"
                hoverBg="#111111"
                color="#000000"
                hoverColor="#ffffff"
                className="cta-button "
              >
                Get started
              </OriginButton>
            </div>
          </motion.div>
        </div>

        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Left Section: Company Info */}
          <div className="footer-company">
            <div className="footer-logo-wrapper">
              <BrainCircuit className="footer-logo-icon" />
              <span className="footer-logo-text">
             ATHEX
              </span>
            </div>

            <div className="footer-address">
              <p>20619 Torrence Chapel Rd</p>
              <p>Suite 116 #1040.</p>
              <p>Cornelius, NC 28031</p>
              <p>United States</p>
            </div>

            <div className="footer-contacts">
              <div>
                <p className="footer-contact-label">Phone number</p>
                <p className="footer-contact-value">
                  1-800-201-1019
                </p>
              </div>
              <div>
                <p className="footer-contact-label">Email</p>
                <p className="footer-contact-value">
                  support@athex.xyz
                </p>
              </div>
            </div>
          </div>

          {/* Right Section: Link Columns */}
          <div className="footer-links-container">
            {links.map((column, idx) => (
              <div key={idx} className="footer-column">
                <h3 className="footer-column-title">{column.title}</h3>
                <ul className="footer-column-list">
                  {column.items.map((item, i) => (
                    <li key={i}>
                      <a
                        href={item.href}
                        className="footer-link"
                      >
                        <span>{item.label}</span>
                        <span className="footer-link-underline" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>© 2026 Athex. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
