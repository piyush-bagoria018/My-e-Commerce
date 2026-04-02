
"use client";

import Link from "next/link";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Container } from "@/components/common/Container";

export default function AboutPage() {
  const stats = [
    { icon: "🏪", label: "Active Sellers", value: "2,500+" },
    { icon: "📦", label: "Products", value: "150k+" },
    { icon: "😊", label: "Happy Customers", value: "500k+" },
    { icon: "⭐", label: "Avg Rating", value: "4.8/5" },
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      desc: "10+ years in ecommerce",
    },
    {
      name: "Ahmed Khan",
      role: "Head of Operations",
      desc: "Logistics & fulfillment expert",
    },
    {
      name: "Priya Patel",
      role: "Product Lead",
      desc: "Creating amazing experiences",
    },
  ];

  return (
    <>
      <TopBar />
      <Header />

      <main className="py-10 sm:py-12">
        <Container>
          {/* Breadcrumb */}
          <div className="mb-8 text-sm text-muted">
            <Link href="/" className="hover:text-primary">Home</Link> / <span>About Us</span>
          </div>

          {/* Our Story Section */}
          <section className="mb-16">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h1 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
                  Our Story
                </h1>
                <div className="space-y-4 text-muted">
                  <p>
                    Founded in 2020, we built this platform to make online shopping simpler, faster, and more trustworthy. What started as a vision to connect great sellers with smart buyers has grown into a community serving hundreds of thousands.
                  </p>
                  <p>
                    Today, we proudly host over 2,500 verified sellers and 150,000+ products across fashion, electronics, home & living, and more. We&apos;re committed to fair pricing, quality assurance, and exceptional customer service.
                  </p>
                  <p>
                    Every day, we work to make online shopping better—because your time matters, and your satisfaction is our success.
                  </p>
                </div>
              </div>

              {/* Placeholder for image - simple gradient */}
              <div className="h-64 md:h-80 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border border-border flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl mb-2">🚀</p>
                  <p className="text-muted text-sm">Growth & Innovation</p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-16">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">By The Numbers</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-6 text-center hover:border-primary transition">
                  <p className="text-4xl mb-2">{stat.icon}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Values Section */}
          <section className="mb-16 bg-surface rounded-2xl p-8 md:p-12 border border-border">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">Our Values</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <p className="text-5xl mb-3">✓</p>
                <h3 className="font-semibold text-foreground mb-2">Trust First</h3>
                <p className="text-sm text-muted">Verified sellers, secure payments, buyer protection always</p>
              </div>
              <div className="text-center">
                <p className="text-5xl mb-3">⚡</p>
                <h3 className="font-semibold text-foreground mb-2">Speed Matters</h3>
                <p className="text-sm text-muted">Fast delivery, quick support, real-time order tracking</p>
              </div>
              <div className="text-center">
                <p className="text-5xl mb-3">💡</p>
                <h3 className="font-semibold text-foreground mb-2">Always Improving</h3>
                <p className="text-sm text-muted">We listen to feedback and constantly make things better</p>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section>
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">Meet Our Team</h2>
            <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
              {team.map((member, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden hover:border-primary transition">
                  <div className="h-48 bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-5xl">
                    👤
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-primary text-sm font-medium mt-1">{member.role}</p>
                    <p className="text-muted text-sm mt-2">{member.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </>
  );
}