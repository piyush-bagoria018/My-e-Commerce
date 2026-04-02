"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "./Container";
import { SearchBox } from "./SearchBox";
import { useAuth } from "@/components/auth/AuthProvider";

const guestNavItems = [
  { label: "Home", href: "/" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
  { label: "Login", href: "/login" },
  { label: "Sign Up", href: "/register" },
];

const authNavItems = [
  { label: "Home", href: "/" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAccountMenuOpen]);

  const displayName = user?.fullname || user?.email || user?.phone || "Account";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    setIsAccountMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  const navItems = isLoading
    ? authNavItems
    : isAuthenticated
      ? authNavItems
      : guestNavItems;

  return (
    <header className="relative z-50 border-b border-border bg-surface/90 backdrop-blur">
      <Container className="relative flex h-20 items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          StoreNova
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-foreground/85 transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <SearchBox />
          </div>
          <Link
            href="/wishlist"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-lg transition hover:border-primary"
            aria-label="Wishlist"
          >
            ♥
          </Link>
          <Link
            href="/cart"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-lg transition hover:border-primary"
            aria-label="Cart"
          >
            🛒
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-lg transition hover:border-primary md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            ☰
          </button>

          {!isLoading && isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-sm font-semibold uppercase transition hover:border-primary"
                aria-label="Account"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
              >
                {avatarInitial}
              </button>

              {isAccountMenuOpen ? (
                <div className="absolute right-0 top-12 z-60 w-56 rounded-xl border border-border bg-white p-2 shadow-lg">
                  <p className="truncate px-3 py-2 text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <div className="my-1 h-px bg-border" />

                  <Link
                    href="/dashboard/profile"
                    className="block rounded-md px-3 py-2 text-sm text-foreground/85 transition hover:bg-slate-100"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    Manage My Account
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className="block rounded-md px-3 py-2 text-sm text-foreground/85 transition hover:bg-slate-100"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {user?.role === "admin" ? (
                    <Link
                      href="/dashboard/admin"
                      className="block rounded-md px-3 py-2 text-sm text-foreground/85 transition hover:bg-slate-100"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  ) : null}
                  <Link
                    href="/wishlist"
                    className="block rounded-md px-3 py-2 text-sm text-foreground/85 transition hover:bg-slate-100"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    My Wishlist
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary transition hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {isMobileMenuOpen ? (
          <div className="absolute inset-x-4 top-[calc(100%-8px)] z-60 rounded-xl border border-border bg-white p-4 shadow-lg md:hidden">
            <div className="mb-3 sm:hidden">
              <SearchBox />
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={`mobile-${item.label}`}
                  href={item.href}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/85 transition hover:bg-slate-50 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </Container>
    </header>
  );
}