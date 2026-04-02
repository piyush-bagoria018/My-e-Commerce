import Link from "next/link";

export function AuthPageFooter() {
  return (
    <footer className="border-t border-border/60 bg-[#eef6f7]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} StoreNova</p>
        <div className="flex items-center gap-4">
          <Link href="#" className="transition hover:text-foreground">
            Privacy
          </Link>
          <Link href="#" className="transition hover:text-foreground">
            Terms
          </Link>
          <Link href="/contact" className="transition hover:text-foreground">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}