"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "./Container";
import { SearchBox } from "./SearchBox";
import { useAuth } from "@/components/auth/AuthProvider";

function WishlistIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 7C8.239 7 6 9.216 6 11.95C6 14.157 6.875 19.395 15.488 24.69C15.6423 24.7839 15.8194 24.8335 16 24.8335C16.1806 24.8335 16.3577 24.7839 16.512 24.69C25.125 19.395 26 14.157 26 11.95C26 9.216 23.761 7 21 7C18.239 7 16 10 16 10C16 10 13.761 7 11 7Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 27C11.5523 27 12 26.5523 12 26C12 25.4477 11.5523 25 11 25C10.4477 25 10 25.4477 10 26C10 26.5523 10.4477 27 11 27Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 27C25.5523 27 26 26.5523 26 26C26 25.4477 25.5523 25 25 25C24.4477 25 24 25.4477 24 26C24 26.5523 24.4477 27 25 27Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5H7L10 22H26"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 16.6667H25.59C25.7056 16.6667 25.8177 16.6267 25.9072 16.5535C25.9966 16.4802 26.0579 16.3782 26.0806 16.2648L27.8806 7.26479C27.8951 7.19222 27.8934 7.11733 27.8755 7.04552C27.8575 6.97371 27.8239 6.90678 27.7769 6.84956C27.73 6.79234 27.6709 6.74625 27.604 6.71462C27.5371 6.68299 27.464 6.66661 27.39 6.66666H8"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight"
        >
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
            className="grid h-10 w-10 place-items-center bg-white text-foreground transition hover:border-primary"
            aria-label="Wishlist"
          >
            <WishlistIcon />
          </Link>
          <Link
            href="/cart"
            className="grid h-10 w-10 place-items-center bg-white text-foreground transition hover:border-primary"
            aria-label="Cart"
          >
            <CartIcon />
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
