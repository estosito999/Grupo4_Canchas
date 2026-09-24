"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    // Server-rendered content stays visible when animation is unavailable.
    if (
      !element ||
      motionPreference.matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.dataset.reveal = "revealed";
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );

    const showImmediately = () => {
      element.dataset.reveal = "visible";
      observer.disconnect();
    };
    const handleMotionPreference = () => {
      if (motionPreference.matches) showImmediately();
    };

    // Only prepare offscreen elements, keeping the initial viewport readable.
    const bounds = element.getBoundingClientRect();
    if (
      bounds.top >= window.innerHeight &&
      !element.contains(document.activeElement)
    ) {
      element.dataset.reveal = "pending";
    }

    element.addEventListener("focusin", showImmediately);
    motionPreference.addEventListener("change", handleMotionPreference);
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.removeEventListener("focusin", showImmediately);
      motionPreference.removeEventListener("change", handleMotionPreference);
      delete element.dataset.reveal;
    };
  }, []);

  const style = {
    "--reveal-delay": `${Number.isFinite(delay) ? Math.min(Math.max(delay, 0), 400) : 0}ms`,
  } as CSSProperties;

  return (
    <div ref={elementRef} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
