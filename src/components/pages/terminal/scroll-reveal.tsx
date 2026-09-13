"use client";

import { animate, splitText, stagger } from "animejs";
import { useEffect } from "react";

/** Counts every number inside the element up from 0, keeping the surrounding text and commas. */
function countUp(el: HTMLElement) {
  const source = el.textContent ?? "";
  const parts = source.split(/(\d[\d,]*(?:\.\d+)?)/);
  if (!parts.some((part) => /^\d/.test(part))) return;

  const state = { t: 0 };
  animate(state, {
    t: 1,
    duration: 1100,
    ease: "outExpo",
    onUpdate: () => {
      el.textContent = parts
        .map((part) => {
          if (!/^\d/.test(part)) return part;
          const decimals = part.split(".")[1]?.length ?? 0;
          const value = Number(part.replace(/,/g, "")) * state.t;
          return value.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: part.includes(","),
          });
        })
        .join("");
    },
    onComplete: () => {
      el.textContent = source;
    },
  });
}

/** Reveals one `.reveal` block: it rises in, then its `[data-stagger]` children cascade. */
function reveal(el: HTMLElement) {
  el.classList.add("is-in");
  animate(el, { opacity: [0, 1], translateY: [16, 0], duration: 700, ease: "outExpo" });

  const items = el.querySelectorAll<HTMLElement>("[data-stagger] > *");
  if (items.length > 0) {
    animate(items, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 600,
      delay: stagger(45, { start: 120 }),
      ease: "outExpo",
    });
  }
  el.querySelectorAll<HTMLElement>("[data-countup]").forEach(countUp);

  const bars = el.querySelectorAll<HTMLElement>("[data-bar]");
  if (bars.length > 0) {
    animate(bars, {
      scaleX: [0, 1],
      duration: 700,
      delay: stagger(60, { start: 200 }),
      ease: "outExpo",
    });
  }
}

/** Types a shell command out character by character; resolves with the typing time in ms. */
function typeOut(el: HTMLElement, start = 0) {
  const text = el.textContent ?? "";
  const duration = text.length * 45;
  el.style.display = "inline-block";
  el.style.minWidth = `${text.length}ch`;
  el.textContent = "";
  const state = { n: 0 };
  animate(state, {
    n: text.length,
    duration,
    delay: start,
    ease: "linear",
    onUpdate: () => {
      el.textContent = text.slice(0, Math.round(state.n));
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
  return start + duration;
}

/**
 * Motion layer for the terminal pages (anime.js): scroll-in reveals with
 * staggered children, number count-ups, the hero name split-in, and the cursor
 * position for `.spotlight` card borders. Under prefers-reduced-motion (or
 * without IntersectionObserver) everything is simply shown.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    // shell prompts type out first, then the hero name rises in after them
    let typed = 0;
    document.querySelectorAll<HTMLElement>("[data-type]:not([data-typed])").forEach((el) => {
      el.dataset.typed = "true";
      typed = Math.max(typed, typeOut(el, 150));
    });

    const heroName = document.querySelector<HTMLElement>("[data-split]:not([data-split-done])");
    if (heroName) {
      heroName.dataset.splitDone = "true";
      const { chars } = splitText(heroName, { chars: true });
      animate(chars, {
        opacity: [0, 1],
        translateY: ["0.45em", 0],
        duration: 800,
        delay: stagger(35, { start: typed + 60 }),
        ease: "outExpo",
      });
    }

    // reveal anything that has entered — or already scrolled past — the viewport.
    // A position check (not IntersectionObserver) so fast scrolls and TOC jumps never
    // leave a section stuck invisible.
    const root = document.querySelector<HTMLElement>(".term-win");
    const scroller: HTMLElement | Window = root ?? window;
    let pending = els;
    let frame = 0;
    const check = () => {
      frame = 0;
      const bottom = root ? root.getBoundingClientRect().bottom : window.innerHeight;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < bottom - 40) {
          reveal(el);
          return false;
        }
        return true;
      });
      if (pending.length === 0) scroller.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    check();

    const onMove = (event: PointerEvent) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".spotlight");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
