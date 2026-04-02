"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/common/Footer";
import { Header } from "@/components/common/Header";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  changeCurrentUserPassword,
  updateAccountDetails,
} from "@/services/auth.service";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [zipCode, setZipCode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setFullname(user.fullname || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");

    const defaultAddress = user.address?.find((item) => item.isDefault) || user.address?.[0];
    if (defaultAddress) {
      setStreet(defaultAddress.street || "");
      setCity(defaultAddress.city || "");
      setState(defaultAddress.state || "");
      setCountry(defaultAddress.country || "India");
      setZipCode(defaultAddress.zipCode || "");
    }
  }, [user]);

  const handleSave = async () => {
    const nextFullname = fullname.trim();
    const nextEmail = email.trim();
    const nextPhone = phone.trim();
    const nextStreet = street.trim();
    const nextCity = city.trim();
    const nextState = state.trim();
    const nextCountry = country.trim();
    const nextZipCode = zipCode.trim();

    const hasAddress = Boolean(
      nextStreet || nextCity || nextState || nextCountry || nextZipCode
    );

    if (!nextFullname && !nextEmail && !nextPhone && !hasAddress) {
      setMessage("Please fill at least one field.");
      return;
    }

    if (
      hasAddress &&
      (!nextStreet || !nextCity || !nextState || !nextCountry || !nextZipCode)
    ) {
      setMessage("Fill all primary address fields or keep all empty.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await updateAccountDetails({
        fullname: nextFullname || undefined,
        email: nextEmail || undefined,
        phone: nextPhone || undefined,
        address: hasAddress
          ? [
              {
                street: nextStreet,
                city: nextCity,
                state: nextState,
                country: nextCountry,
                zipCode: nextZipCode,
                isDefault: true,
              },
            ]
          : undefined,
      });

      await refreshUser();
      setMessage("Account details updated successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update account";
      setMessage(text);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const oldPass = currentPassword.trim();
    const nextPass = newPassword.trim();
    const confirmPass = confirmPassword.trim();

    if (!oldPass || !nextPass || !confirmPass) {
      setPasswordMessage("All password fields are required.");
      return;
    }

    if (nextPass.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }

    if (nextPass !== confirmPass) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMessage("");

      await changeCurrentUserPassword({
        oldPassword: oldPass,
        newPassword: nextPass,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to change password";
      setPasswordMessage(text);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <Header />

      <main className="pb-8 pt-8">
        <Container>
          <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Manage My Account
            </h1>
            <p className="mt-2 text-sm text-muted">
              Update your profile details and contact information.
            </p>

            {isLoading ? (
              <p className="mt-6 text-sm text-muted">Loading account details...</p>
            ) : null}

            {!isLoading && !isAuthenticated ? (
              <p className="mt-6 text-sm text-muted">Redirecting to login...</p>
            ) : null}

            {!isLoading && isAuthenticated ? (
              <div className="mt-7 rounded-xl border border-border bg-white p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Full Name
                    </span>
                    <input
                      type="text"
                      value={fullname}
                      onChange={(event) => setFullname(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Full name"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Email"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Phone
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Phone"
                      disabled={saving}
                    />
                  </label>

                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Role
                    </span>
                    <p className="mt-2 text-sm font-medium capitalize text-foreground">{user?.role || "user"}</p>
                  </div>

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Street Address
                    </span>
                    <input
                      type="text"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Street address"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      City
                    </span>
                    <input
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="City"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      State
                    </span>
                    <input
                      type="text"
                      value={state}
                      onChange={(event) => setState(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="State"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Country
                    </span>
                    <input
                      type="text"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Country"
                      disabled={saving}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Zip Code
                    </span>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(event) => setZipCode(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Zip code"
                      disabled={saving}
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/60 sm:w-auto"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  {message ? <p className="text-sm text-primary">{message}</p> : null}
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h2 className="text-lg font-semibold text-foreground">Password Changes</h2>

                  <div className="mt-4 grid gap-4">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Current Password"
                      disabled={changingPassword}
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="New Password"
                      disabled={changingPassword}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                      placeholder="Confirm New Password"
                      disabled={changingPassword}
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="inline-flex h-11 w-full items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted sm:w-auto"
                      >
                        {changingPassword ? "Changing..." : "Change Password"}
                      </button>

                      {passwordMessage ? (
                        <p className="text-sm text-primary">{passwordMessage}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </Container>
      </main>

      <Footer />
    </>
  );
}