import { Container } from "@/components/common/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthPageFooter } from "@/components/auth/AuthPageFooter";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef6f7]" style={{ minHeight: "100dvh" }}>
      <AuthPageHeader />

      <main className="flex-1 py-4 sm:py-6">
        <Container>
          <section className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <div className="relative hidden min-h-85 overflow-hidden rounded-2xl border border-[#d9edf2] lg:block">
              <Image
                src="/Copilot_20260322_111140.png"
                alt="Shopping background"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-[#d0ebf2]/35" />
            </div>

            <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <RegisterForm />
            </div>
          </section>
        </Container>
      </main>

      <AuthPageFooter />
    </div>
  );
}
