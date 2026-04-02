import Link from "next/link";
import { Container } from "@/components/common/Container";

export function AuthPageHeader() {
  return (
    <header className="border-b border-border/60 bg-white/70 backdrop-blur">
      <Container className="flex h-18 items-center">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-foreground">
          StoreNova
        </Link>
      </Container>
    </header>
  );
}