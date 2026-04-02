import Link from "next/link";
import { Container } from "./Container";

const accountLinks = [
  { label: "My Account", href: "/dashboard/profile" },
  { label: "Login / Register", href: "/login" },
  { label: "Cart", href: "/cart" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Shop", href: "/products" },
];

const quickLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Use", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Contact", href: "/contact" },
];

const socials = [
  { label: "Facebook", icon: "f", href: "#" },
  { label: "Twitter", icon: "𝕏", href: "#" },
  { label: "Instagram", icon: "◎", href: "#" },
  { label: "LinkedIn", icon: "in", href: "#" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-black text-white">
      <Container className="pt-10 pb-7 ">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Col 1 — Brand + Subscribe */}
          <div className="lg:col-span-1">
            <h3 className="font-display text-2xl font-bold text-white">
              StoreNova
            </h3>
            <p className="mt-4 text-base font-semibold text-white">Subscribe</p>
            <p className="mt-1 text-sm text-white/60">
              Get 10% off your first order
            </p>
            <div className="mt-3 flex h-11 overflow-hidden rounded-md border border-white/20">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/40 outline-none"
              />
              <button
                type="button"
                className="flex items-center justify-center px-3 text-white/50 transition hover:text-white"
                aria-label="Subscribe"
              >
                ➤
              </button>
            </div>
          </div>

          {/* Col 2 — Support */}
          <div>
            <h4 className="mb-5 font-semibold text-white">Support</h4>
            <address className="not-italic space-y-3 text-sm text-white/60 leading-relaxed">
              <p>StoreNova HQ, Mumbai,<br />Maharashtra 400001, India.</p>
              <p>
                <a href="mailto:support@storenova.in" className="transition hover:text-accent">
                  support@storenova.in
                </a>
              </p>
              <p>
                <a href="tel:+919876543210" className="transition hover:text-accent">
                  +91 98765 43210
                </a>
              </p>
            </address>
          </div>

          {/* Col 3 — Account */}
          <div>
            <h4 className="mb-5 font-semibold text-white">Account</h4>
            <ul className="space-y-3 text-sm">
              {accountLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-white/60 transition hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Quick Links */}
          <div>
            <h4 className="mb-5 font-semibold text-white">Quick Link</h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-white/60 transition hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5 — Download App + Socials */}
          <div>
            <h4 className="mb-3 font-semibold text-white">Download App</h4>
            <p className="text-xs text-white/50 mb-4">
              Save 10% with App — New User Only
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="flex h-10 items-center gap-2 rounded-lg border border-white/20 px-3 text-xs font-medium text-white/80 transition hover:border-accent hover:text-accent"
              >
                <span className="text-base">▶</span> Google Play
              </a>
              <a
                href="#"
                className="flex h-10 items-center gap-2 rounded-lg border border-white/20 px-3 text-xs font-medium text-white/80 transition hover:border-accent hover:text-accent"
              >
                <span className="text-base"></span> App Store
              </a>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-xs text-white/70 transition hover:border-accent hover:text-accent"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          © Copyright StoreNova {new Date().getFullYear()}. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}