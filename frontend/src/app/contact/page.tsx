
"use client";

import Link from "next/link";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import { TopBar } from "@/components/common/TopBar";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Container } from "@/components/common/Container";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSubmitted(false);

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setErrorMessage("Email service is not configured. Please check env keys.");
      setLoading(false);
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          title: "Website Contact Inquiry",
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "Not provided",
          message: formData.message,
          time: new Date().toLocaleString(),
        },
        publicKey
      );

      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar />
      <Header />

      <main className="py-10 sm:py-12">
        <Container>
          <div className="mb-8 text-sm text-muted">
            <Link href="/" className="hover:text-primary">Home</Link> / <span>Contact Us</span>
          </div>

          <h1 className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">Get In Touch</h1>
          <p className="mb-8 text-muted sm:mb-12">We are here to help. Reach out anytime.</p>

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📞</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Call Us</h3>
                    <p className="text-sm text-muted mb-3">Mon-Fri, 9am-6pm</p>
                    <p className="text-primary font-medium">+880 1XXX-XXXX-99</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">✉️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Email Us</h3>
                    <p className="text-sm text-muted mb-3">Respond within 24 hours</p>
                    <div className="space-y-1">
                      <p className="text-primary font-medium text-sm">support@exclusive.com</p>
                      <p className="text-primary font-medium text-sm">hello@exclusive.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📍</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Visit Us</h3>
                    <p className="text-sm text-muted">Gurgaon, India</p>
                    <p className="text-sm text-muted mt-2">7 days a week</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-5 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Name</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary disabled:bg-gray-100"
                      placeholder="John Doe"
                      disabled={loading}
                    />
                  </label>

                  <label>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary disabled:bg-gray-100"
                      placeholder="john@example.com"
                      disabled={loading}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Phone</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary disabled:bg-gray-100"
                      placeholder="+880 1234567890"
                      disabled={loading}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Message</span>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-100 resize-none"
                      placeholder="Tell us how we can help..."
                      disabled={loading}
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    type="submit"
                    disabled={loading || submitted}
                    className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary/60 sm:w-auto"
                  >
                    {loading ? "Sending..." : submitted ? "Sent!" : "Send Message"}
                  </button>

                  {submitted && (
                    <p className="text-sm text-primary font-medium">Thanks for reaching out!</p>
                  )}

                  {errorMessage && (
                    <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}