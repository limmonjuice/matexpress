"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { SectionHeading } from "./section-heading";

/** Slack so sub-pixel layouts don't leave an arrow enabled at the very end. */
const EDGE = 4;

type Props = {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
};

/** A section whose row people move themselves, by swipe or arrows. It never advances on its own. */
export function ProductRow({ title, viewAllHref, children }: Props) {
  const row = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ overflows: false, atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const next = {
      overflows: el.scrollWidth - el.clientWidth > EDGE,
      atStart: el.scrollLeft <= EDGE,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE,
    };
    setState((prev) =>
      prev.overflows === next.overflows && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
    );
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const move = (direction: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <>
      <SectionHeading
        title={title}
        viewAllHref={viewAllHref}
        actions={
          state.overflows && (
            <div className="hm-row-arrows">
              <button type="button" aria-label={`Previous ${title}`} disabled={state.atStart} onClick={() => move(-1)}>
                <ChevronLeftIcon />
              </button>
              <button type="button" aria-label={`Next ${title}`} disabled={state.atEnd} onClick={() => move(1)}>
                <ChevronRightIcon />
              </button>
            </div>
          )
        }
      />
      <ul ref={row} className="hm-row" aria-label={title} onScroll={measure} data-reveal>
        {children}
      </ul>
    </>
  );
}
