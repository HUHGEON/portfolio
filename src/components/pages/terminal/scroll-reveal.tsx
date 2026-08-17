"use client";

import { useEffect } from "react";

/**
 * Observes every `.reveal` element inside the terminal scroll container and adds
 * `.is-in` as it scrolls into view (fade + rise). Elements already on screen at
 * load reveal immediately. Falls back to revealing everything when
 * IntersectionObserver is unavailable.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"),
    );
    if (els.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const root = document.querySelector(".term-win");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { root: root ?? null, rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
