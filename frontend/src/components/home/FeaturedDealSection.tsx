"use client";

import { useEffect, useState } from "react";
import { Container } from "../common/Container";

// Deal active for ~5 days 23 hours 59 minutes
const DEAL_DURATION_MS =
  5 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 35 * 1000;

type Time = { days: string; hours: string; minutes: string; seconds: string };

function calcTime(target: number): Time {
  const rem = Math.max(target - Date.now(), 0);
  return {
    days: String(Math.floor(rem / 86400000)).padStart(2, "0"),
    hours: String(Math.floor((rem / 3600000) % 24)).padStart(2, "0"),
    minutes: String(Math.floor((rem / 60000) % 60)).padStart(2, "0"),
    seconds: String(Math.floor((rem / 1000) % 60)).padStart(2, "0"),
  };
}

export function FeaturedDealSection() {
  const [target] = useState(() => Date.now() + DEAL_DURATION_MS);
  const [time, setTime] = useState<Time>(() => calcTime(target));

  useEffect(() => {
    const t = setInterval(() => setTime(calcTime(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <section className="pt-14">
      <Container>
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-12 sm:px-14"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.58) 45%, rgba(0, 0, 0, 0.3) 100%), url('/home/deals/Copilot_20260328_110929.png')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            backgroundRepeat: "no-repeat",
          }}
        >

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
            {/* LEFT — copy */}
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Featured Deal
              </p>
              <h2 className="font-display text-3xl font-bold leading-snug text-white sm:text-4xl lg:text-5xl">
                Enhance Your Music Experience
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
                Up to 40 hours playtime, noise isolation, and a foldable design
                built for every lifestyle and journey.
              </p>

              {/* Countdown */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {units.map((u) => (
                  <div
                    key={u.label}
                    className="min-w-15 rounded-xl bg-white/10 px-3 py-2.5 text-center"
                  >
                    <p className="font-mono text-xl font-bold text-white">
                      {u.value}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">
                      {u.label}
                    </p>
                  </div>
                ))}
              </div>

              <button className="mt-8 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#21867a]">
                Buy Now →
              </button>
            </div>

            {/* RIGHT — kept intentionally lightweight because the product visual lives in background artwork */}
            <div className="hidden lg:block" aria-hidden="true">
              <div className="h-60 w-full" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
