"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { registerUser } from "@/services/auth.service";
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

export function RegisterForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [fullname, setFullname] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/products");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = fullname.trim();
    if (trimmedName.length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    const contactInfo = parseContactInput(contact);
    if (!contactInfo.isValid) {
      setError("Enter a valid email address or phone number.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await registerUser({
        fullname: trimmedName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        password,
      });

      router.push("/login?registered=1");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-4xl font-semibold text-foreground">Create an account</h1>
      <p className="mt-2 text-sm text-muted">Enter your details below</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input
          type="text"
          value={fullname}
          onChange={(event) => setFullname(event.target.value)}
          placeholder="Name"
          className="h-11 w-full border-b border-border bg-transparent px-1 text-sm outline-none transition focus:border-foreground"
          autoComplete="name"
          disabled={submitting}
        />

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
          autoComplete="new-password"
          disabled={submitting}
        />

        {error ? <p className="text-xs font-medium text-primary">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 h-12 w-full rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/65"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>

        <button
          type="button"
          className="h-12 w-full rounded-md border border-border bg-white text-sm font-medium text-foreground transition hover:border-foreground"
        >
          Sign up with Google
        </button>

        <p className="pt-1 text-center text-sm text-muted">
          Already have account?{" "}
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-2">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}