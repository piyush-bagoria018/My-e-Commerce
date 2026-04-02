import { Container } from "../common/Container";

const badges = [
  {
    icon: "🚚",
    title: "Free & Fast Delivery",
    desc: "Free delivery for all orders above Rs 999",
  },
  {
    icon: "🎧",
    title: "24/7 Customer Support",
    desc: "Friendly support available around the clock",
  },
  {
    icon: "✅",
    title: "Money Back Guarantee",
    desc: "No questions asked, returns within 30 days",
  },
];

export function TrustBadgesSection() {
  return (
    <section className="pt-14">
      <Container>
        <div className="grid gap-5 sm:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-8 text-center shadow-sm"
            >
              {/* Icon circle */}
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-foreground text-2xl text-white ring-4 ring-foreground/10">
                {b.icon}
              </div>
              <h3 className="font-semibold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
