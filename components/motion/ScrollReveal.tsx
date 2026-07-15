"use client";

import { useEffect } from "react";

/**
 * Global scroll-reveal driver. Server components opt in by adding
 * `data-reveal` (and optionally `style={{ "--reveal-delay": "120ms" }}` for
 * stagger) — this observer adds `.is-revealed` as they enter the viewport.
 *
 * Progressive enhancement: the hidden state only exists under
 * `html[data-motion="on"]`, which is stamped here, after anything already
 * in the viewport has been marked revealed — so there is no first-paint
 * flash, and no JS (or reduced motion) means no hiding at all.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    const seen = new WeakSet<Element>();
    const register = (initial: boolean) => {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        // On first load, anything already on screen stays visible — the
        // reveal is reserved for content the user scrolls to.
        if (initial && el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.classList.add("is-revealed");
        } else {
          io.observe(el);
        }
      });
    };

    register(true);
    document.documentElement.dataset.motion = "on";

    // Client-side navigations swap <main> content — pick up new opt-ins.
    const mo = new MutationObserver(() => register(false));
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      delete document.documentElement.dataset.motion;
    };
  }, []);

  return null;
}
