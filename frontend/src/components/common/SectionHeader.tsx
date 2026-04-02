import Link from "next/link";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="inline-block h-5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>

      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}