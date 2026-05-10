import { useRef, useState, startTransition } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./OriginButton.css";

interface OriginButtonProps {
  /** Button label / content */
  children: React.ReactNode;
  /** If provided renders as <a> tag */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Normal background colour */
  bg?: string;
  /** Expanding circle colour on hover */
  hoverBg?: string;
  /** Normal text colour */
  color?: string;
  /** Text colour when hovered */
  hoverColor?: string;
  /** Extra class names */
  className?: string;
  /** Link target */
  target?: string;
  rel?: string;
}

export default function OriginButton({
  children,
  href,
  onClick,
  bg = "#ffffff",
  hoverBg = "#1a1a1a",
  color = "#000000",
  hoverColor = "#ffffff",
  className = "",
  target,
  rel,
}: OriginButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const scale = useMotionValue(0);
  const spring = useSpring(scale, { stiffness: 85, damping: 18, restDelta: 0.001 });
  const eased = useTransform(spring, [0, 1], [0, 1]);

  const onEnter = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    startTransition(() => {
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      setHovered(true);
    });
    scale.set(1);
  };

  const onLeave = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    startTransition(() => {
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      setHovered(false);
    });
    scale.set(0);
  };

  const shared = {
    ref: ref as React.RefObject<HTMLButtonElement & HTMLAnchorElement>,
    className: `origin-btn ${className}`,
    style: { backgroundColor: bg, color: hovered ? hoverColor : color } as React.CSSProperties,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onClick,
    ...(href ? { href, target, rel } : {}),
  };

  const Tag = href ? "a" : "button";

  return (
    <Tag {...(shared as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {/* Cursor-origin expanding circle */}
      <motion.span
        className="origin-btn-circle"
        style={{ left: pos.x, top: pos.y, backgroundColor: hoverBg, scale: eased }}
      />
      {/* Content sits above the circle */}
      <span className="origin-btn-label">{children}</span>
    </Tag>
  );
}
