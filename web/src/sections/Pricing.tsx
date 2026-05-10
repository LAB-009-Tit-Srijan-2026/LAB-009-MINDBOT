import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";
import OriginButton from "../components/OriginButton";
import "./pricing.css";

const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const plans = [
  {
    id: "starter",
    badge: "01",
    name: "Starter",
    price: "$19",
    tagline: "Essential tools to get your learning off the ground.",
    featured: false,
    features: [
      "Standard email support",
      "Basic analytics dashboard",
      "Limited automation actions",
      "1 project / workspace included",
      "Essential tools for basic workflow",
    ],
  },
  {
    id: "growth",
    badge: "02",
    name: "Growth",
    price: "$29",
    tagline: "Scale your workflow with advanced AI-powered features.",
    featured: true,
    features: [
      "Priority customer support",
      "Integrations with popular apps",
      "Advanced automation workflows",
      "Detailed analytics & performance insights",
      "Unlimited projects and team collaboration",
    ],
  },
  {
    id: "enterprise",
    badge: "03",
    name: "Enterprise",
    price: "$49",
    tagline: "Full control, security, and dedicated support at scale.",
    featured: false,
    features: [
      "Dedicated account manager",
      "Enterprise-level security & controls",
      "API access and custom integrations",
      "Custom workflows and advanced rules",
      "Unlimited team members with admin controls",
    ],
  },
];

interface PricingCardProps {
  plan: (typeof plans)[0];
  index: number;
}

function PricingCard({ plan, index }: PricingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 40, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
      transition={{ delay: index * 0.12, duration: 0.75, ease: cardEase }}
      className={`pricing-card ${plan.featured ? "pricing-card--featured" : ""}`}
    >
      {plan.featured && (
        <div className="pricing-featured-badge">Most Popular</div>
      )}

      <div className="pricing-card-inner">
        {/* Badge + Name */}
        <p className="pricing-badge">{plan.badge}/</p>
        <h3 className="pricing-plan-name">{plan.name}</h3>
        <p className="pricing-tagline">{plan.tagline}</p>

        {/* Price */}
        <div className="pricing-price-row">
          <span className="pricing-amount">{plan.price}</span>
          <span className="pricing-period">/month</span>
        </div>

        {/* Divider */}
        <div className="pricing-divider">
          <div className="pricing-divider-line" />
          <span className="pricing-divider-label">Includes</span>
          <div className="pricing-divider-line" />
        </div>

        {/* Features */}
        <ul className="pricing-features">
          {plan.features.map((f) => (
            <li key={f} className="pricing-feature-item">
              <Check
                className="pricing-check-icon"
                style={{ color: "#f9f5f3ff" }}
              />
              <span className="pricing-feature-text">{f}</span>
            </li>
          ))}
        </ul>

        <OriginButton
          href="http://localhost:3000/"
          bg={plan.featured ? "#ffffff" : "#DDE9B5"}
          hoverBg={plan.featured ? "#DDE9B5" : "#ffffff"}
          color={plan.featured ? "#111111" : "#1a1a1a"}
          hoverColor="#111111"
          className="pricing-cta"
        >
          Get Started
        </OriginButton>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="pricing-section">
      {/* Background noise overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.12] pointer-events-none" />

      <div className="pricing-container">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ y: 30, opacity: 0 }}
          animate={headerInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ duration: 0.7, ease: cardEase }}
          className="pricing-header"
        >
          <p className="pricing-section-label">Pricing</p>
          <h2 className="pricing-section-heading">
            <span style={{ color: "#E1E0CC" }}>Smart pricing for </span>
            <span style={{ color: "#ffffffff" }}>every stage.</span>
          </h2>
          <p className="pricing-section-sub">
            Find the perfect balance of features, performance, and
            affordability. All plans include a 14-day free trial.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="pricing-footer-note"
        >
          No credit card required. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
