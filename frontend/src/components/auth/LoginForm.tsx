"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { loginUser } from "@/services/auth.service";
import { useAuth } from "@/components/auth/AuthProvider";

function parseContactInput(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return { email: undefined, phone: undefined, isValid: false };

  if (value.includes("@")) {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return {
      email: isEmailValid ? value : undefined,
      phone: undefined,
      isValid: isEmailValid,
    };
  }

  const normalizedPhone = value.replace(/\s+/g, "");
  const isPhoneValid = /^\+?[0-9]{8,15}$/.test(normalizedPhone);
  return {
    email: undefined,
    phone: isPhoneValid ? normalizedPhone : undefined,
    isValid: isPhoneValid,
  };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, setUser } = useAuth();

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const showRegisteredBanner = useMemo(
    () => searchParams.get("registered") === "1",
    [searchParams]
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const contactInfo = parseContactInput(contact);
    if (!contactInfo.isValid) {
      setError("Enter a valid email address or phone number.");
      return;
    }

    if (password.trim().length === 0) {
      setError("Password is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const authResult = await loginUser({
        email: contactInfo.email,
        phone: contactInfo.phone,
        password,
      });

      setUser(authResult.user);

      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to login";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-4xl font-semibold text-foreground">Log in to your account</h1>
      <p className="mt-2 text-sm text-muted">Enter your details below</p>

      {showRegisteredBanner ? (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
          Account created successfully. Please login.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input
          type="text"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="Email or Phone Number"
          className="h-11 w-full border-b border-border bg-transparent px-1 text-sm outline-none transition focus:border-foreground"
          autoComplete="username"
          disabled={submitting}
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="h-11 w-full border-b border-border bg-transparent px-1 text-sm outline-none transition focus:border-foreground"
          autoComplete="current-password"
          disabled={submitting}
        />

        {error ? <p className="text-xs font-medium text-primary">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 h-12 w-full rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/65"
        >
          {submitting ? "Signing in..." : "Log In"}
        </button>

        <p className="pt-1 text-center text-sm text-muted">
          New user?{" "}
          <Link href="/register" className="font-semibold text-foreground underline underline-offset-2">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}